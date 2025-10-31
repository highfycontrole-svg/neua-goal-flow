import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { KPICard } from '@/components/KPICard';
import { Target, TrendingUp, Award, Calendar } from 'lucide-react';
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

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      // Buscar super metas
      const { data: superMetas, error: superMetasError } = await supabase
        .from('super_metas')
        .select('*, setores(nome)')
        .eq('user_id', user?.id);

      if (superMetasError) throw superMetasError;

      // Buscar metas
      const { data: metas, error: metasError } = await supabase
        .from('metas')
        .select('*, setores(nome)')
        .eq('user_id', user?.id);

      if (metasError) throw metasError;

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

        {/* Welcome Message */}
        <div className="card-neua p-8 text-center">
          <h2 className="text-2xl font-display font-bold mb-4">
            Bem-vindo ao Painel de Metas Neua
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Organize, acompanhe e conquiste suas metas com clareza e eficiência. 
            Use o menu acima para começar a gerenciar suas super metas e metas.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
