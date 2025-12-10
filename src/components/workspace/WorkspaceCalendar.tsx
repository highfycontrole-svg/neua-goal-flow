import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { CreateTaskDialog } from './CreateTaskDialog';
import { TaskDetailsPanel } from './TaskDetailsPanel';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface WorkspaceCalendarProps {
  workspaceId: string;
  filterFn?: (task: any) => boolean;
}

export function WorkspaceCalendar({ workspaceId, filterFn }: WorkspaceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

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

  const filteredTasks = filterFn ? tasks.filter(filterFn) : tasks;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTasksForDay = (day: Date) => {
    return filteredTasks.filter(task => {
      if (!task.date) return false;
      return isSameDay(new Date(task.date), day);
    });
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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
        <Card className="p-4">
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
                  className={`min-h-[120px] p-2 rounded-lg border transition-colors ${
                    isToday
                      ? 'border-primary bg-primary/5'
                      : isCurrentMonth
                      ? 'border-border bg-card'
                      : 'border-border/50 bg-muted/30'
                  }`}
                >
                  <div className="text-sm font-medium mb-2">
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.map((task) => {
                      const status = statuses.find(s => s.id === task.status_id);
                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className="text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: status?.color || '#6B7280',
                            color: 'white',
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
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
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
