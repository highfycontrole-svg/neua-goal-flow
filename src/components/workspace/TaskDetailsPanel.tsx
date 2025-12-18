import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Plus, Trash2, Copy } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Helper function to parse date string without timezone issues
const parseDateString = (dateStr: string | null): Date | undefined => {
  if (!dateStr) return undefined;
  // Add time component to ensure local timezone interpretation
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

interface TaskDetailsPanelProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailsPanel({ taskId, open, onOpenChange }: TaskDetailsPanelProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [responsible, setResponsible] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['workspace-task', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('*, workspace_subtasks(*)')
        .eq('id', taskId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ['workspace-statuses', task?.workspace_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_statuses')
        .select('*')
        .eq('workspace_id', task?.workspace_id)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!task?.workspace_id,
  });

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatusId(task.status_id || '');
      setDate(parseDateString(task.date));
      setResponsible(task.responsible || '');
      setTags(task.tags?.join(', ') || '');
      setNotes(task.notes || '');
    }
  }, [task]);

  const handleSave = async () => {
    if (!taskId || !title.trim()) return;

    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

      const { error } = await supabase
        .from('workspace_tasks')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          status_id: statusId || null,
          date: date ? format(date, 'yyyy-MM-dd') : null,
          responsible: responsible.trim() || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
          notes: notes.trim() || null,
        })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Tarefa atualizada!',
        description: 'As alterações foram salvas com sucesso.',
      });

      queryClient.invalidateQueries({ queryKey: ['workspace-task'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar tarefa',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddSubtask = async () => {
    if (!taskId || !newSubtask.trim()) return;

    try {
      const { error } = await supabase
        .from('workspace_subtasks')
        .insert([{
          task_id: taskId,
          title: newSubtask.trim(),
        }]);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['workspace-task'] });
      setNewSubtask('');
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar subtarefa',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('workspace_subtasks')
        .update({ completed })
        .eq('id', subtaskId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['workspace-task'] });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar subtarefa',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['workspace-task'] });
    } catch (error: any) {
      toast({
        title: 'Erro ao deletar subtarefa',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateTask = async () => {
    if (!task) return;

    try {
      const { data: newTask, error } = await supabase
        .from('workspace_tasks')
        .insert([{
          workspace_id: task.workspace_id,
          title: `${task.title} (Cópia)`,
          description: task.description,
          status_id: task.status_id,
          date: task.date,
          responsible: task.responsible,
          tags: task.tags,
          notes: task.notes,
        }])
        .select()
        .single();

      if (error) throw error;

      // Duplicar subtasks
      if (task.workspace_subtasks && task.workspace_subtasks.length > 0) {
        const subtasksToInsert = task.workspace_subtasks.map((s: any) => ({
          task_id: newTask.id,
          title: s.title,
          completed: false,
        }));

        await supabase.from('workspace_subtasks').insert(subtasksToInsert);
      }

      toast({
        title: 'Tarefa duplicada!',
        description: 'Uma cópia da tarefa foi criada com sucesso.',
      });

      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao duplicar tarefa',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTask = async () => {
    if (!taskId) return;

    if (!confirm('Tem certeza que deseja deletar esta tarefa?')) return;

    try {
      const { error } = await supabase
        .from('workspace_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Tarefa deletada!',
        description: 'A tarefa foi removida com sucesso.',
      });

      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao deletar tarefa',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes da Tarefa</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Actions */}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} size="sm">Salvar</Button>
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditing(true)} size="sm">Editar</Button>
                <Button onClick={handleDuplicateTask} variant="outline" size="sm" className="gap-2">
                  <Copy className="h-4 w-4" />
                  Duplicar
                </Button>
                <Button onClick={handleDeleteTask} variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Deletar
                </Button>
              </>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Título</Label>
            {isEditing ? (
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            ) : (
              <p className="text-lg font-semibold">{task.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            {isEditing ? (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            ) : (
              <p className="text-muted-foreground">{task.description || 'Sem descrição'}</p>
            )}
          </div>

          {/* Status & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              {isEditing ? (
                <Select value={statusId} onValueChange={setStatusId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          {status.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        statuses.find(s => s.id === task.status_id)?.color || '#6B7280',
                    }}
                  />
                  <span>{statuses.find(s => s.id === task.status_id)?.name || 'Sem status'}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              {isEditing ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar 
                      mode="single" 
                      selected={date} 
                      onSelect={setDate} 
                      locale={ptBR}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <p>{task.date ? format(parseDateString(task.date)!, 'dd/MM/yyyy', { locale: ptBR }) : 'Sem data'}</p>
              )}
            </div>
          </div>

          {/* Responsible */}
          <div className="space-y-2">
            <Label>Responsável</Label>
            {isEditing ? (
              <Input value={responsible} onChange={(e) => setResponsible(e.target.value)} />
            ) : (
              <p>{task.responsible || 'Não atribuído'}</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            {isEditing ? (
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Separadas por vírgula"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {task.tags && task.tags.length > 0 ? (
                  task.tags.map((tag: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">Sem tags</span>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Subtasks */}
          <div className="space-y-4">
            <Label>Subtarefas</Label>
            <div className="space-y-2">
              {task.workspace_subtasks?.map((subtask: any) => (
                <div key={subtask.id} className="flex items-center gap-2 group">
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={(checked) =>
                      handleToggleSubtask(subtask.id, checked as boolean)
                    }
                  />
                  <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                    {subtask.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nova subtarefa..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
              />
              <Button onClick={handleAddSubtask} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas Internas</Label>
            {isEditing ? (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                placeholder="Adicione notas, comentários ou observações..."
              />
            ) : (
              <div className="p-3 bg-muted rounded-lg min-h-[100px]">
                <p className="whitespace-pre-wrap">{task.notes || 'Sem notas'}</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
