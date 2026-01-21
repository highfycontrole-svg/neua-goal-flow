import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Layers, PlayCircle, Trophy, TrendingUp, Lightbulb, CheckCircle } from 'lucide-react';

interface DashboardStats {
  totalPacks: number;
  packsValidados: number;
  totalAnuncios: number;
  anunciosOtima: number;
  anunciosBoa: number;
  anunciosRodando: number;
  anunciosFinalizados: number;
}

export function AdLabDashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['adlab-dashboard-stats', user?.id],
    queryFn: async () => {
      // Fetch packs
      const { data: packs } = await supabase
        .from('ad_packs')
        .select('id, status');

      // Fetch anuncios
      const { data: anuncios } = await supabase
        .from('ad_anuncios')
        .select('id, status_producao, status_performance');

      const result: DashboardStats = {
        totalPacks: packs?.length || 0,
        packsValidados: packs?.filter(p => p.status === 'validado').length || 0,
        totalAnuncios: anuncios?.length || 0,
        anunciosOtima: anuncios?.filter(a => a.status_performance === 'otima').length || 0,
        anunciosBoa: anuncios?.filter(a => a.status_performance === 'boa').length || 0,
        anunciosRodando: anuncios?.filter(a => a.status_producao === 'rodando').length || 0,
        anunciosFinalizados: anuncios?.filter(a => a.status_producao === 'finalizado').length || 0,
      };

      return result;
    },
    enabled: !!user?.id,
  });

  const kpis = [
    {
      title: 'Total Packs',
      value: stats?.totalPacks || 0,
      icon: Layers,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Packs Validados',
      value: stats?.packsValidados || 0,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Anúncios',
      value: stats?.totalAnuncios || 0,
      icon: PlayCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Ótima Performance',
      value: stats?.anunciosOtima || 0,
      icon: Trophy,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Boa Performance',
      value: stats?.anunciosBoa || 0,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Rodando Agora',
      value: stats?.anunciosRodando || 0,
      icon: Lightbulb,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="p-4 rounded-xl bg-card border border-border"
        >
          <div className={`w-10 h-10 rounded-lg ${kpi.bgColor} flex items-center justify-center mb-3`}>
            <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
          </div>
          <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{kpi.title}</p>
        </motion.div>
      ))}
    </div>
  );
}
