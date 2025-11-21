import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface CreateInteracaoDialogProps {
  arquitetos: any[];
  onSuccess: () => void;
}

export function CreateInteracaoDialog({ arquitetos, onSuccess }: CreateInteracaoDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    arquiteto_id: '',
    data_interacao: new Date().toISOString().slice(0, 16),
    tipo_interacao: 'E-mail',
    assunto_motivo: '',
    resumo_interacao: '',
    responsavel_interacao: '',
    proxima_acao_follow_up: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('interacoes').insert([{
        user_id: user?.id,
        ...formData,
        tipo_interacao: formData.tipo_interacao as any
      }]);

      if (error) throw error;

      toast.success('Interação registrada com sucesso');
      setOpen(false);
      setFormData({
        arquiteto_id: '',
        data_interacao: new Date().toISOString().slice(0, 16),
        tipo_interacao: 'E-mail',
        assunto_motivo: '',
        resumo_interacao: '',
        responsavel_interacao: '',
        proxima_acao_follow_up: ''
      });
      onSuccess();
    } catch (error: any) {
      toast.error('Erro ao registrar interação');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Interação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Nova Interação</DialogTitle>
          <DialogDescription>
            Registre comunicações e interações com os arquitetos
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="int_arquiteto_id">Arquiteto *</Label>
              <Select
                required
                value={formData.arquiteto_id}
                onValueChange={(value) => setFormData({ ...formData, arquiteto_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {arquitetos.map((arq) => (
                    <SelectItem key={arq.id} value={arq.id}>
                      {arq.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="int_data">Data e Hora *</Label>
              <Input
                id="int_data"
                type="datetime-local"
                required
                value={formData.data_interacao}
                onChange={(e) => setFormData({ ...formData, data_interacao: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="int_tipo">Tipo de Interação *</Label>
              <Select
                value={formData.tipo_interacao}
                onValueChange={(value) => setFormData({ ...formData, tipo_interacao: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="E-mail">E-mail</SelectItem>
                  <SelectItem value="Ligação">Ligação</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Reunião">Reunião</SelectItem>
                  <SelectItem value="Feedback">Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="int_responsavel">Responsável</Label>
              <Input
                id="int_responsavel"
                value={formData.responsavel_interacao}
                onChange={(e) => setFormData({ ...formData, responsavel_interacao: e.target.value })}
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="int_assunto">Assunto/Motivo *</Label>
            <Input
              id="int_assunto"
              required
              value={formData.assunto_motivo}
              onChange={(e) => setFormData({ ...formData, assunto_motivo: e.target.value })}
              placeholder="Ex: Negociação de contrato, Feedback sobre produto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="int_resumo">Resumo da Interação</Label>
            <Textarea
              id="int_resumo"
              value={formData.resumo_interacao}
              onChange={(e) => setFormData({ ...formData, resumo_interacao: e.target.value })}
              placeholder="Descreva o que foi discutido..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="int_proxima_acao">Próxima Ação / Follow-up</Label>
            <Textarea
              id="int_proxima_acao"
              value={formData.proxima_acao_follow_up}
              onChange={(e) => setFormData({ ...formData, proxima_acao_follow_up: e.target.value })}
              placeholder="Definir próximos passos..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
