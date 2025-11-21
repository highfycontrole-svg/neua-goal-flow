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
import { Checkbox } from '@/components/ui/checkbox';

interface CreateLogisticaDialogProps {
  arquitetos: any[];
  onSuccess: () => void;
}

export function CreateLogisticaDialog({ arquitetos, onSuccess }: CreateLogisticaDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    arquiteto_id: '',
    mes_referencia: '',
    status_reel: 'Pendente',
    link_reel: '',
    status_stories: 'Pendente',
    links_stories: '',
    qualidade_conteudo_avaliacao: '',
    observacoes_conteudo: '',
    cupom_mencionado_conteudo: false,
    tipo_envio: 'Kit Trimestral',
    produtos_enviados_sku: '',
    data_envio_efetiva: '',
    codigo_rastreio: '',
    status_envio: 'Enviado',
    confirmacao_recebimento: false,
    proxima_data_envio_programada: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('logistica_conteudo').insert([{
        user_id: user?.id,
        ...formData,
        status_reel: formData.status_reel as any,
        status_stories: formData.status_stories as any,
        tipo_envio: formData.tipo_envio as any,
        status_envio: formData.status_envio as any,
        qualidade_conteudo_avaliacao: formData.qualidade_conteudo_avaliacao ? 
          parseInt(formData.qualidade_conteudo_avaliacao) : null
      }]);

      if (error) throw error;

      toast.success('Registro de logística criado com sucesso');
      setOpen(false);
      setFormData({
        arquiteto_id: '',
        mes_referencia: '',
        status_reel: 'Pendente',
        link_reel: '',
        status_stories: 'Pendente',
        links_stories: '',
        qualidade_conteudo_avaliacao: '',
        observacoes_conteudo: '',
        cupom_mencionado_conteudo: false,
        tipo_envio: 'Kit Trimestral',
        produtos_enviados_sku: '',
        data_envio_efetiva: '',
        codigo_rastreio: '',
        status_envio: 'Enviado',
        confirmacao_recebimento: false,
        proxima_data_envio_programada: ''
      });
      onSuccess();
    } catch (error: any) {
      toast.error('Erro ao criar registro');
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
          Adicionar Registro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Registro de Logística</DialogTitle>
          <DialogDescription>
            Registre informações sobre conteúdo e envios
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="log_arquiteto_id">Arquiteto *</Label>
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
              <Label htmlFor="log_mes_referencia">Mês de Referência *</Label>
              <Input
                id="log_mes_referencia"
                type="date"
                required
                value={formData.mes_referencia}
                onChange={(e) => setFormData({ ...formData, mes_referencia: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-border/50 pt-4">
            <h3 className="text-lg font-semibold">Conteúdo</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="log_status_reel">Status Reel</Label>
                <Select
                  value={formData.status_reel}
                  onValueChange={(value) => setFormData({ ...formData, status_reel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entregue">Entregue</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                    <SelectItem value="Não Aplicável">Não Aplicável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="log_link_reel">Link do Reel</Label>
                <Input
                  id="log_link_reel"
                  type="url"
                  value={formData.link_reel}
                  onChange={(e) => setFormData({ ...formData, link_reel: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="log_status_stories">Status Stories</Label>
                <Select
                  value={formData.status_stories}
                  onValueChange={(value) => setFormData({ ...formData, status_stories: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entregue">Entregue</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                    <SelectItem value="Não Aplicável">Não Aplicável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="log_qualidade">Qualidade (1-5)</Label>
                <Input
                  id="log_qualidade"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.qualidade_conteudo_avaliacao}
                  onChange={(e) => setFormData({ ...formData, qualidade_conteudo_avaliacao: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="log_cupom"
                checked={formData.cupom_mencionado_conteudo}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, cupom_mencionado_conteudo: checked as boolean })}
              />
              <Label htmlFor="log_cupom">Cupom mencionado no conteúdo</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="log_observacoes">Observações</Label>
              <Textarea
                id="log_observacoes"
                value={formData.observacoes_conteudo}
                onChange={(e) => setFormData({ ...formData, observacoes_conteudo: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-border/50 pt-4">
            <h3 className="text-lg font-semibold">Envio de Produtos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="log_tipo_envio">Tipo de Envio</Label>
                <Select
                  value={formData.tipo_envio}
                  onValueChange={(value) => setFormData({ ...formData, tipo_envio: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kit Trimestral">Kit Trimestral</SelectItem>
                    <SelectItem value="Lançamento">Lançamento</SelectItem>
                    <SelectItem value="Evento Especial">Evento Especial</SelectItem>
                    <SelectItem value="Boas-Vindas">Boas-Vindas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="log_status_envio">Status do Envio</Label>
                <Select
                  value={formData.status_envio}
                  onValueChange={(value) => setFormData({ ...formData, status_envio: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Enviado">Enviado</SelectItem>
                    <SelectItem value="Em Trânsito">Em Trânsito</SelectItem>
                    <SelectItem value="Entregue">Entregue</SelectItem>
                    <SelectItem value="Problema">Problema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="log_produtos">Produtos Enviados (SKU)</Label>
              <Textarea
                id="log_produtos"
                value={formData.produtos_enviados_sku}
                onChange={(e) => setFormData({ ...formData, produtos_enviados_sku: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="log_data_envio">Data de Envio</Label>
                <Input
                  id="log_data_envio"
                  type="date"
                  value={formData.data_envio_efetiva}
                  onChange={(e) => setFormData({ ...formData, data_envio_efetiva: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="log_rastreio">Código de Rastreio</Label>
                <Input
                  id="log_rastreio"
                  value={formData.codigo_rastreio}
                  onChange={(e) => setFormData({ ...formData, codigo_rastreio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="log_proximo_envio">Próximo Envio</Label>
                <Input
                  id="log_proximo_envio"
                  type="date"
                  value={formData.proxima_data_envio_programada}
                  onChange={(e) => setFormData({ ...formData, proxima_data_envio_programada: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="log_confirmacao"
                checked={formData.confirmacao_recebimento}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, confirmacao_recebimento: checked as boolean })}
              />
              <Label htmlFor="log_confirmacao">Recebimento confirmado</Label>
            </div>
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
