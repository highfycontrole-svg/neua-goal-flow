import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { toast } from 'sonner';

interface EditArquitetoDialogProps {
  arquiteto: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditArquitetoDialog({ arquiteto, open, onOpenChange, onSuccess }: EditArquitetoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: '',
    arroba_principal: '',
    email_contato: '',
    telefone_contato: '',
    endereco_completo: '',
    data_entrada_club: '',
    seguidores_entrada: '',
    cupom_exclusivo: '',
    classificacao_tier: 'Bronze',
    condicao_obrigacao_conteudo: '',
    produto_boas_vindas_enviado: '',
    data_envio_boas_vindas: '',
    status_arquiteto: 'Ativo',
    notas_internas: '',
    link_contrato_assinado: ''
  });

  useEffect(() => {
    if (arquiteto) {
      setFormData({
        nome_completo: arquiteto.nome_completo || '',
        arroba_principal: arquiteto.arroba_principal || '',
        email_contato: arquiteto.email_contato || '',
        telefone_contato: arquiteto.telefone_contato || '',
        endereco_completo: arquiteto.endereco_completo || '',
        data_entrada_club: arquiteto.data_entrada_club || '',
        seguidores_entrada: arquiteto.seguidores_entrada?.toString() || '',
        cupom_exclusivo: arquiteto.cupom_exclusivo || '',
        classificacao_tier: arquiteto.classificacao_tier || 'Bronze',
        condicao_obrigacao_conteudo: arquiteto.condicao_obrigacao_conteudo || '',
        produto_boas_vindas_enviado: arquiteto.produto_boas_vindas_enviado || '',
        data_envio_boas_vindas: arquiteto.data_envio_boas_vindas || '',
        status_arquiteto: arquiteto.status_arquiteto || 'Ativo',
        notas_internas: arquiteto.notas_internas || '',
        link_contrato_assinado: arquiteto.link_contrato_assinado || ''
      });
    }
  }, [arquiteto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('arquitetos')
        .update({
          ...formData,
          classificacao_tier: formData.classificacao_tier as any,
          status_arquiteto: formData.status_arquiteto as any,
          seguidores_entrada: formData.seguidores_entrada ? parseInt(formData.seguidores_entrada) : null
        })
        .eq('id', arquiteto.id);

      if (error) throw error;

      toast.success('Creator atualizado com sucesso');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error('Erro ao atualizar creator');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Creator</DialogTitle>
          <DialogDescription>
            Atualize as informações do creator de conteúdo
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_nome_completo">Nome Completo *</Label>
              <Input
                id="edit_nome_completo"
                required
                value={formData.nome_completo}
                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_arroba_principal">Arroba Principal</Label>
              <Input
                id="edit_arroba_principal"
                placeholder="@username"
                value={formData.arroba_principal}
                onChange={(e) => setFormData({ ...formData, arroba_principal: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_email_contato">Email</Label>
              <Input
                id="edit_email_contato"
                type="email"
                value={formData.email_contato}
                onChange={(e) => setFormData({ ...formData, email_contato: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_telefone_contato">Telefone</Label>
              <Input
                id="edit_telefone_contato"
                value={formData.telefone_contato}
                onChange={(e) => setFormData({ ...formData, telefone_contato: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_endereco_completo">Endereço Completo</Label>
            <Textarea
              id="edit_endereco_completo"
              value={formData.endereco_completo}
              onChange={(e) => setFormData({ ...formData, endereco_completo: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_data_entrada_club">Data de Entrada</Label>
              <Input
                id="edit_data_entrada_club"
                type="date"
                value={formData.data_entrada_club}
                onChange={(e) => setFormData({ ...formData, data_entrada_club: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_seguidores_entrada">Seguidores na Entrada</Label>
              <Input
                id="edit_seguidores_entrada"
                type="number"
                value={formData.seguidores_entrada}
                onChange={(e) => setFormData({ ...formData, seguidores_entrada: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_cupom_exclusivo">Cupom Exclusivo</Label>
              <Input
                id="edit_cupom_exclusivo"
                value={formData.cupom_exclusivo}
                onChange={(e) => setFormData({ ...formData, cupom_exclusivo: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_classificacao_tier">Classificação</Label>
              <Select
                value={formData.classificacao_tier}
                onValueChange={(value) => setFormData({ ...formData, classificacao_tier: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bronze">Bronze</SelectItem>
                  <SelectItem value="Prata">Prata</SelectItem>
                  <SelectItem value="Ouro">Ouro</SelectItem>
                  <SelectItem value="Platina">Platina</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_status_arquiteto">Status</Label>
              <Select
                value={formData.status_arquiteto}
                onValueChange={(value) => setFormData({ ...formData, status_arquiteto: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Em Análise">Em Análise</SelectItem>
                  <SelectItem value="Pausado">Pausado</SelectItem>
                  <SelectItem value="Desligado">Desligado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_condicao_obrigacao_conteudo">Condição de Obrigação de Conteúdo</Label>
            <Textarea
              id="edit_condicao_obrigacao_conteudo"
              placeholder="Ex: 1 Reel e 3 Stories por mês"
              value={formData.condicao_obrigacao_conteudo}
              onChange={(e) => setFormData({ ...formData, condicao_obrigacao_conteudo: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_produto_boas_vindas_enviado">Produto de Boas-Vindas</Label>
              <Input
                id="edit_produto_boas_vindas_enviado"
                value={formData.produto_boas_vindas_enviado}
                onChange={(e) => setFormData({ ...formData, produto_boas_vindas_enviado: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_data_envio_boas_vindas">Data de Envio</Label>
              <Input
                id="edit_data_envio_boas_vindas"
                type="date"
                value={formData.data_envio_boas_vindas}
                onChange={(e) => setFormData({ ...formData, data_envio_boas_vindas: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_link_contrato_assinado">Link do Contrato Assinado</Label>
            <Input
              id="edit_link_contrato_assinado"
              type="url"
              placeholder="https://"
              value={formData.link_contrato_assinado}
              onChange={(e) => setFormData({ ...formData, link_contrato_assinado: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_notas_internas">Notas Internas</Label>
            <Textarea
              id="edit_notas_internas"
              value={formData.notas_internas}
              onChange={(e) => setFormData({ ...formData, notas_internas: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
