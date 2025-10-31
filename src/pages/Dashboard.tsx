import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { KPICard } from '@/components/KPICard';
import { CreateMetaDialog } from '@/components/CreateMetaDialog';
import { MetasChart } from '@/components/MetasChart';
import { Target, TrendingUp, Award, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
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
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSuperMetas: 0,
    totalMetas: 0,
    percentualConclusao: 0,
    melhorSetor: '-',
  });
  const [loading, setLoading] = useState(true);
  const [setores, setSetores] = useState<Array<{ id: string; nome: string }>>([]);
  const [superMetas, setSuperMetas] = useState<Array<{ id: string; nome: string }>>([]);
  const [chartData, setChartData] = useState<Array<{ setor: string; metas: number; superMetas: number }>>([]);
  const [filters, setFilters] = useState({
    ano: new Date().getFullYear(),
    mes: 0,
    setor: '',
  });

  useEffect(() => {
    if (user) {
      loadSetores();
      loadStats();
    }
  }, [user, filters]);

  const loadSetores = async () => {
    const { data, error } = await supabase.from('setores').select('id, nome');
    if (!error && data) {
      setSetores(data);
    }
  };

  const loadStats = async () => {
    try {
      let superMetasQuery = supabase
        .from('super_metas')
        .select('*, setores(nome)')
        .eq('user_id', user?.id);
      
      if (filters.ano) superMetasQuery = superMetasQuery.eq('ano', filters.ano);
      if (filters.mes) superMetasQuery = superMetasQuery.eq('mes', filters.mes);
      if (filters.setor) superMetasQuery = superMetasQuery.eq('setor_id', filters.setor);

      const { data: superMetas, error: superMetasError } = await superMetasQuery;
      if (superMetasError) throw superMetasError;

      let metasQuery = supabase
        .from('metas')
        .select('*, setores(nome)')
        .eq('user_id', user?.id);
      
      if (filters.ano) metasQuery = metasQuery.eq('ano', filters.ano);
      if (filters.mes) metasQuery = metasQuery.eq('mes', filters.mes);
      if (filters.setor) metasQuery = metasQuery.eq('setor_id', filters.setor);

      const { data: metas, error: metasError } = await metasQuery;
      if (metasError) throw metasError;

      const { data: allSuperMetas } = await supabase
        .from('super_metas')
        .select('id, nome')
        .eq('user_id', user?.id);
      
      if (allSuperMetas) setSuperMetas(allSuperMetas);

      // Calcular estatísticas
      const totalSuperMetas = superMetas?.length || 0;
      const totalMetas = metas?.length || 0;
      
      const superMetasConcluidas = superMetas?.filter(m => m.status).length || 0;
      const metasConcluidas = metas?.filter(m => m.status).length || 0;
      
      const totalItens = totalSuperMetas + totalMetas;
      const totalConcluidos = superMetasConcluidas + metasConcluidas;
      const percentualConclusao = totalItens > 0 ? Math.round((totalConcluidos / totalItens) * 100) : 0;

      // Calcular melhor setor
      const setorContagem: { [key: string]: { total: number; concluidas: number } } = {};
      
      [...(superMetas || []), ...(metas || [])].forEach((item: any) => {
        const setorNome = item.setores?.nome || 'Outros';
        if (!setorContagem[setorNome]) {
          setorContagem[setorNome] = { total: 0, concluidas: 0 };
        }
        setorContagem[setorNome].total++;
        if (item.status) {
          setorContagem[setorNome].concluidas++;
        }
      });

      let melhorSetor = '-';
      let melhorPercentual = 0;

      Object.entries(setorContagem).forEach(([setor, { total, concluidas }]) => {
        const percentual = (concluidas / total) * 100;
        if (percentual > melhorPercentual) {
          melhorPercentual = percentual;
          melhorSetor = setor;
        }
      });

      setStats({
        totalSuperMetas,
        totalMetas,
        percentualConclusao,
        melhorSetor,
      });

      const chartDataMap: { [key: string]: { metas: number; superMetas: number } } = {};
      setores.forEach(setor => {
        chartDataMap[setor.nome] = { metas: 0, superMetas: 0 };
      });
      
      metas?.forEach((m: any) => {
        const setorNome = m.setores?.nome || 'Outros';
        if (chartDataMap[setorNome]) chartDataMap[setorNome].metas++;
      });
      
      superMetas?.forEach((sm: any) => {
        const setorNome = sm.setores?.nome || 'Outros';
        if (chartDataMap[setorNome]) chartDataMap[setorNome].superMetas++;
      });

      setChartData(
        Object.entries(chartDataMap).map(([setor, counts]) => ({
          setor,
          ...counts,
        }))
      );
    } catch (error: any) {
      toast.error('Erro ao carregar estatísticas');
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">
            Painel de Metas
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o progresso das suas metas e super metas
          </p>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Super Metas"
            value={stats.totalSuperMetas}
            icon={Target}
            description="Total de super metas cadastradas"
          />
          <KPICard
            title="Metas"
            value={stats.totalMetas}
            icon={TrendingUp}
            description="Total de metas cadastradas"
          />
          <KPICard
            title="Conclusão Geral"
            value={`${stats.percentualConclusao}%`}
            icon={Award}
            description="Percentual de metas concluídas"
          />
          <KPICard
            title="Melhor Setor"
            value={stats.melhorSetor}
            icon={Calendar}
            description="Setor com melhor desempenho"
          />
        </div>

        {/* Filtros e Ações */}
        <div className="card-neua p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={filters.ano.toString()}
                onValueChange={(value) => setFilters({ ...filters, ano: parseInt(value) })}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.mes.toString()}
                onValueChange={(value) => setFilters({ ...filters, mes: parseInt(value) })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Todos</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <SelectItem key={m} value={m.toString()}>
                      {new Date(2000, m - 1).toLocaleString('pt-BR', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.setor}
                onValueChange={(value) => setFilters({ ...filters, setor: value })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Todos setores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {setores.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ano: new Date().getFullYear(), mes: 0, setor: '' })}
              >
                Limpar
              </Button>
            </div>

            <div className="flex gap-2">
              <CreateMetaDialog tipo="super_meta" onSuccess={loadStats} setores={setores} />
              <CreateMetaDialog tipo="meta" onSuccess={loadStats} setores={setores} superMetas={superMetas} />
            </div>
          </div>
        </div>

        {/* Gráfico */}
        <MetasChart data={chartData} />
      </div>
    </DashboardLayout>
  );
}
