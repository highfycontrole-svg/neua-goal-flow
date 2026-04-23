import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, isWithinInterval, parseISO, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  CalendarIcon,
  Wallet,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { KPICard } from '@/components/KPICard';
import { PageHeader } from '@/components/PageHeader';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

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

  // ─── Charts data ────────────────────────────────────────────
  // 6 months evolution: Faturamento + Lucro
  const last6MonthsData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const ref = subMonths(new Date(), 5 - i);
      const start = startOfMonth(ref);
      const end = endOfMonth(ref);
      const fat = receitas
        .filter(r => { try { const d = parseISO(r.data); return d >= start && d <= end; } catch { return false; } })
        .reduce((a, r) => a + Number(r.valor_bruto || 0), 0);
      const desp = despesas
        .filter(d => { try { const dt = parseISO(d.data); return dt >= start && dt <= end; } catch { return false; } })
        .reduce((a, d) => a + Number(d.valor || 0), 0);
      return {
        mes: format(ref, 'MMM/yy', { locale: ptBR }),
        faturamento: fat,
        despesas: desp,
        lucro: fat - desp,
      };
    });
  }, [receitas, despesas]);

  // Status entrega distribution (donut)
  const statusEntregaData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredPedidos.forEach(p => {
      const k = p.status_entrega || 'Sem status';
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredPedidos]);

  // Últimos 5 pedidos
  const ultimosPedidos = useMemo(() => {
    return [...filteredPedidos]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [filteredPedidos]);

  // Próximas tarefas a vencer
  const proximasTarefas = useMemo(() => {
    return [...filteredTasks]
      .filter(t => {
        if (!t.date) return false;
        const statusName = (t.workspace_statuses as any)?.name?.toLowerCase();
        const isCompleted = statusName === 'concluído' || statusName === 'concluida' || statusName === 'done';
        return !isCompleted && new Date(t.date) >= new Date();
      })
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
      .slice(0, 3);
  }, [filteredTasks]);

  // ROAS semanal (4 semanas) das campanhas
  const roasSemanal = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const start = subDays(new Date(), (4 - i) * 7);
      const end = subDays(new Date(), (3 - i) * 7);
      const camps = campanhas.filter(c => {
        try { const d = parseISO(c.data_inicio); return d >= start && d <= end; } catch { return false; }
      });
      const inv = camps.reduce((a, c) => a + Number(c.investimento || 0), 0);
      const rec = camps.reduce((a, c) => a + Number(c.receita_gerada || 0), 0);
      return { semana: format(start, 'dd/MM'), roas: inv > 0 ? rec / inv : 0 };
    });
  }, [campanhas]);

  // Top 3 produtos
  const top3Produtos = useMemo(() => {
    const rankOrder: Record<string, number> = { campeao: 0, alto: 1, normal: 2, baixo: 3 };
    return [...produtos]
      .sort((a, b) => (rankOrder[a.ranking] ?? 99) - (rankOrder[b.ranking] ?? 99))
      .slice(0, 3);
  }, [produtos]);

  // Marketing — última semana de campanhas
  const ultimaSemanaCampanhas = useMemo(() => {
    const start = subDays(new Date(), 7);
    return campanhas.filter(c => {
      try { return parseISO(c.data_inicio) >= start; } catch { return false; }
    });
  }, [campanhas]);

  const ultSemInv = ultimaSemanaCampanhas.reduce((a, c) => a + Number(c.investimento || 0), 0);
  const ultSemRec = ultimaSemanaCampanhas.reduce((a, c) => a + Number(c.receita_gerada || 0), 0);
  const ultSemPed = ultimaSemanaCampanhas.reduce((a, c) => a + Number(c.pedidos_gerados || 0), 0);
  const ultSemRoas = ultSemInv > 0 ? ultSemRec / ultSemInv : 0;
  const ultSemCpa = ultSemPed > 0 ? ultSemInv / ultSemPed : 0;

  // Progress
  const META_FATURAMENTO = 10000;
  const pctFaturamento = Math.min((faturamento / META_FATURAMENTO) * 100, 100);
  const pctMetas = metas.length > 0 ? (metasConcluidas / metas.length) * 100 : 0;
  const pctTarefas = filteredTasks.length > 0 ? (tarefasConcluidas / filteredTasks.length) * 100 : 0;

  const SECTOR_COLORS = ['hsl(125 91% 32%)', 'hsl(160 60% 55%)', 'hsl(30 80% 55%)', 'hsl(280 65% 60%)', 'hsl(340 75% 55%)', 'hsl(190 70% 50%)'];

  const periodOptions = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: 'mes', label: 'Este mês' },
    { value: 'ano', label: 'Este ano' },
    { value: 'todos', label: 'Todos' },
    { value: 'custom', label: 'Personalizado' },
  ];

  type KPIAccent = 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  const sectorAnim = (i: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: i * 0.08 },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Visão Geral"
        description="Resumo consolidado de todas as áreas do sistema"
        actions={
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
        }
      />

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

      {/* ═══ Setor: Financeiro ═══ */}
      <motion.section {...sectorAnim(0)} className="rounded-2xl border border-border bg-card overflow-hidden">
        <header className="flex items-center gap-3 px-6 py-4 border-b border-border bg-success/5">
          <div className="h-9 w-9 rounded-lg bg-success/15 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-success" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold">💰 Financeiro</h2>
            <p className="text-xs text-muted-foreground">Faturamento, custos, lucro e margem</p>
          </div>
        </header>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Faturamento" value={formatCurrency(faturamento)} icon={DollarSign} accent="success" description="Receita bruta total" />
            <KPICard title="Custos" value={formatCurrency(custos)} icon={TrendingDown} accent="destructive" description="Despesas totais" />
            <KPICard title="Lucro" value={formatCurrency(lucro)} icon={TrendingUp} accent={lucro >= 0 ? 'success' : 'destructive'} description="Faturamento - Custos" />
            <KPICard title="Margem" value={`${margem}%`} icon={Percent} accent="primary" description="Margem de lucro" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Meta de Faturamento</span>
              <span className="text-sm text-muted-foreground">{formatCurrency(faturamento)} / {formatCurrency(META_FATURAMENTO)}</span>
            </div>
            <Progress value={pctFaturamento} className="h-3" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold mb-3">Evolução (últimos 6 meses)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={last6MonthsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="faturamento" name="Faturamento" stroke="hsl(var(--success))" strokeWidth={2} />
                  <Line type="monotone" dataKey="lucro" name="Lucro" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Faturamento vs Despesas</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={last6MonthsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="faturamento" name="Faturamento" stackId="a" fill="hsl(var(--success))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══ Setor: Pedidos & Logística ═══ */}
      <motion.section {...sectorAnim(1)} className="rounded-2xl border border-border bg-card overflow-hidden">
        <header className="flex items-center gap-3 px-6 py-4 border-b border-border bg-info/5">
          <div className="h-9 w-9 rounded-lg bg-info/15 flex items-center justify-center">
            <Truck className="h-5 w-5 text-info" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold">📦 Pedidos & Logística</h2>
            <p className="text-xs text-muted-foreground">Status de envios e entregas</p>
          </div>
        </header>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPICard title="Pedidos Entregues" value={pedidosEntregues} icon={CheckCircle2} accent="success" description="Status: Entregue" />
            <KPICard title="Em Trânsito" value={pedidosEmTransito} icon={Clock} accent="warning" description="Em rota de entrega" />
            <KPICard title="Taxa de Entrega" value={`${taxaEntrega}%`} icon={TrendingUp} accent="info" description="Entregues / Total" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold mb-3">Distribuição por status</h3>
              {statusEntregaData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusEntregaData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={2}>
                      {statusEntregaData.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">Sem dados</div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Últimos 5 pedidos</h3>
              <div className="space-y-2">
                {ultimosPedidos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pedido</p>}
                {ultimosPedidos.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/40">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">#{p.numero_pedido}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), 'dd/MM/yyyy')}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{p.status_entrega || p.status || '—'}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══ Setor: Metas & Workspace ═══ */}
      <motion.section {...sectorAnim(2)} className="rounded-2xl border border-border bg-card overflow-hidden">
        <header className="flex items-center gap-3 px-6 py-4 border-b border-border bg-primary/5">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold">🎯 Metas & Workspace</h2>
            <p className="text-xs text-muted-foreground">Acompanhamento de objetivos e tarefas</p>
          </div>
        </header>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPICard title="Metas Concluídas" value={`${metasConcluidas}/${metas.length}`} icon={Target} accent="success" description="Total de metas" />
            <KPICard title="Tarefas Concluídas" value={tarefasConcluidas} icon={ListChecks} accent="success" description="No workspace" />
            <KPICard title="Tarefas Atrasadas" value={tarefasAtrasadas} icon={AlertTriangle} accent="destructive" description="Prazo vencido" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Conclusão de Metas</span>
                  <span className="text-xs text-muted-foreground">{pctMetas.toFixed(0)}%</span>
                </div>
                <Progress value={pctMetas} className="h-3" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Conclusão de Tarefas</span>
                  <span className="text-xs text-muted-foreground">{pctTarefas.toFixed(0)}%</span>
                </div>
                <Progress value={pctTarefas} className="h-3" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Próximas tarefas a vencer</h3>
              <div className="space-y-2">
                {proximasTarefas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tarefa próxima</p>}
                {proximasTarefas.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/40">
                    <p className="text-sm font-medium truncate flex-1">{t.title}</p>
                    <Badge variant="outline" className="text-[10px] ml-2">{format(new Date(t.date!), 'dd/MM')}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══ Setor: Marketing & Ads ═══ */}
      <motion.section {...sectorAnim(3)} className="rounded-2xl border border-border bg-card overflow-hidden">
        <header className="flex items-center gap-3 px-6 py-4 border-b border-border bg-warning/5">
          <div className="h-9 w-9 rounded-lg bg-warning/15 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold">📣 Marketing & Ads</h2>
            <p className="text-xs text-muted-foreground">Investimento e performance de campanhas</p>
          </div>
        </header>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Investimento Total" value={formatCurrency(investimentoAnuncios)} icon={Megaphone} accent="primary" description="Período selecionado" />
            <KPICard title="ROAS (7d)" value={ultSemRoas.toFixed(2)} icon={TrendingUp} accent={ultSemRoas >= 2 ? 'success' : 'warning'} description="Última semana" />
            <KPICard title="Compras (7d)" value={ultSemPed} icon={ShoppingBag} accent="info" description="Pedidos gerados" />
            <KPICard title="CPA (7d)" value={ultSemCpa > 0 ? formatCurrency(ultSemCpa) : '—'} icon={Target} accent="warning" description="Custo por aquisição" />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3">ROAS semanal (4 semanas)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={roasSemanal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="semana" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip formatter={(v: number) => v.toFixed(2)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="roas" stroke="hsl(var(--warning))" strokeWidth={2} dot={{ fill: 'hsl(var(--warning))' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.section>

      {/* ═══ Setor: Catálogo & Produtos ═══ */}
      <motion.section {...sectorAnim(4)} className="rounded-2xl border border-border bg-card overflow-hidden">
        <header className="flex items-center gap-3 px-6 py-4 border-b border-border bg-primary/5">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold">🛍️ Catálogo & Produtos</h2>
            <p className="text-xs text-muted-foreground">Performance do catálogo</p>
          </div>
        </header>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KPICard title="Produtos Catalogados" value={produtosCatalogados} icon={Package} accent="primary" description="Total no catálogo" />
            <KPICard title="Produtos Campeões" value={produtosCampeoes} icon={Trophy} accent="warning" description="Ranking campeão" />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3">Top 3 produtos</h3>
            <div className="space-y-2">
              {top3Produtos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum produto cadastrado</p>}
              {top3Produtos.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.nome}</p>
                      <p className="text-xs text-muted-foreground capitalize">{p.ranking}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{formatCurrency(p.preco_venda || 0)}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
