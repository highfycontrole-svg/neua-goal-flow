import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { Layers } from 'lucide-react';

interface CreatePackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produtoId: string | null;
  isCatalog?: boolean;
  campaignId?: string | null;
}

export function CreatePackDialog({ open, onOpenChange, produtoId, isCatalog, campaignId }: CreatePackDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [insightCentral, setInsightCentral] = useState('');
  const [promessaPrincipal, setPromessaPrincipal] = useState('');
  const [status, setStatus] = useState('ideia');

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('ad_packs').insert({
        user_id: user?.id!,
        produto_id: (isCatalog || campaignId) ? null : produtoId,
        campaign_id: campaignId || null,
        nome,
        insight_central: insightCentral || null,
        promessa_principal: promessaPrincipal || null,
        status,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packs', isCatalog ? 'catalogo' : produtoId] });
      queryClient.invalidateQueries({ queryKey: ['pack-counts'] });
      toast.success('Pack criado com sucesso!');
      resetForm();
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Erro ao criar pack');
    },
  });

  const resetForm = () => {
    setNome('');
    setInsightCentral('');
    setPromessaPrincipal('');
    setStatus('ideia');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error('Nome do pack é obrigatório');
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Criar Novo Pack
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
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Criando...' : 'Criar Pack'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
