import { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, rectIntersection } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { CreateTaskDialog } from './CreateTaskDialog';
import { CreateStatusDialog } from './CreateStatusDialog';
import { TaskDetailsPanel } from './TaskDetailsPanel';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const BACKLOG_ID = '__backlog__';
const BACKLOG_STATUS = { id: BACKLOG_ID, name: 'Backlog', color: '#6B7280', isBacklog: true } as any;

interface WorkspaceKanbanProps {
  workspaceId: string;
  filterFn?: (task: any) => boolean;
}

export function WorkspaceKanban({ workspaceId, filterFn }: WorkspaceKanbanProps) {
  const queryClient = useQueryClient();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateStatusOpen, setIsCreateStatusOpen] = useState(false);
  const [selectedStatusForNewTask, setSelectedStatusForNewTask] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
    },
  });

  const filteredTasks = useMemo(() => {
    if (!filterFn) return tasks;
    return tasks.filter(filterFn);
  }, [tasks, filterFn]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over) return;
    
    const taskId = active.id as string;
    const overId = over.id as string;
    
    if (taskId === overId) return;

    const activeTask = tasks.find(t => t.id === taskId);
    if (!activeTask) return;

    // Backlog column treated as null status
    const isBacklogTarget = overId === BACKLOG_ID;
    const targetStatus = isBacklogTarget ? BACKLOG_STATUS : statuses.find(s => s.id === overId);
    
    if (targetStatus) {
      // Moving to a different status column
      const targetStatusId = isBacklogTarget ? null : targetStatus.id;
      if (activeTask.status_id !== targetStatusId) {
        try {
          await updateTaskMutation.mutateAsync({
            taskId,
            updates: { status_id: targetStatusId }
          });
          toast({
            title: 'Tarefa movida',
            description: `Movido para "${targetStatus.name}"`,
          });
        } catch (error: any) {
          toast({
            title: 'Erro ao mover tarefa',
            description: error.message,
            variant: 'destructive',
          });
        }
      }
    } else {
      // Dropping on another task - check if it's in a different status
      const overTask = tasks.find(t => t.id === overId);
      
      if (overTask) {
        if (activeTask.status_id !== overTask.status_id) {
          // Moving to a different status (dropping on a task in that status)
          try {
            await updateTaskMutation.mutateAsync({
              taskId,
              updates: { status_id: overTask.status_id }
            });
            toast({
              title: 'Tarefa movida',
              description: 'Status da tarefa atualizado.',
            });
          } catch (error: any) {
            toast({
              title: 'Erro ao mover tarefa',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          // Reordering within the same column
          const statusTasks = tasks.filter(t => t.status_id === activeTask.status_id);
          const oldIndex = statusTasks.findIndex(t => t.id === taskId);
          const newIndex = statusTasks.findIndex(t => t.id === overId);
          
          if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
            const reorderedTasks = arrayMove(statusTasks, oldIndex, newIndex);
            
            // Update order_index for all tasks in this status
            for (let i = 0; i < reorderedTasks.length; i++) {
              await updateTaskMutation.mutateAsync({
                taskId: reorderedTasks[i].id,
                updates: { order_index: i }
              });
            }
          }
        }
      }
    }
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);

  const deleteStatusMutation = useMutation({
    mutationFn: async (statusId: string) => {
      // Set tasks status_id to null
      await supabase.from('workspace_tasks').update({ status_id: null }).eq('status_id', statusId);
      const { error } = await supabase.from('workspace_statuses').delete().eq('id', statusId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      toast({ title: 'Status excluído', description: 'Tarefas movidas para Backlog.' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const allColumns = [BACKLOG_STATUS, ...statuses];

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateStatusOpen(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Status
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={(event) => setActiveTaskId(event.active.id as string)}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
            {allColumns.map((status: any) => {
              const isBacklog = status.id === BACKLOG_ID;
              const statusTasks = isBacklog
                ? filteredTasks.filter(t => !t.status_id)
                : filteredTasks.filter(t => t.status_id === status.id);
              
              return (
                <motion.div
                  key={status.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="min-w-[280px]"
                >
                  <SortableContext
                    items={statusTasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <KanbanColumn
                      status={status}
                      tasks={statusTasks}
                      onTaskClick={setSelectedTaskId}
                      onAddTask={() => {
                        setSelectedStatusForNewTask(isBacklog ? null : status.id);
                        setIsCreateTaskOpen(true);
                      }}
                      onDeleteStatus={isBacklog ? undefined : () => deleteStatusMutation.mutate(status.id)}
                    />
                  </SortableContext>
                </motion.div>
              );
            })}
          </div>

          <DragOverlay>
            {activeTask && <KanbanCard task={activeTask} isDragging />}
          </DragOverlay>
        </DndContext>
      </div>

      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        workspaceId={workspaceId}
        defaultStatusId={selectedStatusForNewTask}
      />

      <CreateStatusDialog
        open={isCreateStatusOpen}
        onOpenChange={setIsCreateStatusOpen}
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