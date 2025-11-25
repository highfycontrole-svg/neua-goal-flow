import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
  searchQuery: string;
}

export function WorkspaceKanban({ workspaceId, searchQuery }: WorkspaceKanbanProps) {
  const queryClient = useQueryClient();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateStatusOpen, setIsCreateStatusOpen] = useState(false);
  const [selectedStatusForNewTask, setSelectedStatusForNewTask] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
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
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const newStatusId = over.id as string;

    try {
      const { error } = await supabase
        .from('workspace_tasks')
        .update({ status_id: newStatusId })
        .eq('id', taskId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
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
          onDragStart={(event) => setActiveTaskId(event.active.id as string)}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {statuses.map((status) => {
              const statusTasks = filteredTasks.filter(t => t.status_id === status.id);
              
              return (
                <motion.div
                  key={status.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
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
