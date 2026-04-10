import { useEffect, useState, useRef } from 'react';
import { KPICard } from '@/components/KPICard';
import { CreateMetaDialog } from '@/components/CreateMetaDialog';
import { MetasChart } from '@/components/MetasChart';
import { DonutChart } from '@/components/DonutChart';
import { MetasTable } from '@/components/MetasTable';
import { ExportButtons } from '@/components/ExportButtons';
import { Target, TrendingUp, Award, Calendar, DollarSign, Users, MessageSquare, BarChart2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, startOfWeek } from 'date-fns';
import { getWeekStart } from '@/lib/weekUtils';
import { useMetaConnection } from '@/hooks/useMetaConnection';
import { useMetaInsights, getActionValue } from '@/hooks/useMetaInsights';
import { Link } from 'react-router-dom';
interface DashboardStats {
  totalSuperMetas: number;
  totalMetas: number;
  percentualConclusao: number;
  melhorSetor: string;
}
export default function Dashboard() {
  const {
    user
  } = useAuth();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalSuperMetas: 0,
    totalMetas: 0,
    percentualConclusao: 0,
    melhorSetor: '-'
  });
  const [loading, setLoading] = useState(true);
  const [setores, setSetores] = useState<Array<{
    id: string;
    nome: string;
  }>>([]);
  const [metas, setMetas] = useState<any[]>([]);
  const [superMetas, setSuperMetas] = useState<any[]>([]);
  const [allMetas, setAllMetas] = useState<Array<{
    id: string;
    nome: string;
  }>>([]);
  const [chartData, setChartData] = useState<Array<{
    setor: string;
    metas: number;
    superMetas: number;
  }>>([]);
  const [donutData, setDonutData] = useState<Array<{
    setor: string;
    total: number;
    concluidas: number;
  }>>([]);
  const [filters, setFilters] = useState({
    ano: new Date().getFullYear(),
    mes: 0,
    setor: ''
  });
  useEffect(() => {
    if (user) {
      loadSetores();
      loadStats();
    }
  }, [user, filters]);
  const loadSetores = async () => {
    const {
      data,
      error
    } = await supabase.from('setores').select('id, nome');
    if (!error && data) {
      setSetores(data);
    }
  };
  const loadStats = async () => {
    try {
      let superMetasQuery = supabase.from('super_metas').select('*, setores(nome)').eq('user_id', user?.id);
      if (filters.ano) superMetasQuery = superMetasQuery.eq('ano', filters.ano);
      if (filters.mes) superMetasQuery = superMetasQuery.eq('mes', filters.mes);
      if (filters.setor) superMetasQuery = superMetasQuery.eq('setor_id', filters.setor);
      const {
        data: superMetas,
        error: superMetasError
      } = await superMetasQuery;
      if (superMetasError) throw superMetasError;
      let metasQuery = supabase.from('metas').select('*, setores(nome)').eq('user_id', user?.id);
      if (filters.ano) metasQuery = metasQuery.eq('ano', filters.ano);
      if (filters.mes) metasQuery = metasQuery.eq('mes', filters.mes);
      if (filters.setor) metasQuery = metasQuery.eq('setor_id', filters.setor);
      const {
        data: metas,
        error: metasError
      } = await metasQuery;
      if (metasError) throw metasError;
      setMetas(metas || []);
      setSuperMetas(superMetas || []);
      const {
        data: allMetasData
      } = await supabase.from('metas').select('id, nome').eq('user_id', user?.id);
      if (allMetasData) setAllMetas(allMetasData);

      // Calcular estatísticas
      const totalSuperMetas = superMetas?.length || 0;
      const totalMetas = metas?.length || 0;
      const superMetasConcluidas = superMetas?.filter(m => m.status).length || 0;
      const metasConcluidas = metas?.filter(m => m.status).length || 0;
      const totalItens = totalSuperMetas + totalMetas;
      const totalConcluidos = superMetasConcluidas + metasConcluidas;
      const percentualConclusao = totalItens > 0 ? Math.round(totalConcluidos / totalItens * 100) : 0;

      // Calcular melhor setor
      const setorContagem: {
        [key: string]: {
          total: number;
          concluidas: number;
        };
      } = {};
      [...(superMetas || []), ...(metas || [])].forEach((item: any) => {
        const setorNome = item.setores?.nome || 'Outros';
        if (!setorContagem[setorNome]) {
          setorContagem[setorNome] = {
            total: 0,
            concluidas: 0
          };
        }
        setorContagem[setorNome].total++;
        if (item.status) {
          setorContagem[setorNome].concluidas++;
        }
      });
      let melhorSetor = '-';
      let melhorPercentual = 0;
      Object.entries(setorContagem).forEach(([setor, {
        total,
        concluidas
      }]) => {
        const percentual = concluidas / total * 100;
        if (percentual > melhorPercentual) {
          melhorPercentual = percentual;
          melhorSetor = setor;
        }
      });
      setStats({
        totalSuperMetas,
        totalMetas,
        percentualConclusao,
        melhorSetor
      });
      const chartDataMap: {
        [key: string]: {
          metas: number;
          superMetas: number;
        };
      } = {};
      setores.forEach(setor => {
        chartDataMap[setor.nome] = {
          metas: 0,
          superMetas: 0
        };
      });
      metas?.forEach((m: any) => {
        const setorNome = m.setores?.nome || 'Outros';
        if (chartDataMap[setorNome]) chartDataMap[setorNome].metas++;
      });
      superMetas?.forEach((sm: any) => {
        const setorNome = sm.setores?.nome || 'Outros';
        if (chartDataMap[setorNome]) chartDataMap[setorNome].superMetas++;
      });
      setChartData(Object.entries(chartDataMap).map(([setor, counts]) => ({
        setor,
        ...counts
      })));

      // Preparar dados para o donut chart
      const donutDataMap: {
        [key: string]: {
          total: number;
          concluidas: number;
        };
      } = {};
      setores.forEach(setor => {
        donutDataMap[setor.nome] = {
          total: 0,
          concluidas: 0
        };
      });
      [...(metas || []), ...(superMetas || [])].forEach((item: any) => {
        const setorNome = item.setores?.nome || 'Outros';
        if (donutDataMap[setorNome]) {
          donutDataMap[setorNome].total++;
          if (item.status) {
            donutDataMap[setorNome].concluidas++;
          }
        }
      });
      setDonutData(Object.entries(donutDataMap).map(([setor, counts]) => ({
        setor,
        ...counts
      })));
    } catch (error: any) {
      toast.error('Erro ao carregar estatísticas');
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const now = new Date();
  const weekStartStr = format(getWeekStart(now), 'yyyy-MM-dd');
  const startMonth = format(startOfMonth(now), 'yyyy-MM-dd');
  const endMonth = format(endOfMonth(now), 'yyyy-MM-dd');
  const mesAtual = now.getMonth() + 1;
  const anoAtual = now.getFullYear();

  const { data: weekReceitas = [] } = useQuery({
    queryKey: ['dash-week-receitas', user?.id, weekStartStr],
    queryFn: async () => {
      const { data } = await supabase.from('receitas').select('valor_bruto')
        .gte('data', weekStartStr);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: metaFat } = useQuery({
    queryKey: ['dash-meta-fat', user?.id, mesAtual, anoAtual],
    queryFn: async () => {
      const { data } = await supabase.from('metas').select('valor_meta')
        .eq('mes', mesAtual).eq('ano', anoAtual).ilike('nome', '%faturamento%').maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: weekGrupoVip } = useQuery({
    queryKey: ['dash-grupo-vip', user?.id, weekStartStr],
    queryFn: async () => {
      const { data } = await supabase.from('kpi_grupo_vip' as any).select('*')
        .eq('semana_inicio', weekStartStr).maybeSingle();
      return data as any;
    },
    enabled: !!user?.id,
  });

  const { data: weekManychat } = useQuery({
    queryKey: ['dash-manychat', user?.id, weekStartStr],
    queryFn: async () => {
      const { data } = await supabase.from('kpi_manychat' as any).select('*')
        .eq('semana_inicio', weekStartStr).maybeSingle();
      return data as any;
    },
    enabled: !!user?.id,
  });

  const { connection } = useMetaConnection();
  const { insights, fetchInsights } = useMetaInsights();

  useEffect(() => {
    if (connection?.selected_ad_account_id) {
      fetchInsights({
        ad_account_id: connection.selected_ad_account_id,
        level: 'campaign',
        date_preset: 'this_week_sun_today',
      });
    }
  }, [connection?.selected_ad_account_id, fetchInsights]);

  const fatSemana = weekReceitas.reduce((a: number, r: any) => a + Number(r.valor_bruto), 0);
  const metaFatVal = metaFat?.valor_meta ? parseFloat(metaFat.valor_meta.replace(/\./g, '').replace(',', '.')) || 30000 : 30000;
  const metaSemanal = metaFatVal / 4;
  const pctFatSemana = metaSemanal > 0 ? (fatSemana / metaSemanal) * 100 : 0;

  const weekSpend = insights.reduce((a, i) => a + Number(i.spend || 0), 0);
  const weekRevenue = insights.reduce((a, i) => a + getActionValue(i.action_values, 'purchase') + getActionValue(i.action_values, 'omni_purchase'), 0);
  const weekRoas = weekSpend > 0 ? weekRevenue / weekSpend : 0;
  const roasBadge = weekRoas >= 3 ? 'bg-green-500/20 text-green-400' : weekRoas >= 1.5 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400';
  const roasLabel = weekRoas >= 3 ? 'Ótimo' : weekRoas >= 1.5 ? 'Regular' : 'Baixo';

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-4 md:p-6" ref={dashboardRef}>
        {/* Page Header */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-2">Painel de Metas - Loja Neua</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Acompanhe o progresso das suas metas e super metas da Neua.</p>
        </div>

        {/* KPI Weekly Widget */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            Resumo KPIs da Semana
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Faturamento vs Meta semanal */}
            <div className="p-4 rounded-2xl bg-card border border-border/30 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Faturamento Semanal</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(fatSemana)}</p>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full transition-all ${pctFatSemana >= 100 ? 'bg-green-500' : pctFatSemana >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(pctFatSemana, 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Meta semanal est.: {formatCurrency(metaSemanal)}</p>
            </div>

            {/* ROAS */}
            <div className="p-4 rounded-2xl bg-card border border-border/30 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">ROAS da Semana</span>
              </div>
              {connection?.selected_ad_account_id ? (
                <>
                  <p className="text-lg font-bold">{weekRoas.toFixed(2)}</p>
                  <Badge className={`mt-1 text-xs ${roasBadge}`}>{roasLabel}</Badge>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-muted-foreground">—</p>
                  <Link to="/ads-neua" className="text-xs text-primary underline">Conectar Meta Ads</Link>
                </>
              )}
            </div>

            {/* Grupo VIP */}
            <div className="p-4 rounded-2xl bg-card border border-border/30 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Grupo VIP</span>
              </div>
              {weekGrupoVip ? (
                <>
                  <p className="text-lg font-bold">{weekGrupoVip.novos_membros} novos</p>
                  <p className="text-xs text-muted-foreground">Total: {weekGrupoVip.total_membros} membros</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-muted-foreground">0</p>
                  <Link to="/kpis" className="text-xs text-primary underline">Registrar →</Link>
                </>
              )}
            </div>

            {/* ManyChat */}
            <div className="p-4 rounded-2xl bg-card border border-border/30 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">ManyChat</span>
              </div>
              {weekManychat ? (
                <>
                  <p className="text-lg font-bold">{weekManychat.vendas_atribuidas} vendas</p>
                  <Badge className={`mt-1 text-xs ${weekManychat.vendas_atribuidas > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {weekManychat.vendas_atribuidas > 0 ? '✓ Ativo' : '⚠ Sem vendas'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{weekManychat.leads_gerados} leads gerados</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-muted-foreground">—</p>
                  <Badge className="mt-1 text-xs bg-muted text-muted-foreground">Não registrado</Badge>
                </>
              )}
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <KPICard title="Super Metas" value={stats.totalSuperMetas} icon={Target} description="Total de super metas cadastradas" />
          <KPICard title="Metas" value={stats.totalMetas} icon={TrendingUp} description="Total de metas cadastradas" />
          <KPICard title="Conclusão Geral" value={`${stats.percentualConclusao}%`} icon={Award} description="Percentual de metas concluídas" />
          <KPICard title="Melhor Setor" value={stats.melhorSetor} icon={Calendar} description="Setor com melhor desempenho" />
        </div>

        {/* Filtros e Ações */}
        <div className="p-4 sm:p-6 rounded-2xl border border-border/30 bg-background">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Select value={filters.ano.toString()} onValueChange={value => setFilters({
              ...filters,
              ano: parseInt(value)
            })}>
                <SelectTrigger className="w-[100px] sm:w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={filters.mes.toString()} onValueChange={value => setFilters({
              ...filters,
              mes: parseInt(value)
            })}>
                <SelectTrigger className="w-[110px] sm:w-[140px]">
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Todos</SelectItem>
                  {Array.from({
                  length: 12
                }, (_, i) => i + 1).map(m => <SelectItem key={m} value={m.toString()}>
                      {new Date(2000, m - 1).toLocaleString('pt-BR', {
                    month: 'long'
                  })}
                    </SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={filters.setor || 'all'} onValueChange={value => setFilters({
              ...filters,
              setor: value === 'all' ? '' : value
            })}>
                <SelectTrigger className="w-[110px] sm:w-[140px]">
                  <SelectValue placeholder="Todos setores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {setores.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={() => setFilters({
              ano: new Date().getFullYear(),
              mes: 0,
              setor: ''
            })}>
                Limpar
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <ExportButtons metas={metas} superMetas={superMetas} dashboardRef={dashboardRef} />
              <CreateMetaDialog tipo="meta" onSuccess={loadStats} setores={setores} />
              <CreateMetaDialog tipo="super_meta" onSuccess={loadStats} setores={setores} metas={allMetas} />
            </div>
          </div>
        </div>

        {/* Gráficos de Pizza */}
        <DonutChart data={donutData} onSectorClick={setor => {
        const setorObj = setores.find(s => s.nome === setor);
        if (setorObj) {
          setFilters({
            ...filters,
            setor: setorObj.id
          });
        }
      }} />

        {/* Tabelas */}
        <div className="p-4 sm:p-6 rounded-2xl border border-border/30 bg-background">
          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="bg-card border border-border/30 p-1 rounded-xl gap-1 h-auto grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="geral" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-xs sm:text-sm">Geral</TabsTrigger>
              <TabsTrigger value="por-setor" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-xs sm:text-sm">Por Setor</TabsTrigger>
              <TabsTrigger value="resumo" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-xs sm:text-sm">Resumo</TabsTrigger>
            </TabsList>
            <TabsContent value="geral">
              <MetasTable metas={metas} superMetas={superMetas} setores={setores} allMetas={allMetas} onUpdate={loadStats} viewType="geral" />
            </TabsContent>
            <TabsContent value="por-setor">
              <MetasTable metas={metas} superMetas={superMetas} setores={setores} allMetas={allMetas} onUpdate={loadStats} viewType="por-setor" />
            </TabsContent>
            <TabsContent value="resumo">
              <MetasTable metas={metas} superMetas={superMetas} setores={setores} allMetas={allMetas} onUpdate={loadStats} viewType="resumo" />
            </TabsContent>
          </Tabs>
        </div>

        {/* Gráfico de Barras - Movido para o final */}
        <MetasChart data={chartData} />
      </div>
  );
}