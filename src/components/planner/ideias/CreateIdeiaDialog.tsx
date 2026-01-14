import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateIdeiaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function CreateIdeiaDialog({ open, onOpenChange, onSuccess }: CreateIdeiaDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [tipo, setTipo] = useState('conteudo');
  const [tipoCustomizado, setTipoCustomizado] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [qualidade, setQualidade] = useState('boa');

  const resetForm = () => {
    setTipo('conteudo');
    setTipoCustomizado('');
    setTitulo('');
    setDescricao('');
    setQualidade('boa');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !titulo.trim()) return;

    setIsLoading(true);
    
    const { error } = await supabase
      .from('planner_ideias')
      .insert({
        user_id: user.id,
        tipo,
        tipo_customizado: tipo === 'outro' ? tipoCustomizado.trim() || null : null,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        qualidade,
        status: 'nao_feita',
      });

    if (error) {
      console.error('Error creating ideia:', error);
      toast.error('Erro ao criar ideia');
    } else {
      toast.success('Ideia adicionada!');
      resetForm();
      onSuccess();
    }
    
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Ideia</DialogTitle>
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
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <Label>Qualidade da Ideia</Label>
            <RadioGroup value={qualidade} onValueChange={setQualidade} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="boa" id="boa" />
                <Label htmlFor="boa" className="cursor-pointer flex items-center gap-1">
                  <span>⭐</span> Ideia Boa
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ok" id="ok" />
                <Label htmlFor="ok" className="cursor-pointer flex items-center gap-1">
                  <span>👍</span> Ideia OK
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !titulo.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Adicionar Ideia
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
