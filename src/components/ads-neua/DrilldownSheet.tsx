import { MetaInsight, getActionValue, getPurchaseValue } from "@/hooks/useMetaInsights";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface DrilldownSheetProps {
  insight: MetaInsight | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function fmt(v: number, type: "currency" | "percent" | "number" = "number") {
  if (type === "currency") return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (type === "percent") return `${v.toFixed(2)}%`;
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function DrilldownSheet({ insight, open, onOpenChange }: DrilldownSheetProps) {
  if (!insight) return null;

  const name = insight.ad_name || insight.adset_name || insight.campaign_name || "Detalhe";
  const spend = Number(insight.spend || 0);
  const purchases = getPurchaseValue(insight.actions);
  const revenue = getPurchaseValue(insight.action_values);
  const roas = spend > 0 ? revenue / spend : 0;
  const costPerPurchase = purchases > 0 ? spend / purchases : 0;

  const metrics = [
    { label: "Gasto", value: fmt(spend, "currency") },
    { label: "Impressões", value: fmt(Number(insight.impressions || 0)) },
    { label: "Alcance", value: fmt(Number(insight.reach || 0)) },
    { label: "Frequência", value: fmt(Number(insight.frequency || 0)) },
    { label: "CPM", value: fmt(Number(insight.cpm || 0), "currency") },
    { label: "Cliques", value: fmt(Number(insight.clicks || 0)) },
    { label: "CPC", value: fmt(Number(insight.cpc || 0), "currency") },
    { label: "CTR", value: fmt(Number(insight.ctr || 0), "percent") },
    { label: "CTR Único", value: fmt(Number(insight.unique_ctr || 0), "percent") },
    { label: "Compras", value: fmt(purchases) },
    { label: "Custo/Compra", value: fmt(costPerPurchase, "currency") },
    { label: "Receita", value: fmt(revenue, "currency") },
    { label: "ROAS", value: fmt(roas) },
    { label: "Qualidade", value: insight.quality_ranking || "-" },
    { label: "Engajamento", value: insight.engagement_rate_ranking || "-" },
    { label: "Conversão", value: insight.conversion_rate_ranking || "-" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border/30 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-lg">{name}</SheetTitle>
          {insight.date_start && insight.date_stop && (
            <Badge variant="outline" className="w-fit">
              {insight.date_start} → {insight.date_stop}
            </Badge>
          )}
        </SheetHeader>
        <div className="grid grid-cols-2 gap-3 mt-6">
          {metrics.map((m) => (
            <div key={m.label} className="bg-background rounded-lg p-3 border border-border/20">
              <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
              <p className="font-semibold text-sm">{m.value}</p>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
