import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateToString } from '@/lib/utils';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  defaultStatusId?: string | null;
}

export function CreateTaskDialog({ open, onOpenChange, workspaceId, defaultStatusId }: CreateTaskDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState(defaultStatusId || '');
  const [date, setDate] = useState<Date | undefined>();
  const [responsible, setResponsible] = useState('');
  const [tags, setTags] = useState('');
  const [precisaGravar, setPrecisaGravar] = useState('nao_precisa');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

      const { data: inserted, error } = await supabase
        .from('workspace_tasks')
        .insert([{
          workspace_id: workspaceId,
          title: title.trim(),
          description: description.trim() || null,
          status_id: statusId === '__backlog__' ? null : (statusId || null),
          date: formatDateToString(date),
          responsible: responsible.trim() || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
          precisa_gravar: precisaGravar,
        }])
        .select('id')
        .single();

      if (error) throw error;

      // Sync com Gravações
      if (precisaGravar === 'precisa_gravar' && inserted?.id && user?.id) {
        const { data: existing } = await supabase
          .from('gravacoes')
          .select('id')
          .eq('origem', 'workspace')
          .eq('origem_id', inserted.id)
          .maybeSingle();
        if (!existing) {
          await supabase.from('gravacoes').insert({
            user_id: user.id,
            titulo: title.trim(),
            origem: 'workspace',
            origem_id: inserted.id,
            status: 'pendente',
          });
        }
      }

      toast({
        title: 'Tarefa criada!',
        description: 'A tarefa foi adicionada com sucesso.',
      });

      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['gravacoes'] });
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao criar tarefa',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatusId(defaultStatusId || '');
    setDate(undefined);
    setResponsible('');
    setTags('');
    setPrecisaGravar('nao_precisa');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Nova Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Nome da tarefa"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva a tarefa..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusId} onValueChange={setStatusId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__backlog__">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#6B7280' }} />
                        Backlog
                      </div>
                    </SelectItem>
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
              </div>

              <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible">Responsável</Label>
              <Input
                id="responsible"
                placeholder="Nome do responsável"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                placeholder="Ex: urgente, design, backend"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Precisa Gravar?</Label>
              <Select value={precisaGravar} onValueChange={setPrecisaGravar}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao_precisa">Não precisa gravar</SelectItem>
                  <SelectItem value="precisa_gravar">Precisa gravar</SelectItem>
                  <SelectItem value="ja_gravado">Já gravado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Tarefa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
