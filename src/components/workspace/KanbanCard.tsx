import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Calendar, CheckCircle2, Circle, RefreshCw, Video } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { parseDateStringToLocal } from '@/lib/utils';

interface KanbanCardProps {
  task: any;
  onClick?: () => void;
  isDragging?: boolean;
  isCompleted?: boolean;
  isBacklog?: boolean;
}

export function KanbanCard({ task, onClick, isDragging, isCompleted, isBacklog }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const subtasksCompleted = task.workspace_subtasks?.filter((s: any) => s.completed).length || 0;
  const subtasksTotal = task.workspace_subtasks?.length || 0;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        onClick={onClick}
        className={`p-3 cursor-pointer transition-all duration-200 border-border/30 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 ${
          isDragging ? 'shadow-lg shadow-primary/20 border-primary' : ''
        } ${isCompleted ? 'opacity-50' : ''}`}
        style={{ backgroundColor: 'hsl(var(--surface-2))' }}
        data-context-type="task"
        data-context-id={task.id}
        data-context-name={task.title}
        data-context-actions="edit,---,delete"
      >
        <div className="flex items-start gap-1.5 mb-2">
          {isBacklog && (
            <span title="Tarefa recorrente">
              <RefreshCw className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
            </span>
          )}
          {task.precisa_gravar === 'precisa_gravar' && (
            <span title="Precisa gravar">
              <Video className="h-3 w-3 mt-0.5 text-violet-400 flex-shrink-0" />
            </span>
          )}
          <h4 className={`font-medium text-sm text-foreground ${isCompleted ? 'line-through' : ''}`}>{task.title}</h4>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          {task.date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(parseDateStringToLocal(task.date)!, 'dd MMM', { locale: ptBR })}</span>
            </div>
          )}

          {subtasksTotal > 0 && (
            <div className="flex items-center gap-1">
              {subtasksCompleted === subtasksTotal ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
              <span>
                {subtasksCompleted}/{subtasksTotal}
              </span>
            </div>
          )}

          {task.responsible && (
            <div className="flex items-center gap-1">
              <span className="bg-muted px-1.5 py-0.5 rounded text-xs">
                {task.responsible}
              </span>
            </div>
          )}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.slice(0, 2).map((tag: string, index: number) => (
              <span
                key={index}
                className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                +{task.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
