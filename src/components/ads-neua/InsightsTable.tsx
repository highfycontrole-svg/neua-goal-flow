import { useState, useMemo } from "react";
import { MetaInsight, getActionValue } from "@/hooks/useMetaInsights";
import type { InsightLevel } from "@/hooks/useMetaInsights";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowUpDown, InboxIcon } from "lucide-react";

interface InsightsTableProps {
  insights: MetaInsight[];
  level: InsightLevel;
  loading?: boolean;
  onRowClick?: (insight: MetaInsight) => void;
}

type SortKey = "name" | "spend" | "impressions" | "reach" | "frequency" | "cpm" | "clicks" | "cpc" | "ctr" | "unique_ctr" | "purchases" | "cost_purchase" | "revenue" | "roas";

function getName(insight: MetaInsight, level: InsightLevel) {
  if (level === "campaign") return insight.campaign_name || "-";
  if (level === "adset") return insight.adset_name || "-";
  return insight.ad_name || "-";
}

function getPurchases(i: MetaInsight) {
  return getActionValue(i.actions, "purchase") + getActionValue(i.actions, "omni_purchase");
}

function getRevenue(i: MetaInsight) {
  return getActionValue(i.action_values, "purchase") + getActionValue(i.action_values, "omni_purchase");
}

function getCostPerPurchase(i: MetaInsight) {
  const p = getPurchases(i);
  return p > 0 ? Number(i.spend || 0) / p : 0;
}

function getRoas(i: MetaInsight) {
  const spend = Number(i.spend || 0);
  return spend > 0 ? getRevenue(i) / spend : 0;
}

function fmt(v: number, type: "currency" | "percent" | "number" = "number") {
  if (type === "currency") return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (type === "percent") return `${v.toFixed(2)}%`;
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function getSortValue(i: MetaInsight, key: SortKey, level: InsightLevel): number | string {
  switch (key) {
    case "name": return getName(i, level);
    case "spend": return Number(i.spend || 0);
    case "impressions": return Number(i.impressions || 0);
    case "reach": return Number(i.reach || 0);
    case "frequency": return Number(i.frequency || 0);
    case "cpm": return Number(i.cpm || 0);
    case "clicks": return Number(i.clicks || 0);
    case "cpc": return Number(i.cpc || 0);
    case "ctr": return Number(i.ctr || 0);
    case "unique_ctr": return Number(i.unique_ctr || 0);
    case "purchases": return getPurchases(i);
    case "cost_purchase": return getCostPerPurchase(i);
    case "revenue": return getRevenue(i);
    case "roas": return getRoas(i);
    default: return 0;
  }
}

export function InsightsTable({ insights, level, loading, onRowClick }: InsightsTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let list = insights;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(i => getName(i, level).toLowerCase().includes(s));
    }
    return [...list].sort((a, b) => {
      const va = getSortValue(a, sortKey, level);
      const vb = getSortValue(b, sortKey, level);
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [insights, search, sortKey, sortDir, level]);

  const SortHeader = ({ label, sKey }: { label: string; sKey: SortKey }) => (
    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort(sKey)}>
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
      </div>
    </TableHead>
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-background border-border/30"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <InboxIcon className="h-12 w-12 mb-3 opacity-40" />
          <p className="font-medium">Nenhum dado encontrado</p>
          <p className="text-sm">Tente alterar o período ou filtros</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/30">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 bg-card z-10 min-w-[200px]">Nome</TableHead>
                <SortHeader label="Gasto" sKey="spend" />
                <SortHeader label="Impressões" sKey="impressions" />
                <SortHeader label="Alcance" sKey="reach" />
                <SortHeader label="Freq." sKey="frequency" />
                <SortHeader label="CPM" sKey="cpm" />
                <SortHeader label="Cliques" sKey="clicks" />
                <SortHeader label="CPC" sKey="cpc" />
                <SortHeader label="CTR" sKey="ctr" />
                <SortHeader label="CTR Único" sKey="unique_ctr" />
                <SortHeader label="Compras" sKey="purchases" />
                <SortHeader label="Custo/Compra" sKey="cost_purchase" />
                <SortHeader label="Receita" sKey="revenue" />
                <SortHeader label="ROAS" sKey="roas" />
                <TableHead className="whitespace-nowrap">Qualidade</TableHead>
                <TableHead className="whitespace-nowrap">Engajamento</TableHead>
                <TableHead className="whitespace-nowrap">Conversão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((i, idx) => (
                <TableRow
                  key={idx}
                  className="cursor-pointer hover:bg-primary/5 transition-colors"
                  onClick={() => onRowClick?.(i)}
                >
                  <TableCell className="sticky left-0 bg-card z-10 font-medium max-w-[250px] truncate">
                    {getName(i, level)}
                  </TableCell>
                  <TableCell>{fmt(Number(i.spend || 0), "currency")}</TableCell>
                  <TableCell>{fmt(Number(i.impressions || 0))}</TableCell>
                  <TableCell>{fmt(Number(i.reach || 0))}</TableCell>
                  <TableCell>{fmt(Number(i.frequency || 0))}</TableCell>
                  <TableCell>{fmt(Number(i.cpm || 0), "currency")}</TableCell>
                  <TableCell>{fmt(Number(i.clicks || 0))}</TableCell>
                  <TableCell>{fmt(Number(i.cpc || 0), "currency")}</TableCell>
                  <TableCell>{fmt(Number(i.ctr || 0), "percent")}</TableCell>
                  <TableCell>{fmt(Number(i.unique_ctr || 0), "percent")}</TableCell>
                  <TableCell>{getPurchases(i)}</TableCell>
                  <TableCell>{fmt(getCostPerPurchase(i), "currency")}</TableCell>
                  <TableCell>{fmt(getRevenue(i), "currency")}</TableCell>
                  <TableCell>{fmt(getRoas(i))}</TableCell>
                  <TableCell className="text-xs">{i.quality_ranking || "-"}</TableCell>
                  <TableCell className="text-xs">{i.engagement_rate_ranking || "-"}</TableCell>
                  <TableCell className="text-xs">{i.conversion_rate_ranking || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
