import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateTaskDialog } from './CreateTaskDialog';
import { TaskDetailsPanel } from './TaskDetailsPanel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface WorkspaceTableProps {
  workspaceId: string;
  searchQuery: string;
}

export function WorkspaceTable({ workspaceId, searchQuery }: WorkspaceTableProps) {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

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

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <TableHead>Tarefa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => {
                const status = statuses.find(s => s.id === task.status_id);
                return (
                  <TableRow
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{task.title}</TableCell>
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
