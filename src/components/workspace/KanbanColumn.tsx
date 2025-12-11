import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  status: any;
  tasks: any[];
  onTaskClick: (taskId: string) => void;
  onAddTask: () => void;
}

export function KanbanColumn({ status, tasks, onTaskClick, onAddTask }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status.id,
  });

  return (
    <Card className="p-4 border-border/50" style={{ backgroundColor: '#161616' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: status.color }}
          />
          <h3 className="font-semibold text-foreground">{status.name}</h3>
          <span className="text-xs text-muted-foreground">({tasks.length})</span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onAddTask}
          className="h-6 w-6"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div ref={setNodeRef} className="space-y-2 min-h-[200px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
          ))}
        </SortableContext>
      </div>
    </Card>
  );
}
