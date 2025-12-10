import { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
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
      activationConstraint: { distance: 8 },
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

    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropping on a status column
    const isStatusColumn = statuses.some(s => s.id === overId);
    
    if (isStatusColumn) {
      // Move to a new status
      try {
        await updateTaskMutation.mutateAsync({
          taskId,
          updates: { status_id: overId }
        });
        toast({
          title: 'Tarefa atualizada',
          description: 'O status da tarefa foi alterado com sucesso.',
        });
      } catch (error: any) {
        toast({
          title: 'Erro ao atualizar tarefa',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      // Reordering within the same column
      const activeTask = tasks.find(t => t.id === taskId);
      const overTask = tasks.find(t => t.id === overId);
      
      if (activeTask && overTask && activeTask.status_id === overTask.status_id) {
        const statusTasks = tasks.filter(t => t.status_id === activeTask.status_id);
        const oldIndex = statusTasks.findIndex(t => t.id === taskId);
        const newIndex = statusTasks.findIndex(t => t.id === overId);
        
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
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);

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
          collisionDetection={closestCenter}
          onDragStart={(event) => setActiveTaskId(event.active.id as string)}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
            {statuses.map((status) => {
              const statusTasks = filteredTasks.filter(t => t.status_id === status.id);
              
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
                        setSelectedStatusForNewTask(status.id);
                        setIsCreateTaskOpen(true);
                      }}
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
