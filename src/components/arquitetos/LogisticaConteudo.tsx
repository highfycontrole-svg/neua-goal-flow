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
import { CreateLogisticaDialog } from './CreateLogisticaDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LogisticaConteudoProps {
  selectedArquitetoId: string | null;
}

export function LogisticaConteudo({ selectedArquitetoId }: LogisticaConteudoProps) {
  const { user } = useAuth();
  const [logisticas, setLogisticas] = useState<any[]>([]);
  const [arquitetos, setArquitetos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterArquiteto, setFilterArquiteto] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadArquitetos();
      loadLogisticas();
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

  const loadLogisticas = async () => {
    try {
      let query = supabase
        .from('logistica_conteudo')
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
      setLogisticas(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar logística');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Entregue': 'bg-green-900/20 text-green-400 border-green-400/30',
      'Pendente': 'bg-yellow-900/20 text-yellow-400 border-yellow-400/30',
      'Atrasado': 'bg-red-900/20 text-red-400 border-red-400/30',
      'Não Aplicável': 'bg-gray-500/20 text-gray-300 border-gray-400/30'
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
        <h2 className="text-2xl font-display font-bold">Logística & Conteúdo</h2>
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
          <CreateLogisticaDialog arquitetos={arquitetos} onSuccess={loadLogisticas} />
        </div>
      </div>

      <div className="card-neua overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Arquiteto</TableHead>
              <TableHead>Mês</TableHead>
              <TableHead>Status Reel</TableHead>
              <TableHead>Status Stories</TableHead>
              <TableHead>Qualidade</TableHead>
              <TableHead>Tipo Envio</TableHead>
              <TableHead>Status Envio</TableHead>
              <TableHead>Próximo Envio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logisticas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum registro de logística ainda
                </TableCell>
              </TableRow>
            ) : (
              logisticas.map((log) => (
                <TableRow key={log.id} className="border-border/50 hover:bg-muted/30">
                  <TableCell className="font-medium">{log.arquitetos?.nome_completo}</TableCell>
                  <TableCell>{formatMes(log.mes_referencia)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(log.status_reel)}>
                      {log.status_reel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(log.status_stories)}>
                      {log.status_stories}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.qualidade_conteudo_avaliacao ? 
                      '⭐'.repeat(log.qualidade_conteudo_avaliacao) : '-'}
                  </TableCell>
                  <TableCell>{log.tipo_envio || '-'}</TableCell>
                  <TableCell>
                    {log.status_envio ? (
                      <Badge variant="outline" className={getStatusColor(log.status_envio)}>
                        {log.status_envio}
                      </Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {log.proxima_data_envio_programada ? 
                      new Date(log.proxima_data_envio_programada).toLocaleDateString('pt-BR') : '-'}
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
