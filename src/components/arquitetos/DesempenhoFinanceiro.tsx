import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreateDesempenhoDialog } from './CreateDesempenhoDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DesempenhoFinanceiroProps {
  selectedArquitetoId: string | null;
}

export function DesempenhoFinanceiro({ selectedArquitetoId }: DesempenhoFinanceiroProps) {
  const { user } = useAuth();
  const [desempenhos, setDesempenhos] = useState<any[]>([]);
  const [arquitetos, setArquitetos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterArquiteto, setFilterArquiteto] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadArquitetos();
      loadDesempenhos();
    }
  }, [user, filterArquiteto]);

  useEffect(() => {
    if (selectedArquitetoId) {
      setFilterArquiteto(selectedArquitetoId);
    }
  }, [selectedArquitetoId]);

  const loadArquitetos = async () => {
    const { data } = await supabase
      .from('arquitetos')
      .select('id, nome_completo')
      .eq('user_id', user?.id);
    setArquitetos(data || []);
  };

  const loadDesempenhos = async () => {
    try {
      let query = supabase
        .from('desempenho_financeiro')
        .select(`
          *,
          arquitetos (nome_completo)
        `)
        .eq('user_id', user?.id)
        .order('mes_referencia', { ascending: false });

      if (filterArquiteto && filterArquiteto !== 'all') {
        query = query.eq('arquiteto_id', filterArquiteto);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDesempenhos(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar desempenhos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Pendente': 'bg-yellow-900/20 text-yellow-400 border-yellow-400/30',
      'Pago': 'bg-green-900/20 text-green-400 border-green-400/30',
      'Em Revisão': 'bg-orange-900/20 text-orange-400 border-orange-400/30'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-300';
  };

  const formatMes = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Desempenho & Financeiro</h2>
        <div className="flex gap-3">
          <Select value={filterArquiteto} onValueChange={setFilterArquiteto}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por creator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {arquitetos.map((arq) => (
                <SelectItem key={arq.id} value={arq.id}>
                  {arq.nome_completo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <CreateDesempenhoDialog arquitetos={arquitetos} onSuccess={loadDesempenhos} />
        </div>
      </div>

      <div className="card-neua overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Creator</TableHead>
              <TableHead>Mês</TableHead>
              <TableHead>Pedidos</TableHead>
              <TableHead>Total Vendido</TableHead>
              <TableHead>Ticket Médio</TableHead>
              <TableHead>Comissão Base</TableHead>
              <TableHead>Comissão Total</TableHead>
              <TableHead>Status Pgto</TableHead>
              <TableHead>Data Pgto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {desempenhos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Nenhum registro financeiro ainda
                </TableCell>
              </TableRow>
            ) : (
              desempenhos.map((desp) => (
                <TableRow key={desp.id} className="border-border/50 hover:bg-muted/30">
                  <TableCell className="font-medium">{desp.arquitetos?.nome_completo}</TableCell>
                  <TableCell>{formatMes(desp.mes_referencia)}</TableCell>
                  <TableCell>{desp.vendas_pedidos}</TableCell>
                  <TableCell className="text-green-400">
                    R$ {parseFloat(desp.valor_total_vendido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    R$ {parseFloat(desp.ticket_medio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    R$ {parseFloat(desp.comissao_base).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-primary font-semibold">
                    R$ {parseFloat(desp.comissao_total_a_pagar).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(desp.status_pagamento)}>
                      {desp.status_pagamento}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {desp.data_pagamento ? new Date(desp.data_pagamento).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
