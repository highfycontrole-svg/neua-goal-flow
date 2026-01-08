import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  Package, 
  Trophy, 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Percent, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Target, 
  Megaphone, 
  ListChecks, 
  AlertTriangle 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function KPICard({ title, value, icon, color, subtitle }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">{title}</p>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <div 
              className="p-3 rounded-xl"
              style={{ backgroundColor: `${color}20` }}
            >
              <div style={{ color }}>
                {icon}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function GeralPage() {
  const { user } = useAuth();

  // Produtos catalogados
  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos-geral', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Pedidos
  const { data: pedidos = [] } = useQuery({
    queryKey: ['pedidos-geral', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Metas
  const { data: metas = [] } = useQuery({
    queryKey: ['metas-geral', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Receitas (Faturamento)
  const { data: receitas = [] } = useQuery({
    queryKey: ['receitas-geral', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receitas')
        .select('*')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Despesas (Custos)
  const { data: despesas = [] } = useQuery({
    queryKey: ['despesas-geral', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('despesas')
        .select('*')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Marketing (Investimento em anúncios)
  const { data: campanhas = [] } = useQuery({
    queryKey: ['campanhas-geral', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campanhas')
        .select('*')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Workspaces e Tasks
  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces-geral', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-geral', user?.id, workspaces],
    queryFn: async () => {
      if (workspaces.length === 0) return [];
      const workspaceIds = workspaces.map(w => w.id);
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('*, workspace_statuses(name)')
        .in('workspace_id', workspaceIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && workspaces.length > 0,
  });

  // Cálculos
  const produtosCatalogados = produtos.length;
  const produtosCampeoes = produtos.filter(p => p.ranking === 'campeao').length;
  
  const faturamento = receitas.reduce((acc, r) => acc + (r.valor_bruto || 0), 0);
  const custos = despesas.reduce((acc, d) => acc + (d.valor || 0), 0);
  const lucro = faturamento - custos;
  const margem = faturamento > 0 ? ((lucro / faturamento) * 100).toFixed(1) : '0';

  const pedidosEntregues = pedidos.filter(p => p.status_entrega === 'Entregue').length;
  const pedidosEmTransito = pedidos.filter(p => p.status_entrega === 'Em Trânsito').length;
  const taxaEntrega = pedidos.length > 0 
    ? ((pedidosEntregues / pedidos.length) * 100).toFixed(1) 
    : '0';

  const metasConcluidas = metas.filter(m => m.status === true).length;

  const investimentoAnuncios = campanhas.reduce((acc, c) => acc + (c.investimento || 0), 0);

  const tarefasConcluidas = tasks.filter(t => {
    const statusName = (t.workspace_statuses as any)?.name?.toLowerCase();
    return statusName === 'concluído' || statusName === 'concluida' || statusName === 'done';
  }).length;

  const hoje = new Date();
  const tarefasAtrasadas = tasks.filter(t => {
    if (!t.date) return false;
    const taskDate = new Date(t.date);
    const statusName = (t.workspace_statuses as any)?.name?.toLowerCase();
    const isCompleted = statusName === 'concluído' || statusName === 'concluida' || statusName === 'done';
    return taskDate < hoje && !isCompleted;
  }).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const kpis = [
    {
      title: 'Produtos Catalogados',
      value: produtosCatalogados,
      icon: <Package className="h-6 w-6" />,
      color: '#3B82F6',
      subtitle: 'Total no catálogo',
    },
    {
      title: 'Produtos Campeões',
      value: produtosCampeoes,
      icon: <Trophy className="h-6 w-6" />,
      color: '#F59E0B',
      subtitle: 'Ranking campeão',
    },
    {
      title: 'Faturamento',
      value: formatCurrency(faturamento),
      icon: <DollarSign className="h-6 w-6" />,
      color: '#10B981',
      subtitle: 'Receita bruta total',
    },
    {
      title: 'Custos',
      value: formatCurrency(custos),
      icon: <TrendingDown className="h-6 w-6" />,
      color: '#EF4444',
      subtitle: 'Despesas totais',
    },
    {
      title: 'Lucro',
      value: formatCurrency(lucro),
      icon: <TrendingUp className="h-6 w-6" />,
      color: lucro >= 0 ? '#10B981' : '#EF4444',
      subtitle: 'Faturamento - Custos',
    },
    {
      title: 'Margem',
      value: `${margem}%`,
      icon: <Percent className="h-6 w-6" />,
      color: '#8B5CF6',
      subtitle: 'Margem de lucro',
    },
    {
      title: 'Pedidos Entregues',
      value: pedidosEntregues,
      icon: <CheckCircle2 className="h-6 w-6" />,
      color: '#10B981',
      subtitle: 'Status: Entregue',
    },
    {
      title: 'Taxa de Entrega',
      value: `${taxaEntrega}%`,
      icon: <Truck className="h-6 w-6" />,
      color: '#06B6D4',
      subtitle: 'Pedidos entregues / Total',
    },
    {
      title: 'Pedidos em Trânsito',
      value: pedidosEmTransito,
      icon: <Clock className="h-6 w-6" />,
      color: '#F59E0B',
      subtitle: 'Em rota de entrega',
    },
    {
      title: 'Metas Concluídas',
      value: metasConcluidas,
      icon: <Target className="h-6 w-6" />,
      color: '#10B981',
      subtitle: `De ${metas.length} metas`,
    },
    {
      title: 'Investimento em Anúncios',
      value: formatCurrency(investimentoAnuncios),
      icon: <Megaphone className="h-6 w-6" />,
      color: '#EC4899',
      subtitle: 'Campanhas de marketing',
    },
    {
      title: 'Tarefas Concluídas',
      value: tarefasConcluidas,
      icon: <ListChecks className="h-6 w-6" />,
      color: '#10B981',
      subtitle: 'No workspace',
    },
    {
      title: 'Tarefas Atrasadas',
      value: tarefasAtrasadas,
      icon: <AlertTriangle className="h-6 w-6" />,
      color: '#EF4444',
      subtitle: 'Pendentes com prazo vencido',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Visão Geral</h1>
        <p className="text-muted-foreground mt-1">
          Resumo consolidado de todas as áreas do sistema
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <KPICard {...kpi} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
