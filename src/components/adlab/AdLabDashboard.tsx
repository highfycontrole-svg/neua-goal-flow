import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMetaConnection } from '@/hooks/useMetaConnection';
import { useMetaInsights, getPurchaseValue, getActionValue } from '@/hooks/useMetaInsights';
import { KPICard } from '@/components/KPICard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  PlayCircle,
  Trophy,
  CheckCircle,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  MousePointerClick,
  Target,
  BarChart3,
  Receipt,
  RefreshCw,
  Link2,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalPacks: number;
  packsValidados: number;
  totalAnuncios: number;
  anunciosOtima: number;
}

const PRESETS = [
  { label: '7 dias', value: '7' },
  { label: '14 dias', value: '14' },
  { label: '30 dias', value: '30' },
];

export function AdLabDashboard() {
  const { user } = useAuth();
  const { connection } = useMetaConnection();
  const { insights, loading: insightsLoading, fetchInsights } = useMetaInsights();
  const [range, setRange] = useState('14');

  // Pack/anúncio counts (catalogue overview, kept as fallback below performance)
  const { data: stats } = useQuery({
    queryKey: ['adlab-dashboard-stats', user?.id],
    queryFn: async () => {
      const { data: packs } = await supabase.from('ad_packs').select('id, status');
      const { data: anuncios } = await supabase
        .from('ad_anuncios')
        .select('id, status_performance');

      const result: DashboardStats = {
        totalPacks: packs?.length || 0,
        packsValidados: packs?.filter((p) => p.status === 'validado').length || 0,
        totalAnuncios: anuncios?.length || 0,
        anunciosOtima:
          anuncios?.filter((a) => a.status_performance === 'otima').length || 0,
      };
      return result;
    },
    enabled: !!user?.id,
  });

  const accountId = connection?.selected_ad_account_id;

  const loadInsights = () => {
    if (!accountId) return;
    const days = Number(range);
    const today = new Date();
    fetchInsights({
      ad_account_id: accountId,
      level: 'campaign',
      date_start: format(subDays(today, days), 'yyyy-MM-dd'),
      date_stop: format(today, 'yyyy-MM-dd'),
    });
  };

  useEffect(() => {
    if (accountId) loadInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, range]);

  const metaKpis = useMemo(() => {
    const totalSpend = insights.reduce((s, i) => s + Number(i.spend || 0), 0);
    const totalPurchases = insights.reduce(
      (s, i) => s + getPurchaseValue(i.actions),
      0
    );
    const totalRevenue = insights.reduce(
      (s, i) => s + getPurchaseValue(i.action_values),
      0
    );
    const totalImpressions = insights.reduce(
      (s, i) => s + Number(i.impressions || 0),
      0
    );
    const totalClicks = insights.reduce((s, i) => s + Number(i.clicks || 0), 0);
    const carts = insights.reduce(
      (s, i) => s + getActionValue(i.actions, 'add_to_cart'),
      0
    );
    const checkouts = insights.reduce(
      (s, i) => s + getActionValue(i.actions, 'initiate_checkout'),
      0
    );

    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const cpm =
      totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
    const costPerPurchase = totalPurchases > 0 ? totalSpend / totalPurchases : 0;

    return {
      totalSpend,
      totalPurchases,
      totalRevenue,
      roas,
      cpc,
      ctr,
      cpm,
      carts,
      checkouts,
      costPerPurchase,
    };
  }, [insights]);

  const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtNum = (v: number) =>
    v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Performance Meta Ads
          </h2>
          <p className="text-xs text-foreground/55 mt-0.5">
            {accountId
              ? `Conta ${connection?.selected_ad_account_name ?? ''} • últimos ${range} dias`
              : 'Conecte sua conta Meta para ver os dados em tempo real'}
          </p>
        </div>
        {accountId && (
          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-28 h-9 text-xs bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1 text-xs"
              onClick={loadInsights}
              disabled={insightsLoading}
            >
              <RefreshCw
                className={`h-3 w-3 ${insightsLoading ? 'animate-spin' : ''}`}
              />
              Atualizar
            </Button>
          </div>
        )}
      </div>

      {/* Meta connected → performance KPIs */}
      {accountId ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KPICard
              title="Investimento"
              value={fmtBRL(metaKpis.totalSpend)}
              icon={DollarSign}
              accent="destructive"
            />
            <KPICard
              title="Compras"
              value={fmtNum(metaKpis.totalPurchases)}
              icon={ShoppingCart}
              accent="primary"
            />
            <KPICard
              title="Receita"
              value={fmtBRL(metaKpis.totalRevenue)}
              icon={TrendingUp}
              accent="success"
            />
            <KPICard
              title="ROAS"
              value={fmtNum(metaKpis.roas)}
              icon={Target}
              accent={
                metaKpis.roas >= 3
                  ? 'success'
                  : metaKpis.roas >= 1.5
                  ? 'warning'
                  : 'destructive'
              }
            />
            <KPICard
              title="Custo / Compra"
              value={fmtBRL(metaKpis.costPerPurchase)}
              icon={Receipt}
              accent="warning"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KPICard
              title="CTR"
              value={`${metaKpis.ctr.toFixed(2)}%`}
              icon={MousePointerClick}
              accent="info"
            />
            <KPICard
              title="CPC"
              value={fmtBRL(metaKpis.cpc)}
              icon={DollarSign}
              accent="info"
            />
            <KPICard
              title="CPM"
              value={fmtBRL(metaKpis.cpm)}
              icon={BarChart3}
              accent="info"
            />
            <KPICard
              title="Carrinhos"
              value={fmtNum(metaKpis.carts)}
              icon={ShoppingCart}
              accent="warning"
            />
            <KPICard
              title="Checkouts"
              value={fmtNum(metaKpis.checkouts)}
              icon={CheckCircle}
              accent="success"
            />
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <Link2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">
                Conecte sua conta Meta
              </h3>
              <p className="text-sm text-foreground/65">
                Veja investimento, compras, receita e ROAS direto do Pixel.
              </p>
            </div>
          </div>
          <Button asChild size="sm">
            <a href="/ads-neua">Conectar agora</a>
          </Button>
        </motion.div>
      )}

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Catalog stats (small overview) */}
      <div>
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-foreground/55 mb-3">
          Resumo do catálogo
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard
            title="Total Packs"
            value={stats?.totalPacks ?? 0}
            icon={Layers}
            accent="primary"
          />
          <KPICard
            title="Packs Validados"
            value={stats?.packsValidados ?? 0}
            icon={CheckCircle}
            accent="success"
          />
          <KPICard
            title="Total Anúncios"
            value={stats?.totalAnuncios ?? 0}
            icon={PlayCircle}
            accent="info"
          />
          <KPICard
            title="Ótima Performance"
            value={stats?.anunciosOtima ?? 0}
            icon={Trophy}
            accent="warning"
          />
        </div>
      </div>
    </div>
  );
}
