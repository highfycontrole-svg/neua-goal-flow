import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { CreateTaskDialog } from './CreateTaskDialog';
import { TaskDetailsPanel } from './TaskDetailsPanel';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core';
import { toast } from '@/hooks/use-toast';

interface WorkspaceCalendarProps {
  workspaceId: string;
  filterFn?: (task: any) => boolean;
}

// Helper function to parse date string without timezone issues
const parseDateString = (dateStr: string | null): Date | undefined => {
  if (!dateStr) return undefined;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Draggable task component
function DraggableCalendarTask({ task, status, onClick }: { task: any; status: any; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        ...style,
        backgroundColor: status?.color || '#6B7280',
        color: 'white',
      }}
      className="text-xs p-1.5 rounded cursor-grab active:cursor-grabbing hover:opacity-90 transition-opacity"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={task.title}
    >
      <div className="font-medium truncate">{task.title}</div>
      {task.tags && task.tags.length > 0 && (
        <div className="flex gap-0.5 mt-0.5 flex-wrap">
          {task.tags.slice(0, 2).map((tag: string, idx: number) => (
            <span key={idx} className="bg-white/20 px-1 rounded text-[10px]">
              {tag}
            </span>
          ))}
        </div>
      )}
      {task.responsible && (
        <div className="text-[10px] opacity-80 mt-0.5 truncate">
          {task.responsible}
        </div>
      )}
    </div>
  );
}

// Droppable day cell
function DroppableDay({ day, isCurrentMonth, isToday, children }: { 
  day: Date; 
  isCurrentMonth: boolean; 
  isToday: boolean; 
  children: React.ReactNode 
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: format(day, 'yyyy-MM-dd'),
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] p-2 rounded-lg border transition-all duration-200 ${
        isToday
          ? 'border-primary'
          : isOver
          ? 'border-primary/50 bg-primary/5'
          : 'border-border/30'
      }`}
      style={{ 
        backgroundColor: isOver 
          ? 'rgba(59, 130, 246, 0.1)' 
          : isCurrentMonth 
          ? '#1e1e1e' 
          : '#191919'
      }}
    >
      <div className="text-sm font-medium mb-2">
        {format(day, 'd')}
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

export function WorkspaceCalendar({ workspaceId, filterFn }: WorkspaceCalendarProps) {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const { data: tasks = [] } = useQuery({
    queryKey: ['workspace-tasks', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .not('date', 'is', null);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ['workspace-statuses', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_statuses')
        .select('*')
        .eq('workspace_id', workspaceId);
      
      if (error) throw error;
      return data;
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, date }: { taskId: string; date: string }) => {
      const { error } = await supabase
        .from('workspace_tasks')
        .update({ date })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
    },
  });

  const filteredTasks = filterFn ? tasks.filter(filterFn) : tasks;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTasksForDay = (day: Date) => {
    return filteredTasks.filter(task => {
      if (!task.date) return false;
      const taskDate = parseDateString(task.date);
      return taskDate && isSameDay(taskDate, day);
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const newDate = over.id as string;

    try {
      await updateTaskMutation.mutateAsync({ taskId, date: newDate });
      toast({
        title: 'Data atualizada',
        description: 'A tarefa foi movida para a nova data.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar data',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const activeTask = tasks.find(t => t.id === activeTaskId);
  const activeTaskStatus = activeTask ? statuses.find(s => s.id === activeTask.status_id) : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentDate(new Date())}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button onClick={() => setIsCreateTaskOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>

        {/* Calendar Grid */}
        <Card className="p-4 border-border/50" style={{ backgroundColor: '#161616' }}>
          <DndContext
            sensors={sensors}
            onDragStart={(event) => setActiveTaskId(event.active.id as string)}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-7 gap-2">
              {/* Week Days Header */}
              {weekDays.map((day) => (
                <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {calendarDays.map((day, index) => {
                const dayTasks = getTasksForDay(day);
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = isSameDay(day, new Date());

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.01 }}
                  >
                    <DroppableDay day={day} isCurrentMonth={isCurrentMonth} isToday={isToday}>
                      {dayTasks.map((task) => {
                        const status = statuses.find(s => s.id === task.status_id);
                        return (
                          <DraggableCalendarTask
                            key={task.id}
                            task={task}
                            status={status}
                            onClick={() => setSelectedTaskId(task.id)}
                          />
                        );
                      })}
                    </DroppableDay>
                  </motion.div>
                );
              })}
            </div>

            <DragOverlay>
              {activeTask && (
                <div
                  className="text-xs p-1.5 rounded cursor-grabbing shadow-lg"
                  style={{
                    backgroundColor: activeTaskStatus?.color || '#6B7280',
                    color: 'white',
                  }}
                >
                  <div className="font-medium truncate">{activeTask.title}</div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </Card>
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