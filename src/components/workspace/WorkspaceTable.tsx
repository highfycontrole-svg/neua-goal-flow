import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ChevronRight, ChevronDown, Check, X } from 'lucide-react';
import { CreateTaskDialog } from './CreateTaskDialog';
import { TaskDetailsPanel } from './TaskDetailsPanel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface WorkspaceTableProps {
  workspaceId: string;
  searchQuery: string;
}

export function WorkspaceTable({ workspaceId, searchQuery }: WorkspaceTableProps) {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<string>('');
  const [addingSubtaskForTask, setAddingSubtaskForTask] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: statuses = [] } = useQuery({
    queryKey: ['workspace-statuses', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_statuses')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['workspace-tasks', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('*, workspace_subtasks(*)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async ({ subtaskId, completed }: { subtaskId: string; completed: boolean }) => {
      const { error } = await supabase
        .from('workspace_subtasks')
        .update({ completed })
        .eq('id', subtaskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
    },
  });

  const addSubtaskMutation = useMutation({
    mutationFn: async ({ taskId, title }: { taskId: string; title: string }) => {
      const { error } = await supabase
        .from('workspace_subtasks')
        .insert({ task_id: taskId, title, completed: false });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      setNewSubtaskTitle('');
      setAddingSubtaskForTask(null);
      toast.success('Subtarefa adicionada!');
    },
    onError: () => {
      toast.error('Erro ao adicionar subtarefa');
    },
  });

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpanded = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleAddSubtask = (taskId: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (newSubtaskTitle.trim()) {
      addSubtaskMutation.mutate({ taskId, title: newSubtaskTitle.trim() });
    }
  };

  const startAddingSubtask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTasks(prev => new Set([...prev, taskId]));
    setAddingSubtaskForTask(taskId);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateTaskOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Tarefa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => {
                const status = statuses.find(s => s.id === task.status_id);
                const subtasks = task.workspace_subtasks || [];
                const isExpanded = expandedTasks.has(task.id);
                const hasSubtasks = subtasks.length > 0;
                const isHovered = hoveredRow === task.id;

                return (
                  <>
                    <TableRow
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      onMouseEnter={() => setHoveredRow(task.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <AnimatePresence mode="wait">
                            {(isHovered || hasSubtasks || isExpanded) && (
                              <motion.button
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                onClick={(e) => hasSubtasks ? toggleExpanded(task.id, e) : startAddingSubtask(task.id, e)}
                                className="p-0.5 hover:bg-muted rounded transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </motion.button>
                            )}
                          </AnimatePresence>
                          <span>{task.title}</span>
                          {hasSubtasks && (
                            <span className="text-xs text-muted-foreground">
                              ({subtasks.filter((s: any) => s.completed).length}/{subtasks.length})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {status && (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                            <span>{status.name}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.date
                          ? format(new Date(task.date), 'dd/MM/yyyy', { locale: ptBR })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {task.tags?.slice(0, 2).map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {task.tags && task.tags.length > 2 && (
                            <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                              +{task.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{task.responsible || '-'}</TableCell>
                    </TableRow>
                    
                    {/* Subtasks rows */}
                    <AnimatePresence>
                      {isExpanded && (
                        <>
                          {subtasks.map((subtask: any) => (
                            <motion.tr
                              key={subtask.id}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-muted/30"
                            >
                              <TableCell colSpan={5} className="py-2">
                                <div 
                                  className="flex items-center gap-3 pl-8"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Checkbox
                                    checked={subtask.completed}
                                    onCheckedChange={(checked) => 
                                      toggleSubtaskMutation.mutate({ 
                                        subtaskId: subtask.id, 
                                        completed: checked as boolean 
                                      })
                                    }
                                  />
                                  <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                                    {subtask.title}
                                  </span>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                          
                          {/* Add subtask input row */}
                          {addingSubtaskForTask === task.id && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-muted/30"
                            >
                              <TableCell colSpan={5} className="py-2">
                                <form 
                                  onSubmit={(e) => handleAddSubtask(task.id, e)}
                                  className="flex items-center gap-2 pl-8"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Input
                                    autoFocus
                                    placeholder="Nova subtarefa..."
                                    value={newSubtaskTitle}
                                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                  <Button type="submit" size="sm" variant="ghost" className="h-8 px-2">
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 px-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAddingSubtaskForTask(null);
                                      setNewSubtaskTitle('');
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </form>
                              </TableCell>
                            </motion.tr>
                          )}

                          {/* Add subtask button */}
                          {addingSubtaskForTask !== task.id && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-muted/20"
                            >
                              <TableCell colSpan={5} className="py-1">
                                <button
                                  onClick={(e) => startAddingSubtask(task.id, e)}
                                  className="flex items-center gap-2 pl-8 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <Plus className="h-3 w-3" />
                                  Adicionar subtarefa
                                </button>
                              </TableCell>
                            </motion.tr>
                          )}
                        </>
                      )}
                    </AnimatePresence>
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa criada ainda'}
          </div>
        )}
      </motion.div>

      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        workspaceId={workspaceId}
      />

      <TaskDetailsPanel
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
      />
    </>
  );
}
