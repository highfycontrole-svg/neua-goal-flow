import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMetaInsights, getActionValue, getPurchaseValue } from '@/hooks/useMetaInsights';
import { useMetaConnection } from '@/hooks/useMetaConnection';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subWeeks, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getWeekOptions, getWeekStart } from '@/lib/weekUtils';
import {
  DollarSign, TrendingUp, Target, ShoppingCart, Percent, BarChart2,
  Users, MessageSquare, MousePointerClick, ArrowUpRight, ArrowDownRight,
  Crosshair, Save, Pencil, Check, X
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { formatCurrency } from "@/lib/utils";

function parseMeta(val: string | undefined | null): number {
  if (!val) return 0;
  const cleaned = val.replace(/R\$\s?/g, '').replace(/\s/g, '').trim();
  if (cleaned.includes(',')) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
  }
  const dotIdx = cleaned.indexOf('.');
  if (dotIdx !== -1 && cleaned.length - dotIdx - 1 !== 2) {
    return parseFloat(cleaned.replace(/\./g, '')) || 0;
  }
  return parseFloat(cleaned) || 0;
}

// ─── FINANCEIRO TAB ─────────────────────────────────────────────
function FinanceiroTab({ selectedMes, selectedAno, setSelectedMes, setSelectedAno }: {
  selectedMes: number; selectedAno: number;
  setSelectedMes: (m: number) => void; setSelectedAno: (a: number) => void;
}) {
  const { user } = useAuth();
  const now = new Date();

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      label: format(d, 'MMMM yyyy', { locale: ptBR }),
      mes: d.getMonth() + 1,
      ano: d.getFullYear(),
    };
  });

  const startMonth = format(new Date(selectedAno, selectedMes - 1, 1), 'yyyy-MM-dd');
  const endMonth = format(endOfMonth(new Date(selectedAno, selectedMes - 1, 1)), 'yyyy-MM-dd');
  const prevDate = new Date(selectedAno, selectedMes - 2, 1);
  const startPrev = format(prevDate, 'yyyy-MM-dd');
  const endPrev = format(endOfMonth(prevDate), 'yyyy-MM-dd');

  const { data: receitas = [] } = useQuery({
    queryKey: ['kpi-receitas', user?.id, selectedMes, selectedAno],
    queryFn: async () => {
      const { data } = await supabase.from('receitas').select('*')
        .gte('data', startMonth).lte('data', endMonth);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: receitasPrev = [] } = useQuery({
    queryKey: ['kpi-receitas-prev', user?.id, selectedMes, selectedAno],
    queryFn: async () => {
      const { data } = await supabase.from('receitas').select('valor_bruto, taxas')
        .gte('data', startPrev).lte('data', endPrev);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: despesas = [] } = useQuery({
    queryKey: ['kpi-despesas', user?.id, selectedMes, selectedAno],
    queryFn: async () => {
      const { data } = await supabase.from('despesas').select('valor')
        .gte('data', startMonth).lte('data', endMonth);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: metaFaturamento } = useQuery({
    queryKey: ['meta-faturamento', user?.id, selectedMes, selectedAno],
    queryFn: async () => {
      const { data } = await supabase.from('metas').select('valor_meta')
        .eq('mes', selectedMes).eq('ano', selectedAno).ilike('nome', '%faturamento%').maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: metaLucro } = useQuery({
    queryKey: ['meta-lucro', user?.id, selectedMes, selectedAno],
    queryFn: async () => {
      const { data } = await supabase.from('metas').select('valor_meta')
        .eq('mes', selectedMes).eq('ano', selectedAno).ilike('nome', '%lucro%').maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // CPA: pull most recent week from kpi_meta_ads as fallback to live API data
  const { data: latestMetaAdsKpi } = useQuery({
    queryKey: ['kpi-meta-ads-latest', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('kpi_meta_ads' as any).select('*')
        .order('semana_inicio', { ascending: false }).limit(1).maybeSingle();
      return data as any;
    },
    enabled: !!user?.id,
  });

  // Live Meta API fallback for CPA
  const { connection } = useMetaConnection();
  const { insights: liveInsights, fetchInsights: fetchLiveInsights } = useMetaInsights();
  useEffect(() => {
    if (connection?.selected_ad_account_id) {
      fetchLiveInsights({
        ad_account_id: connection.selected_ad_account_id,
        level: 'account',
        date_preset: 'last_7d',
      });
    }
  }, [connection?.selected_ad_account_id, fetchLiveInsights]);

  const liveSpend = liveInsights.reduce((a, i) => a + Number(i.spend || 0), 0);
  const livePurchases = liveInsights.reduce((a, i) => a + getPurchaseValue(i.actions), 0);
  const liveCpa = livePurchases > 0 ? liveSpend / livePurchases : 0;

  const cpaAtual = liveCpa > 0
    ? liveCpa
    : Number(latestMetaAdsKpi?.custo_por_compra || 0);

  const CPA_META = 117;
  const CPA_SUPER_META = 105;

  const cpaBadgeClass = cpaAtual === 0
    ? 'bg-muted text-muted-foreground'
    : cpaAtual <= CPA_SUPER_META
      ? 'bg-success/15 text-success'
      : cpaAtual <= CPA_META
        ? 'bg-warning/15 text-warning'
        : 'bg-destructive/15 text-destructive';

  const cpaLabel = cpaAtual === 0
    ? 'Sem dados'
    : cpaAtual <= CPA_SUPER_META
      ? 'Super meta'
      : cpaAtual <= CPA_META
        ? 'Dentro da meta'
        : 'Acima da meta';

  // Range for progress bar: 0 → 2x META (so target sits at 50%)
  const cpaPctOfRange = Math.min((cpaAtual / (CPA_META * 2)) * 100, 100);
  const superMetaPct = (CPA_SUPER_META / (CPA_META * 2)) * 100;
  const metaPct = (CPA_META / (CPA_META * 2)) * 100;

  // CÁLCULOS CORRETOS
  const faturamentoBruto = receitas.reduce((a, r) => a + Number(r.valor_bruto || 0), 0);
  const totalTaxas = receitas.reduce((a, r) => a + Number(r.taxas || 0), 0);
  const receitaLiquida = faturamentoBruto - totalTaxas;

  const totalDespesas = despesas.reduce((a, d) => a + Number(d.valor || 0), 0);
  const lucroLiquido = receitaLiquida - totalDespesas;
  const margem = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0;

  const qtdPedidos = receitas.length;
  const ticketMedio = qtdPedidos > 0 ? receitaLiquida / qtdPedidos : 0;

  const receitaLiquidaPrev = receitasPrev.reduce((a, r) => a + Number(r.valor_bruto || 0) - Number(r.taxas || 0), 0);
  const crescimento = receitaLiquidaPrev > 0 ? ((receitaLiquida - receitaLiquidaPrev) / receitaLiquidaPrev) * 100 : 0;

  const metaFat = parseMeta(metaFaturamento?.valor_meta) || 30000;
  const metaLuc = parseMeta(metaLucro?.valor_meta) || 3000;
  const metaTicket = 380;
  const metaMargem = 10;
  const pctFat = metaFat > 0 ? (receitaLiquida / metaFat) * 100 : 0;
  const pctLuc = metaLuc > 0 ? (lucroLiquido / metaLuc) * 100 : 0;

  const progressColor = (pct: number) =>
    pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-500';

  // Weekly chart data — use selected month center as reference
  const weeklyData = Array.from({ length: 4 }, (_, i) => {
    const ws = getWeekStart(subWeeks(new Date(selectedAno, selectedMes - 1, 15), 3 - i));
    const we = endOfWeek(ws, { weekStartsOn: 1 });
    const wsStr = format(ws, 'yyyy-MM-dd');
    const weStr = format(we, 'yyyy-MM-dd');
    const total = receitas
      .filter(r => r.data >= wsStr && r.data <= weStr)
      .reduce((a, r) => a + Number(r.valor_bruto || 0) - Number(r.taxas || 0), 0);
    return { name: `Sem ${format(ws, 'dd/MM')}`, valor: total };
  });

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex items-center gap-3 mb-6">
        <Select
          value={`${selectedMes}-${selectedAno}`}
          onValueChange={(val) => {
            const [m, a] = val.split('-').map(Number);
            setSelectedMes(m);
            setSelectedAno(a);
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Selecionar mês" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(opt => (
              <SelectItem key={`${opt.mes}-${opt.ano}`} value={`${opt.mes}-${opt.ano}`}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Receita Líquida */}
        <KpiProgressCard title="Receita Líquida" value={receitaLiquida} meta={metaFat} pct={pctFat}
          icon={DollarSign} crescimento={crescimento} progressColor={progressColor(pctFat)} />
        {/* Lucro */}
        <KpiProgressCard title="Lucro Líquido" value={lucroLiquido} meta={metaLuc} pct={pctLuc}
          icon={TrendingUp} progressColor={progressColor(pctLuc)} />
        {/* Margem */}
        <div className="p-5 rounded-2xl bg-card border border-border/30 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10"><Percent className="h-4 w-4 text-primary" /></div>
            <span className="text-sm text-muted-foreground">Margem %</span>
          </div>
          <p className="text-2xl font-bold">{margem.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">Meta: {metaMargem}%</p>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all ${margem >= metaMargem ? 'bg-green-500' : margem >= metaMargem * 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min((margem / metaMargem) * 100, 100)}%` }} />
          </div>
        </div>
        {/* Ticket Médio */}
        <div className="p-5 rounded-2xl bg-card border border-border/30 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10"><ShoppingCart className="h-4 w-4 text-primary" /></div>
            <span className="text-sm text-muted-foreground">Ticket Médio</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(ticketMedio)}</p>
          <p className="text-xs text-muted-foreground mt-1">Meta: {formatCurrency(metaTicket)}</p>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all ${ticketMedio >= metaTicket ? 'bg-green-500' : ticketMedio >= metaTicket * 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min((ticketMedio / metaTicket) * 100, 100)}%` }} />
          </div>
        </div>
        {/* Pedidos (= receitas.length) */}
        <div className="p-5 rounded-2xl bg-card border border-border/30 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10"><Target className="h-4 w-4 text-primary" /></div>
            <span className="text-sm text-muted-foreground">Pedidos do Mês</span>
          </div>
          <p className="text-2xl font-bold">{qtdPedidos}</p>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="p-5 rounded-2xl bg-card border border-border/30">
        <h3 className="text-sm font-semibold mb-4">Receita Líquida Semanal</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
            <Line type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function KpiProgressCard({ title, value, meta, pct, icon: Icon, crescimento, progressColor }: {
  title: string; value: number; meta: number; pct: number; icon: React.ElementType;
  crescimento?: number; progressColor: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-card border border-border/30 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
        {crescimento !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${crescimento >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {crescimento >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(crescimento).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold">{formatCurrency(value)}</p>
      <p className="text-xs text-muted-foreground mt-1">Meta: {formatCurrency(meta)}</p>
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full transition-all ${progressColor}`}
            style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <Badge variant="outline" className="text-xs">{pct.toFixed(0)}%</Badge>
      </div>
    </div>
  );
}

// ─── META ADS TAB ───────────────────────────────────────────────
function MetaAdsTab() {
  const { connection } = useMetaConnection();
  const { insights, loading, fetchInsights } = useMetaInsights();

  useEffect(() => {
    if (connection?.selected_ad_account_id) {
      fetchInsights({
        ad_account_id: connection.selected_ad_account_id,
        level: 'campaign',
        date_preset: 'this_month',
      });
    }
  }, [connection?.selected_ad_account_id, fetchInsights]);

  if (!connection?.selected_ad_account_id) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>Conecte sua conta Meta em <a href="/ads-neua" className="text-primary underline">Ads Neua</a></p>
      </div>
    );
  }

  const totalSpend = insights.reduce((a, i) => a + Number(i.spend || 0), 0);
  const totalRevenue = insights.reduce((a, i) => a + getPurchaseValue(i.action_values), 0);
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const totalPurchases = insights.reduce((a, i) => a + getPurchaseValue(i.actions), 0);
  const cac = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
  const avgCtr = insights.length > 0 ? insights.reduce((a, i) => a + Number(i.ctr || 0), 0) / insights.length : 0;
  const avgCpc = insights.length > 0 ? insights.reduce((a, i) => a + Number(i.cpc || 0), 0) / insights.length : 0;
  const avgCpm = insights.length > 0 ? insights.reduce((a, i) => a + Number(i.cpm || 0), 0) / insights.length : 0;

  const roasBadge = roas >= 3 ? 'bg-green-500/20 text-green-400' : roas >= 1.5 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400';

  const top5 = [...insights].sort((a, b) => {
    const ra = Number(a.spend || 0) > 0 ? getPurchaseValue(a.action_values) / Number(a.spend || 1) : 0;
    const rb = Number(b.spend || 0) > 0 ? getPurchaseValue(b.action_values) / Number(b.spend || 1) : 0;
    return rb - ra;
  }).slice(0, 5).map(i => ({
    name: (i.campaign_name || '').substring(0, 20),
    roas: Number(i.spend || 0) > 0 ? getPurchaseValue(i.action_values) / Number(i.spend || 1) : 0,
  }));

  return (
    <div className="space-y-6">
      {loading && <div className="text-center py-8 text-muted-foreground">Carregando dados da Meta...</div>}
      {!loading && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <MetricCard label="Investimento" value={formatCurrency(totalSpend)} />
            <MetricCard label="Receita" value={formatCurrency(totalRevenue)} />
            <div className="p-4 rounded-2xl bg-card border border-border/30">
              <p className="text-xs text-muted-foreground mb-1">ROAS</p>
              <p className="text-xl font-bold">{roas.toFixed(2)}</p>
              <Badge className={`mt-1 ${roasBadge}`}>{roas >= 3 ? 'Ótimo' : roas >= 1.5 ? 'Regular' : 'Baixo'}</Badge>
            </div>
            <MetricCard label="Compras" value={totalPurchases.toString()} />
            <MetricCard label="CAC" value={formatCurrency(cac)} />
            <MetricCard label="CTR Médio" value={`${avgCtr.toFixed(2)}%`} />
            <MetricCard label="CPC" value={formatCurrency(avgCpc)} />
            <MetricCard label="CPM" value={formatCurrency(avgCpm)} />
          </div>
          {top5.length > 0 && (
            <div className="p-5 rounded-2xl bg-card border border-border/30">
              <h3 className="text-sm font-semibold mb-4">ROAS por Campanha (Top 5)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={top5}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="roas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center">Dados sincronizados com Meta Ads em tempo real via Ads Neua</p>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-2xl bg-card border border-border/30">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

// ─── MANYCHAT TAB ───────────────────────────────────────────────
function ManychatTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const weekOptions = getWeekOptions(8);
  const [selectedWeek, setSelectedWeek] = useState(weekOptions[0].value);
  const [form, setForm] = useState({
    investimento: 0, disparos: 0, ctr_fluxo: 0, pct_conclusao: 0,
    leads_gerados: 0, vendas_atribuidas: 0, receita_atribuida: 0,
    ponto_abandono: '', notas: '',
  });

  const { data: history = [] } = useQuery({
    queryKey: ['kpi-manychat', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('kpi_manychat' as any).select('*')
        .order('semana_inicio', { ascending: false }).limit(8);
      return (data || []) as any[];
    },
    enabled: !!user?.id,
  });

  const { data: currentData } = useQuery({
    queryKey: ['kpi-manychat-week', user?.id, selectedWeek],
    queryFn: async () => {
      const { data } = await supabase.from('kpi_manychat' as any).select('*')
        .eq('semana_inicio', selectedWeek).maybeSingle();
      return data as any;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (currentData) {
      setForm({
        investimento: Number(currentData.investimento) || 0,
        disparos: currentData.disparos || 0,
        ctr_fluxo: Number(currentData.ctr_fluxo) || 0,
        pct_conclusao: Number(currentData.pct_conclusao) || 0,
        leads_gerados: currentData.leads_gerados || 0,
        vendas_atribuidas: currentData.vendas_atribuidas || 0,
        receita_atribuida: Number(currentData.receita_atribuida) || 0,
        ponto_abandono: currentData.ponto_abandono || '',
        notas: currentData.notas || '',
      });
    } else {
      setForm({ investimento: 0, disparos: 0, ctr_fluxo: 0, pct_conclusao: 0, leads_gerados: 0, vendas_atribuidas: 0, receita_atribuida: 0, ponto_abandono: '', notas: '' });
    }
  }, [currentData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('kpi_manychat' as any).upsert({
        user_id: user!.id, semana_inicio: selectedWeek, ...form, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,semana_inicio' } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Dados ManyChat salvos!');
      queryClient.invalidateQueries({ queryKey: ['kpi-manychat'] });
    },
    onError: () => toast.error('Erro ao salvar dados'),
  });

  const chartData = history.slice(0, 4).reverse().map((h: any) => ({
    semana: `Sem ${format(new Date(h.semana_inicio + 'T12:00:00'), 'dd/MM')}`,
    leads: h.leads_gerados || 0,
    vendas: h.vendas_atribuidas || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
          <SelectContent>{weekOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <FormField label="Investimento (R$)" value={form.investimento} onChange={v => setForm(f => ({ ...f, investimento: Number(v) }))} type="number" />
        <FormField label="Disparos" value={form.disparos} onChange={v => setForm(f => ({ ...f, disparos: Number(v) }))} type="number" />
        <FormField label="CTR Fluxo (%)" value={form.ctr_fluxo} onChange={v => setForm(f => ({ ...f, ctr_fluxo: Number(v) }))} type="number" step="0.01" />
        <FormField label="Conclusão Fluxo (%)" value={form.pct_conclusao} onChange={v => setForm(f => ({ ...f, pct_conclusao: Number(v) }))} type="number" step="0.01" />
        <FormField label="Leads Gerados" value={form.leads_gerados} onChange={v => setForm(f => ({ ...f, leads_gerados: Number(v) }))} type="number" />
        <FormField label="Vendas Atribuídas" value={form.vendas_atribuidas} onChange={v => setForm(f => ({ ...f, vendas_atribuidas: Number(v) }))} type="number" />
        <FormField label="Receita Atribuída (R$)" value={form.receita_atribuida} onChange={v => setForm(f => ({ ...f, receita_atribuida: Number(v) }))} type="number" />
        <div className="col-span-2 md:col-span-1">
          <label className="text-sm text-muted-foreground mb-1 block">Ponto de Abandono</label>
          <Input value={form.ponto_abandono} onChange={e => setForm(f => ({ ...f, ponto_abandono: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Notas</label>
        <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} />
      </div>
      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? 'Salvando...' : 'Salvar Semana'}
      </Button>

      {history.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border/30">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/30 bg-card">
              {['Semana', 'Invest.', 'Disparos', 'CTR', 'Leads', 'Vendas', 'Receita'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-muted-foreground font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>{history.slice(0, 4).map((h: any) => (
              <tr key={h.id} className="border-b border-border/20">
                <td className="px-3 py-2">{format(new Date(h.semana_inicio + 'T12:00:00'), 'dd/MM/yy')}</td>
                <td className="px-3 py-2">{formatCurrency(Number(h.investimento))}</td>
                <td className="px-3 py-2">{h.disparos}</td>
                <td className="px-3 py-2">{Number(h.ctr_fluxo).toFixed(1)}%</td>
                <td className="px-3 py-2">{h.leads_gerados}</td>
                <td className="px-3 py-2">{h.vendas_atribuidas}</td>
                <td className="px-3 py-2">{formatCurrency(Number(h.receita_atribuida))}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="p-5 rounded-2xl bg-card border border-border/30">
          <h3 className="text-sm font-semibold mb-4">Leads vs Vendas por Semana</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="semana" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2} name="Leads" />
              <Line type="monotone" dataKey="vendas" stroke="#22c55e" strokeWidth={2} name="Vendas" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── GRUPO VIP TAB ──────────────────────────────────────────────
function GrupoVipTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const weekOptions = getWeekOptions(8);
  const [selectedWeek, setSelectedWeek] = useState(weekOptions[0].value);
  const [form, setForm] = useState({
    investimento: 0, total_membros: 0, novos_membros: 0, mensagens_enviadas: 0,
    cliques_links: 0, vendas_atribuidas: 0, receita_atribuida: 0, notas: '',
  });

  const { data: history = [] } = useQuery({
    queryKey: ['kpi-grupo-vip', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('kpi_grupo_vip' as any).select('*')
        .order('semana_inicio', { ascending: false }).limit(8);
      return (data || []) as any[];
    },
    enabled: !!user?.id,
  });

  const { data: currentData } = useQuery({
    queryKey: ['kpi-grupo-vip-week', user?.id, selectedWeek],
    queryFn: async () => {
      const { data } = await supabase.from('kpi_grupo_vip' as any).select('*')
        .eq('semana_inicio', selectedWeek).maybeSingle();
      return data as any;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (currentData) {
      setForm({
        investimento: Number(currentData.investimento) || 0,
        total_membros: currentData.total_membros || 0,
        novos_membros: currentData.novos_membros || 0,
        mensagens_enviadas: currentData.mensagens_enviadas || 0,
        cliques_links: currentData.cliques_links || 0,
        vendas_atribuidas: currentData.vendas_atribuidas || 0,
        receita_atribuida: Number(currentData.receita_atribuida) || 0,
        notas: currentData.notas || '',
      });
    } else {
      setForm({ investimento: 0, total_membros: 0, novos_membros: 0, mensagens_enviadas: 0, cliques_links: 0, vendas_atribuidas: 0, receita_atribuida: 0, notas: '' });
    }
  }, [currentData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('kpi_grupo_vip' as any).upsert({
        user_id: user!.id, semana_inicio: selectedWeek, ...form, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,semana_inicio' } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Dados Grupo VIP salvos!');
      queryClient.invalidateQueries({ queryKey: ['kpi-grupo-vip'] });
    },
    onError: () => toast.error('Erro ao salvar dados'),
  });

  const lastWeek = history[0];
  const prevWeek = history[1];
  const growthPct = lastWeek && prevWeek && prevWeek.total_membros > 0
    ? ((lastWeek.total_membros - prevWeek.total_membros) / prevWeek.total_membros) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/30">
          <p className="text-xs text-muted-foreground">Total Membros</p>
          <p className="text-xl font-bold">{lastWeek?.total_membros || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border/30">
          <p className="text-xs text-muted-foreground">Crescimento Semanal</p>
          <p className={`text-xl font-bold ${growthPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>{growthPct.toFixed(1)}%</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border/30">
          <p className="text-xs text-muted-foreground">Vendas Acum. Mês</p>
          <p className="text-xl font-bold">{history.slice(0, 4).reduce((a, h: any) => a + (h.vendas_atribuidas || 0), 0)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
          <SelectContent>{weekOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <FormField label="Investimento (R$)" value={form.investimento} onChange={v => setForm(f => ({ ...f, investimento: Number(v) }))} type="number" />
        <FormField label="Total Membros" value={form.total_membros} onChange={v => setForm(f => ({ ...f, total_membros: Number(v) }))} type="number" />
        <FormField label="Novos Membros" value={form.novos_membros} onChange={v => setForm(f => ({ ...f, novos_membros: Number(v) }))} type="number" />
        <FormField label="Mensagens Enviadas" value={form.mensagens_enviadas} onChange={v => setForm(f => ({ ...f, mensagens_enviadas: Number(v) }))} type="number" />
        <FormField label="Cliques em Links" value={form.cliques_links} onChange={v => setForm(f => ({ ...f, cliques_links: Number(v) }))} type="number" />
        <FormField label="Vendas Atribuídas" value={form.vendas_atribuidas} onChange={v => setForm(f => ({ ...f, vendas_atribuidas: Number(v) }))} type="number" />
        <FormField label="Receita Atribuída (R$)" value={form.receita_atribuida} onChange={v => setForm(f => ({ ...f, receita_atribuida: Number(v) }))} type="number" />
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Notas</label>
        <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} />
      </div>
      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? 'Salvando...' : 'Salvar Semana'}
      </Button>

      {history.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border/30">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/30 bg-card">
              {['Semana', 'Membros', 'Novos', 'Msgs', 'Cliques', 'Vendas', 'Receita'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-muted-foreground font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>{history.slice(0, 4).map((h: any) => (
              <tr key={h.id} className="border-b border-border/20">
                <td className="px-3 py-2">{format(new Date(h.semana_inicio + 'T12:00:00'), 'dd/MM/yy')}</td>
                <td className="px-3 py-2">{h.total_membros}</td>
                <td className="px-3 py-2">{h.novos_membros}</td>
                <td className="px-3 py-2">{h.mensagens_enviadas}</td>
                <td className="px-3 py-2">{h.cliques_links}</td>
                <td className="px-3 py-2">{h.vendas_atribuidas}</td>
                <td className="px-3 py-2">{formatCurrency(Number(h.receita_atribuida))}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── SHARED FORM FIELD ──────────────────────────────────────────
function FormField({ label, value, onChange, type = 'text', step }: {
  label: string; value: string | number; onChange: (v: string) => void; type?: string; step?: string;
}) {
  return (
    <div>
      <label className="text-sm text-muted-foreground mb-1 block">{label}</label>
      <Input type={type} step={step} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────
export default function KpisPage() {
  const now = new Date();
  const [selectedMes, setSelectedMes] = useState(now.getMonth() + 1);
  const [selectedAno, setSelectedAno] = useState(now.getFullYear());
  const mesFormatado = format(new Date(selectedAno, selectedMes - 1, 1), "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-display">KPIs Q2</h1>
        <p className="text-muted-foreground">Indicadores de performance por canal — {mesFormatado}</p>
      </div>
      <Tabs defaultValue="financeiro" className="space-y-6">
        <TabsList className="bg-card border border-border/30 p-1 rounded-xl gap-1 h-auto grid grid-cols-4">
          <TabsTrigger value="financeiro" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">Financeiro</TabsTrigger>
          <TabsTrigger value="meta_ads" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">Meta Ads</TabsTrigger>
          <TabsTrigger value="manychat" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">ManyChat</TabsTrigger>
          <TabsTrigger value="grupo_vip" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">Grupo VIP</TabsTrigger>
        </TabsList>
        <TabsContent value="financeiro">
          <FinanceiroTab selectedMes={selectedMes} selectedAno={selectedAno} setSelectedMes={setSelectedMes} setSelectedAno={setSelectedAno} />
        </TabsContent>
        <TabsContent value="meta_ads"><MetaAdsTab /></TabsContent>
        <TabsContent value="manychat"><ManychatTab /></TabsContent>
        <TabsContent value="grupo_vip"><GrupoVipTab /></TabsContent>
      </Tabs>
    </motion.div>
  );
}
