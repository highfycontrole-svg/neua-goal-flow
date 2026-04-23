import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle2, Trash2, RefreshCw } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  status: any;
  tasks: any[];
  onTaskClick: (taskId: string) => void;
  onAddTask: () => void;
  onDeleteStatus?: () => void;
}

const COMPLETED_TERMS = ['concluído', 'concluida', 'done', 'finalizado', 'completo'];

export function KanbanColumn({ status, tasks, onTaskClick, onAddTask, onDeleteStatus }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
  });

  const isCompletedColumn = useMemo(() =>
    COMPLETED_TERMS.some(term => status.name.toLowerCase().includes(term)),
  [status.name]);

  const isBacklog = !!status.isBacklog;

  return (
    <Card 
      className={`p-4 border-border/30 transition-all duration-200 ${
        isOver ? 'border-primary/50 ring-2 ring-primary/20' : 'hover:border-border/50'
      }`} 
      style={{ backgroundColor: isOver ? 'rgba(59, 130, 246, 0.05)' : '#161616' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isBacklog ? (
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          ) : isCompletedColumn ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: status.color }}
            />
          )}
          <h3 className={`font-semibold ${isCompletedColumn ? 'text-green-400' : 'text-foreground'}`}>{status.name}</h3>
          <span className="text-xs text-muted-foreground">({tasks.length})</span>
        </div>
        <div className="flex items-center gap-1">
          {onDeleteStatus && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir o status "{status.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>As tarefas com este status ficarão sem status (Backlog).</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeleteStatus} className="bg-destructive">Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button size="icon" variant="ghost" onClick={onAddTask} className="h-6 w-6">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div 
        ref={setNodeRef} 
        className={`space-y-2 min-h-[200px] transition-colors duration-200 rounded-lg ${
          isOver ? 'bg-primary/5' : ''
        }`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
              isCompleted={isCompletedColumn}
              isBacklog={isBacklog}
            />
          ))}
        </SortableContext>
      </div>
    </Card>
  );
}