import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Loader2, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PlannerEvento } from '@/pages/planner/PlannerCalendarioPage';

const DURACAO_OPTIONS = [
  { value: '15', label: '15 minutos' },
  { value: '30', label: '30 minutos' },
  { value: '45', label: '45 minutos' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1h 30min' },
  { value: '120', label: '2 horas' },
  { value: '180', label: '3 horas' },
  { value: '240', label: '4 horas' },
  { value: '480', label: '8 horas (dia inteiro)' },
];

interface EditEventoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evento: PlannerEvento;
  onSuccess: () => void;
}

const TIPO_OPTIONS = [
  { value: 'campanha', label: 'Campanha' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'marco', label: 'Marco Importante' },
  { value: 'estrategica', label: 'Data Estratégica' },
  { value: 'outro', label: 'Outro' },
];

const STATUS_OPTIONS = [
  { value: 'planejado', label: 'Planejado' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' },
];

export function EditEventoDialog({ open, onOpenChange, evento, onSuccess }: EditEventoDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tipo, setTipo] = useState(evento.tipo);
  const [titulo, setTitulo] = useState(evento.titulo);
  const [descricao, setDescricao] = useState(evento.descricao || '');
  const [dataInicio, setDataInicio] = useState<Date | undefined>(parseISO(evento.data_inicio));
  const [dataFim, setDataFim] = useState<Date | undefined>(evento.data_fim ? parseISO(evento.data_fim) : undefined);
  const [status, setStatus] = useState(evento.status);
  const [observacoes, setObservacoes] = useState(evento.observacoes || '');
  const [horaInicio, setHoraInicio] = useState(evento.hora_inicio || '');
  const [duracaoMinutos, setDuracaoMinutos] = useState(evento.duracao_minutos?.toString() || '');

  useEffect(() => {
    setTipo(evento.tipo);
    setTitulo(evento.titulo);
    setDescricao(evento.descricao || '');
    setDataInicio(parseISO(evento.data_inicio));
    setDataFim(evento.data_fim ? parseISO(evento.data_fim) : undefined);
    setStatus(evento.status);
    setObservacoes(evento.observacoes || '');
    setHoraInicio(evento.hora_inicio || '');
    setDuracaoMinutos(evento.duracao_minutos?.toString() || '');
  }, [evento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !dataInicio) return;

    setIsLoading(true);
    
    const { error } = await supabase
      .from('planner_eventos')
      .update({
        tipo,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        data_inicio: format(dataInicio, 'yyyy-MM-dd'),
        data_fim: dataFim ? format(dataFim, 'yyyy-MM-dd') : null,
        status,
        observacoes: observacoes.trim() || null,
        hora_inicio: horaInicio || null,
        duracao_minutos: duracaoMinutos ? parseInt(duracaoMinutos) : null,
      })
      .eq('id', evento.id);

    if (error) {
      console.error('Error updating evento:', error);
      toast.error('Erro ao atualizar evento');
    } else {
      toast.success('Evento atualizado!');
      onSuccess();
    }
    
    setIsLoading(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    const { error } = await supabase
      .from('planner_eventos')
      .delete()
      .eq('id', evento.id);

    if (error) {
      console.error('Error deleting evento:', error);
      toast.error('Erro ao excluir evento');
    } else {
      toast.success('Evento excluído!');
      onSuccess();
    }
    
    setIsDeleting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo do Evento</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPO_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nome do evento"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o evento..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Fim (opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hora_inicio">Horário de Início</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="hora_inicio"
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duração</Label>
              <Select value={duracaoMinutos} onValueChange={setDuracaoMinutos}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar duração" />
                </SelectTrigger>
                <SelectContent>
                  {DURACAO_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>

          <DialogFooter className="flex justify-between gap-2">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Excluir
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || !titulo.trim() || !dataInicio}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
