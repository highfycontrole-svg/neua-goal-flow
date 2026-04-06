import { useEffect, useState, useRef } from 'react';
import { KPICard } from '@/components/KPICard';
import { CreateMetaDialog } from '@/components/CreateMetaDialog';
import { MetasChart } from '@/components/MetasChart';
import { DonutChart } from '@/components/DonutChart';
import { MetasTable } from '@/components/MetasTable';
import { ExportButtons } from '@/components/ExportButtons';
import { Target, TrendingUp, Award, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
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
  
  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-4 md:p-6" ref={dashboardRef}>
        {/* Page Header */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-2">Painel de Metas - Loja Neua</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Acompanhe o progresso das suas metas e super metas da Neua. </p>
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