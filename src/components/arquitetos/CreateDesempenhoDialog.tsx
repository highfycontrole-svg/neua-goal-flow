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

interface CreateDesempenhoDialogProps {
  arquitetos: any[];
  onSuccess: () => void;
}

export function CreateDesempenhoDialog({ arquitetos, onSuccess }: CreateDesempenhoDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    arquiteto_id: '',
    mes_referencia: '',
    vendas_pedidos: '',
    valor_total_vendido: '',
    comissao_escalavel: '',
    status_pagamento: 'Pendente',
    data_pagamento: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const valorTotal = parseFloat(formData.valor_total_vendido) || 0;
      const vendas = parseInt(formData.vendas_pedidos) || 0;
      const ticketMedio = vendas > 0 ? valorTotal / vendas : 0;
      const comissaoBase = valorTotal * 0.1; // 10% de comissão base
      const comissaoEscalavel = parseFloat(formData.comissao_escalavel) || 0;
      const comissaoTotal = comissaoBase + comissaoEscalavel;

      const { error } = await supabase.from('desempenho_financeiro').insert([{
        user_id: user?.id,
        arquiteto_id: formData.arquiteto_id,
        mes_referencia: formData.mes_referencia,
        vendas_pedidos: vendas,
        valor_total_vendido: valorTotal,
        ticket_medio: ticketMedio,
        comissao_base: comissaoBase,
        comissao_escalavel: comissaoEscalavel,
        comissao_total_a_pagar: comissaoTotal,
        status_pagamento: formData.status_pagamento as any,
        data_pagamento: formData.data_pagamento || null
      }]);

      if (error) throw error;

      toast.success('Desempenho registrado com sucesso');
      setOpen(false);
      setFormData({
        arquiteto_id: '',
        mes_referencia: '',
        vendas_pedidos: '',
        valor_total_vendido: '',
        comissao_escalavel: '',
        status_pagamento: 'Pendente',
        data_pagamento: ''
      });
      onSuccess();
    } catch (error: any) {
      toast.error('Erro ao registrar desempenho');
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Registro Financeiro</DialogTitle>
          <DialogDescription>
            Registre o desempenho mensal de vendas e comissões
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="arquiteto_id">Arquiteto *</Label>
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
              <Label htmlFor="mes_referencia">Mês de Referência *</Label>
              <Input
                id="mes_referencia"
                type="date"
                required
                value={formData.mes_referencia}
                onChange={(e) => setFormData({ ...formData, mes_referencia: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendas_pedidos">Número de Pedidos</Label>
              <Input
                id="vendas_pedidos"
                type="number"
                min="0"
                value={formData.vendas_pedidos}
                onChange={(e) => setFormData({ ...formData, vendas_pedidos: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_total_vendido">Valor Total Vendido (R$)</Label>
              <Input
                id="valor_total_vendido"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_total_vendido}
                onChange={(e) => setFormData({ ...formData, valor_total_vendido: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comissao_escalavel">Comissão Adicional/Bônus (R$)</Label>
            <Input
              id="comissao_escalavel"
              type="number"
              step="0.01"
              min="0"
              value={formData.comissao_escalavel}
              onChange={(e) => setFormData({ ...formData, comissao_escalavel: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status_pagamento">Status do Pagamento</Label>
              <Select
                value={formData.status_pagamento}
                onValueChange={(value) => setFormData({ ...formData, status_pagamento: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Em Revisão">Em Revisão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_pagamento">Data do Pagamento</Label>
              <Input
                id="data_pagamento"
                type="date"
                value={formData.data_pagamento}
                onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
              />
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
