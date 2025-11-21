import { useEffect, useState } from 'react';
import { KPICard } from '@/components/KPICard';
import { Users, DollarSign, Package, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function ArquitetosKPIs() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAtivos: 0,
    vendasMes: 0,
    mediaConteudo: 0,
    proximosEnvios: 0
  });

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      // Total de arquitetos ativos
      const { data: arquitetos } = await supabase
        .from('arquitetos')
        .select('id, status_arquiteto')
        .eq('user_id', user?.id);

      const totalAtivos = arquitetos?.filter(a => a.status_arquiteto === 'Ativo').length || 0;

      // Vendas do mês atual
      const mesAtual = new Date();
      mesAtual.setDate(1);
      
      const { data: financeiro } = await supabase
        .from('desempenho_financeiro')
        .select('valor_total_vendido')
        .eq('user_id', user?.id)
        .gte('mes_referencia', mesAtual.toISOString());

      const vendasMes = financeiro?.reduce((acc, curr) => acc + parseFloat(String(curr.valor_total_vendido || '0')), 0) || 0;

      // Média de conteúdo entregue
      const { data: conteudos } = await supabase
        .from('logistica_conteudo')
        .select('status_reel, status_stories')
        .eq('user_id', user?.id)
        .gte('mes_referencia', mesAtual.toISOString());

      const entregues = conteudos?.filter(c => 
        c.status_reel === 'Entregue' || c.status_stories === 'Entregue'
      ).length || 0;
      const mediaConteudo = conteudos && conteudos.length > 0 ? Math.round((entregues / conteudos.length) * 100) : 0;

      // Próximos envios (próximos 7 dias)
      const proximaSemana = new Date();
      proximaSemana.setDate(proximaSemana.getDate() + 7);

      const { data: envios } = await supabase
        .from('logistica_conteudo')
        .select('proxima_data_envio_programada')
        .eq('user_id', user?.id)
        .gte('proxima_data_envio_programada', new Date().toISOString())
        .lte('proxima_data_envio_programada', proximaSemana.toISOString());

      setStats({
        totalAtivos,
        vendasMes: Math.round(vendasMes),
        mediaConteudo,
        proximosEnvios: envios?.length || 0
      });
    } catch (error) {
      console.error('Erro ao carregar KPIs:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard
        title="Arquitetos Ativos"
        value={stats.totalAtivos}
        icon={Users}
        description="Total de criadores ativos"
      />
      <KPICard
        title="Vendas do Mês"
        value={`R$ ${stats.vendasMes.toLocaleString('pt-BR')}`}
        icon={DollarSign}
        description="Valor total vendido no mês"
      />
      <KPICard
        title="Taxa de Entrega"
        value={`${stats.mediaConteudo}%`}
        icon={TrendingUp}
        description="Conteúdo entregue este mês"
      />
      <KPICard
        title="Envios Próximos"
        value={stats.proximosEnvios}
        icon={Package}
        description="Próximos 7 dias"
      />
    </div>
  );
}
