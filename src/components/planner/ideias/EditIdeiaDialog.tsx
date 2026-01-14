import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PlannerIdeia } from '@/pages/planner/PlannerIdeiasPage';

interface EditIdeiaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ideia: PlannerIdeia;
  onSuccess: () => void;
}

const TIPO_OPTIONS = [
  { value: 'conteudo', label: 'Conteúdo' },
  { value: 'anuncio', label: 'Anúncio' },
  { value: 'campanha', label: 'Campanha' },
  { value: 'estrategia', label: 'Estratégia' },
  { value: 'loja', label: 'Loja' },
  { value: 'produto', label: 'Produto' },
  { value: 'outro', label: 'Outro' },
];

export function EditIdeiaDialog({ open, onOpenChange, ideia, onSuccess }: EditIdeiaDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tipo, setTipo] = useState(ideia.tipo);
  const [tipoCustomizado, setTipoCustomizado] = useState(ideia.tipo_customizado || '');
  const [titulo, setTitulo] = useState(ideia.titulo);
  const [descricao, setDescricao] = useState(ideia.descricao || '');
  const [qualidade, setQualidade] = useState(ideia.qualidade);
  const [status, setStatus] = useState(ideia.status);
  const [resultado, setResultado] = useState(ideia.resultado || '');

  useEffect(() => {
    setTipo(ideia.tipo);
    setTipoCustomizado(ideia.tipo_customizado || '');
    setTitulo(ideia.titulo);
    setDescricao(ideia.descricao || '');
    setQualidade(ideia.qualidade);
    setStatus(ideia.status);
    setResultado(ideia.resultado || '');
  }, [ideia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    setIsLoading(true);
    
    const { error } = await supabase
      .from('planner_ideias')
      .update({
        tipo,
        tipo_customizado: tipo === 'outro' ? tipoCustomizado.trim() || null : null,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        qualidade,
        status,
        resultado: status === 'feita' ? resultado || null : null,
      })
      .eq('id', ideia.id);

    if (error) {
      console.error('Error updating ideia:', error);
      toast.error('Erro ao atualizar ideia');
    } else {
      toast.success('Ideia atualizada!');
      onSuccess();
    }
    
    setIsLoading(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    const { error } = await supabase
      .from('planner_ideias')
      .delete()
      .eq('id', ideia.id);

    if (error) {
      console.error('Error deleting ideia:', error);
      toast.error('Erro ao excluir ideia');
    } else {
      toast.success('Ideia excluída!');
      onSuccess();
    }
    
    setIsDeleting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Ideia</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Ideia</Label>
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

          {tipo === 'outro' && (
            <div className="space-y-2">
              <Label htmlFor="tipoCustomizado">Especifique o tipo</Label>
              <Input
                id="tipoCustomizado"
                value={tipoCustomizado}
                onChange={(e) => setTipoCustomizado(e.target.value)}
                placeholder="Ex: Parceria, Evento..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="titulo">Título da Ideia</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Descreva sua ideia em poucas palavras"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhe sua ideia..."
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Qualidade da Ideia</Label>
            <RadioGroup value={qualidade} onValueChange={setQualidade} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="boa" id="boa-edit" />
                <Label htmlFor="boa-edit" className="cursor-pointer flex items-center gap-1">
                  <span>⭐</span> Ideia Boa
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ok" id="ok-edit" />
                <Label htmlFor="ok-edit" className="cursor-pointer flex items-center gap-1">
                  <span>👍</span> Ideia OK
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Status</Label>
            <RadioGroup value={status} onValueChange={setStatus} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao_feita" id="nao_feita" />
                <Label htmlFor="nao_feita" className="cursor-pointer">Não Feita</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="feita" id="feita" />
                <Label htmlFor="feita" className="cursor-pointer">Feita</Label>
              </div>
            </RadioGroup>
          </div>

          {status === 'feita' && (
            <div className="space-y-3">
              <Label>Resultado</Label>
              <RadioGroup value={resultado} onValueChange={setResultado} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="boa" id="resultado-boa" />
                  <Label htmlFor="resultado-boa" className="cursor-pointer flex items-center gap-1">
                    <span>👍</span> Foi Boa
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ruim" id="resultado-ruim" />
                  <Label htmlFor="resultado-ruim" className="cursor-pointer flex items-center gap-1">
                    <span>👎</span> Foi Ruim
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

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
              <Button type="submit" disabled={isLoading || !titulo.trim()}>
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
