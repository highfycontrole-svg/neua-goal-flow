import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { CreateInteracaoDialog } from './CreateInteracaoDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HistoricoInteracoesProps {
  selectedArquitetoId: string | null;
}

export function HistoricoInteracoes({ selectedArquitetoId }: HistoricoInteracoesProps) {
  const { user } = useAuth();
  const [interacoes, setInteracoes] = useState<any[]>([]);
  const [arquitetos, setArquitetos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterArquiteto, setFilterArquiteto] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadArquitetos();
      loadInteracoes();
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

  const loadInteracoes = async () => {
    try {
      let query = supabase
        .from('interacoes')
        .select(`
          *,
          arquitetos (nome_completo)
        `)
        .eq('user_id', user?.id)
        .order('data_interacao', { ascending: false });

      if (filterArquiteto && filterArquiteto !== 'all') {
        query = query.eq('arquiteto_id', filterArquiteto);
      }

      const { data, error } = await query;
      if (error) throw error;
      setInteracoes(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar interações');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoColor = (tipo: string) => {
    const colors = {
      'E-mail': 'bg-blue-900/20 text-blue-400 border-blue-400/30',
      'Ligação': 'bg-green-900/20 text-green-400 border-green-400/30',
      'WhatsApp': 'bg-emerald-900/20 text-emerald-400 border-emerald-400/30',
      'Reunião': 'bg-purple-900/20 text-purple-400 border-purple-400/30',
      'Feedback': 'bg-orange-900/20 text-orange-400 border-orange-400/30'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-500/20 text-gray-300';
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
        <h2 className="text-2xl font-display font-bold">Histórico de Interações</h2>
        <div className="flex gap-3">
          <Select value={filterArquiteto} onValueChange={setFilterArquiteto}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por arquiteto" />
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
          <CreateInteracaoDialog arquitetos={arquitetos} onSuccess={loadInteracoes} />
        </div>
      </div>

      <div className="card-neua overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Data/Hora</TableHead>
              <TableHead>Arquiteto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Resumo</TableHead>
              <TableHead>Próxima Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma interação registrada ainda
                </TableCell>
              </TableRow>
            ) : (
              interacoes.map((inter) => (
                <TableRow key={inter.id} className="border-border/50 hover:bg-muted/30">
                  <TableCell className="font-medium">
                    {new Date(inter.data_interacao).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>{inter.arquitetos?.nome_completo}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTipoColor(inter.tipo_interacao)}>
                      {inter.tipo_interacao}
                    </Badge>
                  </TableCell>
                  <TableCell>{inter.assunto_motivo}</TableCell>
                  <TableCell className="text-muted-foreground">{inter.responsavel_interacao}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {inter.resumo_interacao || '-'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {inter.proxima_acao_follow_up || '-'}
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
