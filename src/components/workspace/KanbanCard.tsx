import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface KanbanCardProps {
  task: any;
  onClick?: () => void;
  isDragging?: boolean;
}

export function KanbanCard({ task, onClick, isDragging }: KanbanCardProps) {
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
        className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${
          isDragging ? 'shadow-lg' : ''
        }`}
      >
        <h4 className="font-medium text-sm mb-2 text-foreground">{task.title}</h4>
        
        {task.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {task.date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(task.date), 'dd MMM', { locale: ptBR })}</span>
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
