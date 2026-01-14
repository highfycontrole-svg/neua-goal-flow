import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';

interface Pack {
  id: string;
  nome: string;
  insight_central: string | null;
  promessa_principal: string | null;
  status: string;
}

interface EditPackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pack: Pack;
}

export function EditPackDialog({ open, onOpenChange, pack }: EditPackDialogProps) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState(pack.nome);
  const [insightCentral, setInsightCentral] = useState(pack.insight_central || '');
  const [promessaPrincipal, setPromessaPrincipal] = useState(pack.promessa_principal || '');
  const [status, setStatus] = useState(pack.status);

  useEffect(() => {
    setNome(pack.nome);
    setInsightCentral(pack.insight_central || '');
    setPromessaPrincipal(pack.promessa_principal || '');
    setStatus(pack.status);
  }, [pack]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('ad_packs')
        .update({
          nome,
          insight_central: insightCentral || null,
          promessa_principal: promessaPrincipal || null,
          status,
        })
        .eq('id', pack.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packs'] });
      queryClient.invalidateQueries({ queryKey: ['pack-counts'] });
      toast.success('Pack atualizado com sucesso!');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Erro ao atualizar pack');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error('Nome do pack é obrigatório');
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Editar Pack
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Pack *</Label>
            <Input
              id="nome"
              placeholder="Ex: Wellness Tech, Minimalismo Luxo..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="insight">Insight Central</Label>
            <Textarea
              id="insight"
              placeholder="Qual a grande sacada/insight deste pack?"
              value={insightCentral}
              onChange={(e) => setInsightCentral(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promessa">Promessa Principal</Label>
            <Textarea
              id="promessa"
              placeholder="Qual a promessa que este pack entrega ao cliente?"
              value={promessaPrincipal}
              onChange={(e) => setPromessaPrincipal(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ideia">💡 Ideia</SelectItem>
                <SelectItem value="em_teste">🧪 Em Teste</SelectItem>
                <SelectItem value="validado">✅ Validado</SelectItem>
                <SelectItem value="arquivado">📦 Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
