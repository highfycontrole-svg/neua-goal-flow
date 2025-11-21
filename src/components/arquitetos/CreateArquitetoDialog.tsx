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

interface CreateArquitetoDialogProps {
  onSuccess: () => void;
}

export function CreateArquitetoDialog({ onSuccess }: CreateArquitetoDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('arquitetos').insert([{
        user_id: user?.id,
        ...formData,
        classificacao_tier: formData.classificacao_tier as any,
        status_arquiteto: formData.status_arquiteto as any,
        seguidores_entrada: formData.seguidores_entrada ? parseInt(formData.seguidores_entrada) : null
      }]);

      if (error) throw error;

      toast.success('Arquiteto criado com sucesso');
      setOpen(false);
      setFormData({
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
      onSuccess();
    } catch (error: any) {
      toast.error('Erro ao criar arquiteto');
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
          Adicionar Arquiteto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Arquiteto</DialogTitle>
          <DialogDescription>
            Preencha as informações do novo arquiteto de conteúdo
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome_completo">Nome Completo *</Label>
              <Input
                id="nome_completo"
                required
                value={formData.nome_completo}
                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arroba_principal">Arroba Principal</Label>
              <Input
                id="arroba_principal"
                placeholder="@username"
                value={formData.arroba_principal}
                onChange={(e) => setFormData({ ...formData, arroba_principal: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email_contato">Email</Label>
              <Input
                id="email_contato"
                type="email"
                value={formData.email_contato}
                onChange={(e) => setFormData({ ...formData, email_contato: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone_contato">Telefone</Label>
              <Input
                id="telefone_contato"
                value={formData.telefone_contato}
                onChange={(e) => setFormData({ ...formData, telefone_contato: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco_completo">Endereço Completo</Label>
            <Textarea
              id="endereco_completo"
              value={formData.endereco_completo}
              onChange={(e) => setFormData({ ...formData, endereco_completo: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_entrada_club">Data de Entrada</Label>
              <Input
                id="data_entrada_club"
                type="date"
                value={formData.data_entrada_club}
                onChange={(e) => setFormData({ ...formData, data_entrada_club: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seguidores_entrada">Seguidores na Entrada</Label>
              <Input
                id="seguidores_entrada"
                type="number"
                value={formData.seguidores_entrada}
                onChange={(e) => setFormData({ ...formData, seguidores_entrada: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cupom_exclusivo">Cupom Exclusivo</Label>
              <Input
                id="cupom_exclusivo"
                value={formData.cupom_exclusivo}
                onChange={(e) => setFormData({ ...formData, cupom_exclusivo: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="classificacao_tier">Classificação</Label>
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
              <Label htmlFor="status_arquiteto">Status</Label>
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
            <Label htmlFor="condicao_obrigacao_conteudo">Condição de Obrigação de Conteúdo</Label>
            <Textarea
              id="condicao_obrigacao_conteudo"
              placeholder="Ex: 1 Reel e 3 Stories por mês"
              value={formData.condicao_obrigacao_conteudo}
              onChange={(e) => setFormData({ ...formData, condicao_obrigacao_conteudo: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="produto_boas_vindas_enviado">Produto de Boas-Vindas</Label>
              <Input
                id="produto_boas_vindas_enviado"
                value={formData.produto_boas_vindas_enviado}
                onChange={(e) => setFormData({ ...formData, produto_boas_vindas_enviado: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_envio_boas_vindas">Data de Envio</Label>
              <Input
                id="data_envio_boas_vindas"
                type="date"
                value={formData.data_envio_boas_vindas}
                onChange={(e) => setFormData({ ...formData, data_envio_boas_vindas: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link_contrato_assinado">Link do Contrato Assinado</Label>
            <Input
              id="link_contrato_assinado"
              type="url"
              placeholder="https://"
              value={formData.link_contrato_assinado}
              onChange={(e) => setFormData({ ...formData, link_contrato_assinado: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas_internas">Notas Internas</Label>
            <Textarea
              id="notas_internas"
              value={formData.notas_internas}
              onChange={(e) => setFormData({ ...formData, notas_internas: e.target.value })}
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
