import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { KPICard } from '@/components/KPICard';
import { Users, DollarSign, TrendingUp, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const tierColors: Record<string, string> = {
  'Bronze': '#CD7F32',
  'Prata': '#C0C0C0',
  'Ouro': '#FFD700',
  'Platina': '#E5E4E2'
};

export default function CreatorsResumo() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAtivos: 0,
    vendasMes: 0,
    mediaConteudo: 0,
    proximosEnvios: 0
  });
  const [vendasPorCreator, setVendasPorCreator] = useState<any[]>([]);
  const [evolucaoCreators, setEvolucaoCreators] = useState<any[]>([]);
  const [distribuicaoTier, setDistribuicaoTier] = useState<any[]>([]);
  const [conteudoStatus, setConteudoStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterMes, setFilterMes] = useState<string>(new Date().getMonth().toString());
  const [filterAno, setFilterAno] = useState<string>(new Date().getFullYear().toString());

  useEffect(() => {
    if (user) loadData();
  }, [user, filterMes, filterAno]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // KPIs
      const { data: creators } = await supabase
        .from('arquitetos')
        .select('id, status_arquiteto, classificacao_tier')
        .eq('user_id', user?.id);

      const totalAtivos = creators?.filter(c => c.status_arquiteto === 'Ativo').length || 0;

      // Vendas do mês
      const mesRef = new Date(parseInt(filterAno), parseInt(filterMes), 1).toISOString().split('T')[0];
      const { data: financeiro } = await supabase
        .from('desempenho_financeiro')
        .select('valor_total_vendido, arquiteto_id, arquitetos(nome_completo)')
        .eq('user_id', user?.id)
        .gte('mes_referencia', mesRef);

      const vendasMes = financeiro?.reduce((acc, curr) => acc + parseFloat(String(curr.valor_total_vendido || '0')), 0) || 0;

      // Vendas por Creator (top 10)
      const vendasAgrupadas = financeiro?.reduce((acc: any, curr: any) => {
        const nome = curr.arquitetos?.nome_completo || 'Desconhecido';
        if (!acc[nome]) acc[nome] = 0;
        acc[nome] += parseFloat(String(curr.valor_total_vendido || '0'));
        return acc;
      }, {});

      const vendasArray = Object.entries(vendasAgrupadas || {})
        .map(([name, value]) => ({ name, vendas: value }))
        .sort((a: any, b: any) => b.vendas - a.vendas)
        .slice(0, 10);
      setVendasPorCreator(vendasArray);

      // Conteúdo
      const { data: conteudos } = await supabase
        .from('logistica_conteudo')
        .select('status_reel, status_stories')
        .eq('user_id', user?.id)
        .gte('mes_referencia', mesRef);

      const entregues = conteudos?.filter(c => 
        c.status_reel === 'Entregue' || c.status_stories === 'Entregue'
      ).length || 0;
      const mediaConteudo = conteudos && conteudos.length > 0 ? Math.round((entregues / conteudos.length) * 100) : 0;

      // Próximos envios
      const proximaSemana = new Date();
      proximaSemana.setDate(proximaSemana.getDate() + 7);
      const { data: envios } = await supabase
        .from('logistica_conteudo')
        .select('proxima_data_envio_programada')
        .eq('user_id', user?.id)
        .gte('proxima_data_envio_programada', new Date().toISOString())
        .lte('proxima_data_envio_programada', proximaSemana.toISOString());

      // Distribuição por Tier
      const tierCount = creators?.reduce((acc: any, curr: any) => {
        const tier = curr.classificacao_tier || 'Bronze';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {});

      const tierArray = Object.entries(tierCount || {}).map(([name, value]) => ({ name, value }));
      setDistribuicaoTier(tierArray);

      // Evolução de Creators (últimos 6 meses)
      const evolucao = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const mes = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        
        // Simulado - em produção, buscar do histórico
        const ativos = totalAtivos - Math.floor(Math.random() * 5);
        evolucao.push({ mes, ativos });
      }
      setEvolucaoCreators(evolucao);

      // Status de Conteúdo
      const statusCount = conteudos?.reduce((acc: any, curr: any) => {
        const status = curr.status_reel || 'Pendente';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const statusArray = Object.entries(statusCount || {}).map(([name, value]) => ({ name, value }));
      setConteudoStatus(statusArray);

      setStats({
        totalAtivos,
        vendasMes: Math.round(vendasMes),
        mediaConteudo,
        proximosEnvios: envios?.length || 0
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">Resumo - Creators</h1>
        <p className="text-muted-foreground">
          Visão estratégica do desempenho do Neua Creators Club
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Select value={filterMes} onValueChange={setFilterMes}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i} value={i.toString()}>
                {new Date(2024, i).toLocaleDateString('pt-BR', { month: 'long' })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterAno} onValueChange={setFilterAno}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2023, 2022].map((ano) => (
              <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Creators Ativos"
          value={stats.totalAtivos}
          icon={Users}
          description="Total de criadores ativos"
        />
        <KPICard
          title="Vendas do Mês"
          value={`R$ ${stats.vendasMes.toLocaleString('pt-BR')}`}
          icon={DollarSign}
          description="Valor total vendido"
        />
        <KPICard
          title="Taxa de Entrega"
          value={`${stats.mediaConteudo}%`}
          icon={TrendingUp}
          description="Conteúdo entregue"
        />
        <KPICard
          title="Envios Próximos"
          value={stats.proximosEnvios}
          icon={Package}
          description="Próximos 7 dias"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Creator */}
        <div className="card-neua p-6">
          <h3 className="text-xl font-display font-bold mb-4">Vendas por Creator</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vendasPorCreator}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Evolução de Creators */}
        <div className="card-neua p-6">
          <h3 className="text-xl font-display font-bold mb-4">Evolução de Creators Ativos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolucaoCreators}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line type="monotone" dataKey="ativos" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição por Tier */}
        <div className="card-neua p-6">
          <h3 className="text-xl font-display font-bold mb-4">Distribuição por Tier</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distribuicaoTier}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={(entry) => entry.name}
              >
                {distribuicaoTier.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={tierColors[entry.name] || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status de Conteúdo */}
        <div className="card-neua p-6">
          <h3 className="text-xl font-display font-bold mb-4">Status de Entrega de Conteúdo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conteudoStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
