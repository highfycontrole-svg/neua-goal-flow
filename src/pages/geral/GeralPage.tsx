import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnimatedGradientBackground } from '@/components/AnimatedGradientBackground';
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
  AlertTriangle,
  CalendarIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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
      <Card className="bg-card border-border transition-all duration-300">
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

type PeriodType = '7d' | '30d' | 'mes' | 'ano' | 'todos' | 'custom';

export default function GeralPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<PeriodType>('30d');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  const getDateRange = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    switch (period) {
      case '7d':
        return { start: subDays(today, 7), end: today };
      case '30d':
        return { start: subDays(today, 30), end: today };
      case 'mes':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'ano':
        return { start: startOfYear(today), end: today };
      case 'custom':
        if (customStartDate && customEndDate) {
          return { start: customStartDate, end: customEndDate };
        }
        return null;
      case 'todos':
      default:
        return null;
    }
  }, [period, customStartDate, customEndDate]);

  const isInDateRange = (dateStr: string | null | undefined) => {
    if (!dateStr) return period === 'todos';
    if (!getDateRange) return true;
    
    try {
      const date = parseISO(dateStr);
      return isWithinInterval(date, { start: getDateRange.start, end: getDateRange.end });
    } catch {
      return false;
    }
  };

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

  // Filtered data
  const filteredReceitas = useMemo(() => 
    receitas.filter(r => isInDateRange(r.data)), 
    [receitas, getDateRange, period]
  );
  
  const filteredDespesas = useMemo(() => 
    despesas.filter(d => isInDateRange(d.data)), 
    [despesas, getDateRange, period]
  );
  
  const filteredPedidos = useMemo(() => 
    pedidos.filter(p => isInDateRange(p.created_at)), 
    [pedidos, getDateRange, period]
  );
  
  const filteredCampanhas = useMemo(() => 
    campanhas.filter(c => isInDateRange(c.data_inicio)), 
    [campanhas, getDateRange, period]
  );
  
  const filteredTasks = useMemo(() => 
    tasks.filter(t => isInDateRange(t.created_at)), 
    [tasks, getDateRange, period]
  );

  // Cálculos com dados filtrados
  const produtosCatalogados = produtos.length;
  const produtosCampeoes = produtos.filter(p => p.ranking === 'campeao').length;
  
  const faturamento = filteredReceitas.reduce((acc, r) => acc + (r.valor_bruto || 0), 0);
  const custos = filteredDespesas.reduce((acc, d) => acc + (d.valor || 0), 0);
  const lucro = faturamento - custos;
  const margem = faturamento > 0 ? ((lucro / faturamento) * 100).toFixed(1) : '0';

  const pedidosEntregues = filteredPedidos.filter(p => p.status_entrega === 'Entregue').length;
  const pedidosEmTransito = filteredPedidos.filter(p => p.status_entrega === 'Em Trânsito').length;
  const taxaEntrega = filteredPedidos.length > 0 
    ? ((pedidosEntregues / filteredPedidos.length) * 100).toFixed(1) 
    : '0';

  const metasConcluidas = metas.filter(m => m.status === true).length;

  const investimentoAnuncios = filteredCampanhas.reduce((acc, c) => acc + (c.investimento || 0), 0);

  const tarefasConcluidas = filteredTasks.filter(t => {
    const statusName = (t.workspace_statuses as any)?.name?.toLowerCase();
    return statusName === 'concluído' || statusName === 'concluida' || statusName === 'done';
  }).length;

  const hoje = new Date();
  const tarefasAtrasadas = filteredTasks.filter(t => {
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

  const periodOptions = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: 'mes', label: 'Este mês' },
    { value: 'ano', label: 'Este ano' },
    { value: 'todos', label: 'Todos' },
    { value: 'custom', label: 'Personalizado' },
  ];

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
    <AnimatedGradientBackground>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Visão Geral</h1>
            <p className="text-muted-foreground mt-1">
              Resumo consolidado de todas as áreas do sistema
            </p>
          </div>

          {/* Period Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {periodOptions.map((option) => (
              <Button
                key={option.value}
                variant={period === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(option.value as PeriodType)}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border border-border">
            <span className="text-sm text-muted-foreground">De:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal",
                    !customStartDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customStartDate ? format(customStartDate, "dd/MM/yyyy", { locale: ptBR }) : "Data início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={setCustomStartDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <span className="text-sm text-muted-foreground">Até:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal",
                    !customEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customEndDate ? format(customEndDate, "dd/MM/yyyy", { locale: ptBR }) : "Data fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customEndDate}
                  onSelect={setCustomEndDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

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
    </AnimatedGradientBackground>
  );
}
