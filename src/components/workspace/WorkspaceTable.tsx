import { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ChevronRight, ChevronDown, Check, X, GripVertical } from 'lucide-react';
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
  filterFn?: (task: any) => boolean;
}

function SortableTableRow({ task, status, isExpanded, isHovered, subtasks, onRowClick, onMouseEnter, onMouseLeave, onToggleExpand, onStartAddSubtask, children }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasSubtasks = subtasks.length > 0;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      onClick={onRowClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="cursor-pointer hover:bg-muted/50"
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <button {...attributes} {...listeners} className="cursor-grab touch-none">
            <GripVertical className="h-4 w-4 text-muted-foreground opacity-50 hover:opacity-100" />
          </button>
          <AnimatePresence mode="wait">
            {(isHovered || hasSubtasks || isExpanded) && (
              <motion.button
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                onClick={onToggleExpand}
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
          <span className="truncate">{task.title}</span>
          {hasSubtasks && (
            <span className="text-xs text-muted-foreground">
              ({subtasks.filter((s: any) => s.completed).length}/{subtasks.length})
            </span>
          )}
        </div>
      </TableCell>
      {children}
    </TableRow>
  );
}

export function WorkspaceTable({ workspaceId, filterFn }: WorkspaceTableProps) {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<string>('');
  const [addingSubtaskForTask, setAddingSubtaskForTask] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

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
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: any }) => {
      const { error } = await supabase
        .from('workspace_tasks')
        .update(updates)
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] }),
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async ({ subtaskId, completed }: { subtaskId: string; completed: boolean }) => {
      const { error } = await supabase
        .from('workspace_subtasks')
        .update({ completed })
        .eq('id', subtaskId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] }),
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
    onError: () => toast.error('Erro ao adicionar subtarefa'),
  });

  const filteredTasks = useMemo(() => {
    if (!filterFn) return tasks;
    return tasks.filter(filterFn);
  }, [tasks, filterFn]);

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredTasks.findIndex(t => t.id === active.id);
    const newIndex = filteredTasks.findIndex(t => t.id === over.id);
    
    const reorderedTasks = arrayMove(filteredTasks, oldIndex, newIndex);
    
    for (let i = 0; i < reorderedTasks.length; i++) {
      await updateTaskMutation.mutateAsync({
        taskId: reorderedTasks[i].id,
        updates: { order_index: i }
      });
    }
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

        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px] sm:w-[300px]">Tarefa</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Data</TableHead>
                    <TableHead className="hidden lg:table-cell">Tags</TableHead>
                    <TableHead className="hidden xl:table-cell">Responsável</TableHead>
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
                      <React.Fragment key={task.id}>
                        <SortableTableRow
                          task={task}
                          status={status}
                          isExpanded={isExpanded}
                          isHovered={isHovered}
                          subtasks={subtasks}
                          onRowClick={() => setSelectedTaskId(task.id)}
                          onMouseEnter={() => setHoveredRow(task.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          onToggleExpand={(e: React.MouseEvent) => hasSubtasks ? toggleExpanded(task.id, e) : startAddingSubtask(task.id, e)}
                          onStartAddSubtask={(e: React.MouseEvent) => startAddingSubtask(task.id, e)}
                        >
                          <TableCell className="hidden sm:table-cell">
                            {status && (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: status.color }} />
                                <span className="truncate">{status.name}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {task.date ? format(new Date(task.date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {task.tags?.slice(0, 2).map((tag: string, index: number) => (
                                <span key={index} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
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
                          <TableCell className="hidden xl:table-cell">{task.responsible || '-'}</TableCell>
                        </SortableTableRow>
                        
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
                                    <div className="flex items-center gap-3 pl-12" onClick={(e) => e.stopPropagation()}>
                                      <Checkbox
                                        checked={subtask.completed}
                                        onCheckedChange={(checked) => 
                                          toggleSubtaskMutation.mutate({ subtaskId: subtask.id, completed: checked as boolean })
                                        }
                                      />
                                      <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                                        {subtask.title}
                                      </span>
                                    </div>
                                  </TableCell>
                                </motion.tr>
                              ))}
                              
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
                                      className="flex items-center gap-2 pl-12"
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
                                      className="flex items-center gap-2 pl-12 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </SortableContext>
          </DndContext>
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma tarefa encontrada
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

import React from 'react';
