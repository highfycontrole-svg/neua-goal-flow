import { useState, useEffect, useCallback } from "react";
import { useMetaConnection } from "@/hooks/useMetaConnection";
import { useMetaInsights, type InsightLevel, type MetaInsight } from "@/hooks/useMetaInsights";
import { MetricCards } from "@/components/ads-neua/MetricCards";
import { InsightsTable } from "@/components/ads-neua/InsightsTable";
import { DrilldownSheet } from "@/components/ads-neua/DrilldownSheet";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart3, Link2, Unlink, RefreshCw, AlertTriangle, ChevronRight, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

const DATE_PRESETS = [
  { label: "Hoje", value: "today" },
  { label: "7 dias", value: "last_7d" },
  { label: "14 dias", value: "last_14d" },
  { label: "30 dias", value: "last_30d" },
  { label: "Este mês", value: "this_month" },
  { label: "Mês passado", value: "last_month" },
] as const;

export default function AdsNeuaPage() {
  const { connection, adAccounts, loading: connLoading, error: connError, setError, selectAdAccount, disconnect, startOAuth } = useMetaConnection();
  const { insights, loading: insightsLoading, error: insightsError, lastSynced, fetchInsights } = useMetaInsights();

  const [activeTab, setActiveTab] = useState<InsightLevel>("campaign");
  const [datePreset, setDatePreset] = useState<string>("last_7d");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [syncing, setSyncing] = useState(false);

  // Drilldown
  const [selectedCampaign, setSelectedCampaign] = useState<{ id: string; name: string } | null>(null);
  const [selectedAdset, setSelectedAdset] = useState<{ id: string; name: string } | null>(null);
  const [drilldownInsight, setDrilldownInsight] = useState<MetaInsight | null>(null);

  const accountId = connection?.selected_ad_account_id;

  const getDateParams = useCallback(() => {
    if (datePreset === "custom" && customRange?.from && customRange?.to) {
      return { date_start: format(customRange.from, "yyyy-MM-dd"), date_stop: format(customRange.to, "yyyy-MM-dd") };
    }
    const today = new Date();
    switch (datePreset) {
      case "today": return { date_start: format(today, "yyyy-MM-dd"), date_stop: format(today, "yyyy-MM-dd") };
      case "last_7d": return { date_start: format(subDays(today, 7), "yyyy-MM-dd"), date_stop: format(today, "yyyy-MM-dd") };
      case "last_14d": return { date_start: format(subDays(today, 14), "yyyy-MM-dd"), date_stop: format(today, "yyyy-MM-dd") };
      case "last_30d": return { date_start: format(subDays(today, 30), "yyyy-MM-dd"), date_stop: format(today, "yyyy-MM-dd") };
      case "this_month": return { date_start: format(startOfMonth(today), "yyyy-MM-dd"), date_stop: format(today, "yyyy-MM-dd") };
      case "last_month": {
        const lm = subMonths(today, 1);
        return { date_start: format(startOfMonth(lm), "yyyy-MM-dd"), date_stop: format(endOfMonth(lm), "yyyy-MM-dd") };
      }
      default: return { date_preset: "last_7d" };
    }
  }, [datePreset, customRange]);

  const loadInsights = useCallback(async () => {
    if (!accountId) return;
    setSyncing(true);
    const dateParams = getDateParams();
    await fetchInsights({
      ad_account_id: accountId,
      level: activeTab,
      ...dateParams,
      ...(selectedCampaign && activeTab !== "campaign" ? { campaign_ids: [selectedCampaign.id] } : {}),
      ...(selectedAdset && activeTab === "ad" ? { adset_ids: [selectedAdset.id] } : {}),
    });
    setSyncing(false);
  }, [accountId, activeTab, getDateParams, fetchInsights, selectedCampaign, selectedAdset]);

  useEffect(() => {
    if (accountId) loadInsights();
  }, [accountId, activeTab, datePreset, customRange, selectedCampaign, selectedAdset]);

  const handleDisconnect = async () => {
    await disconnect();
    toast.success("Conta Meta desconectada.");
  };

  const handleRowClick = (insight: MetaInsight) => {
    if (activeTab === "campaign") {
      setSelectedCampaign({ id: insight.campaign_id!, name: insight.campaign_name! });
      setSelectedAdset(null);
      setActiveTab("adset");
    } else if (activeTab === "adset") {
      setSelectedAdset({ id: insight.adset_id!, name: insight.adset_name! });
      setActiveTab("ad");
    } else {
      setDrilldownInsight(insight);
    }
  };

  const resetDrilldown = (toLevel: InsightLevel) => {
    if (toLevel === "campaign") { setSelectedCampaign(null); setSelectedAdset(null); }
    if (toLevel === "adset") { setSelectedAdset(null); }
    setActiveTab(toLevel);
  };

  // --- ESTADOS DE CARREGAMENTO ---
  if (connLoading) {
    return (
      <PageTransition>
        <div className="p-4 md:p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </PageTransition>
    );
  }

  // --- NÃO CONECTADO ---
  if (!connection) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <BarChart3 className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold mb-2">Conecte sua conta Meta</h1>
              <p className="text-muted-foreground text-sm">
                Visualize métricas de campanhas do Facebook e Instagram Ads diretamente no seu painel Neua.
              </p>
            </div>
            <Button size="lg" onClick={() => startOAuth().catch(e => toast.error(e.message))} className="gap-2">
              <Link2 className="h-4 w-4" />
              Conectar conta Meta
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // --- TOKEN EXPIRADO ---
  if (connError === "token_expired") {
    return (
      <PageTransition>
        <div className="p-4 md:p-6 space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Sua conexão com a Meta expirou. Reconecte para continuar.</span>
              <Button size="sm" variant="outline" onClick={() => { setError(null); startOAuth().catch(e => toast.error(e.message)); }}>
                Reconectar
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </PageTransition>
    );
  }

  // --- CONECTADO SEM AD ACCOUNT ---
  if (!accountId) {
    return (
      <PageTransition>
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold">Ads Neua</h1>
              <p className="text-sm text-muted-foreground">Conectado como {connection.meta_user_name}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDisconnect} title="Desconectar">
              <Unlink className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-w-md space-y-4">
            <p className="text-muted-foreground">Selecione uma conta de anúncios para começar:</p>
            <Select onValueChange={(v) => {
              const acc = adAccounts.find(a => a.id === v);
              if (acc) selectAdAccount(acc.id, acc.name);
            }}>
              <SelectTrigger className="bg-background border-border/30">
                <SelectValue placeholder="Selecionar conta de anúncios" />
              </SelectTrigger>
              <SelectContent>
                {adAccounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} ({acc.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PageTransition>
    );
  }

  // --- DASHBOARD COMPLETO ---
  return (
    <PageTransition>
      <div className="p-4 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold">Ads Neua</h1>
            <Badge variant="secondary" className="text-xs">{connection.meta_user_name}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={accountId}
              onValueChange={(v) => {
                const acc = adAccounts.find(a => a.id === v);
                if (acc) selectAdAccount(acc.id, acc.name);
              }}
            >
              <SelectTrigger className="w-auto min-w-[200px] bg-background border-border/30 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {adAccounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={handleDisconnect} title="Desconectar" className="h-9 w-9">
              <Unlink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filtros de data */}
        <div className="flex flex-wrap items-center gap-2">
          {DATE_PRESETS.map(p => (
            <Button
              key={p.value}
              variant={datePreset === p.value ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs rounded-full"
              onClick={() => setDatePreset(p.value)}
            >
              {p.label}
            </Button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={datePreset === "custom" ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs rounded-full gap-1"
                onClick={() => setDatePreset("custom")}
              >
                <CalendarIcon className="h-3 w-3" />
                {datePreset === "custom" && customRange?.from && customRange?.to
                  ? `${format(customRange.from, "dd/MM")} - ${format(customRange.to, "dd/MM")}`
                  : "Customizado"
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={customRange}
                onSelect={(range) => { setCustomRange(range); setDatePreset("custom"); }}
                locale={ptBR}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={loadInsights}
              disabled={syncing}
            >
              <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
              Sincronizar
            </Button>
            {lastSynced && (
              <span className="text-xs text-muted-foreground">
                Sync: {format(new Date(lastSynced), "HH:mm", { locale: ptBR })}
              </span>
            )}
          </div>
        </div>

        {/* Rate limit warning */}
        {insightsError === "rate_limit" && (
          <Alert className="border-amber-500/30 bg-amber-500/5">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-200 text-sm">
              Limite de requisições da Meta atingido. Exibindo dados do cache.
            </AlertDescription>
          </Alert>
        )}

        {/* Metric Cards */}
        <MetricCards insights={insights} loading={insightsLoading} />

        {/* Breadcrumb */}
        {(selectedCampaign || selectedAdset) && (
          <div className="flex items-center gap-1 text-sm">
            <button onClick={() => resetDrilldown("campaign")} className="text-primary hover:underline">
              Todas as campanhas
            </button>
            {selectedCampaign && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <button
                  onClick={() => resetDrilldown("adset")}
                  className={selectedAdset ? "text-primary hover:underline" : "text-foreground font-medium"}
                >
                  {selectedCampaign.name}
                </button>
              </>
            )}
            {selectedAdset && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">{selectedAdset.name}</span>
              </>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as InsightLevel);
          if (v === "campaign") { setSelectedCampaign(null); setSelectedAdset(null); }
          if (v === "adset") { setSelectedAdset(null); }
        }}>
          <TabsList className="bg-card border border-border/30 p-1 rounded-xl gap-1 h-auto">
            <TabsTrigger value="campaign" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 text-sm">
              Campanhas
            </TabsTrigger>
            <TabsTrigger value="adset" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 text-sm">
              Conjuntos
            </TabsTrigger>
            <TabsTrigger value="ad" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 text-sm">
              Anúncios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaign" className="mt-4">
            <InsightsTable insights={insights} level="campaign" loading={insightsLoading} onRowClick={handleRowClick} />
          </TabsContent>
          <TabsContent value="adset" className="mt-4">
            <InsightsTable insights={insights} level="adset" loading={insightsLoading} onRowClick={handleRowClick} />
          </TabsContent>
          <TabsContent value="ad" className="mt-4">
            <InsightsTable insights={insights} level="ad" loading={insightsLoading} onRowClick={handleRowClick} />
          </TabsContent>
        </Tabs>

        {/* Drilldown Sheet */}
        <DrilldownSheet
          insight={drilldownInsight}
          open={!!drilldownInsight}
          onOpenChange={(open) => { if (!open) setDrilldownInsight(null); }}
        />
      </div>
    </PageTransition>
  );
}
