import { MetaInsight, getActionValue } from "@/hooks/useMetaInsights";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, ShoppingCart, MousePointerClick, Target, BarChart3 } from "lucide-react";

interface MetricCardsProps {
  insights: MetaInsight[];
  loading?: boolean;
}

function fmt(value: number, type: "currency" | "percent" | "number" = "number"): string {
  if (type === "currency") return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (type === "percent") return `${value.toFixed(2)}%`;
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function MetricCards({ insights, loading }: MetricCardsProps) {
  const pickPurchase = (arr?: Array<{ action_type: string; value: string }>) => {
    const pixel = getActionValue(arr, "offsite_conversion.fb_pixel_purchase");
    if (pixel > 0) return pixel;
    const purchase = getActionValue(arr, "purchase");
    if (purchase > 0) return purchase;
    return getActionValue(arr, "omni_purchase");
  };

  const totalSpend = insights.reduce((s, i) => s + Number(i.spend || 0), 0);
  const totalRevenue = insights.reduce((s, i) => s + pickPurchase(i.action_values), 0);
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const totalPurchases = insights.reduce((s, i) => s + pickPurchase(i.actions), 0);
  const cac = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
  const avgCtr = insights.length > 0 ? insights.reduce((s, i) => s + Number(i.ctr || 0), 0) / insights.length : 0;

  const cards = [
    { label: "Gasto Total", value: fmt(totalSpend, "currency"), icon: DollarSign, color: "text-red-400" },
    { label: "Receita", value: fmt(totalRevenue, "currency"), icon: TrendingUp, color: "text-emerald-400" },
    { label: "ROAS", value: fmt(roas), icon: Target, color: "text-blue-400" },
    { label: "Compras", value: fmt(totalPurchases), icon: ShoppingCart, color: "text-purple-400" },
    { label: "CAC", value: fmt(cac, "currency"), icon: MousePointerClick, color: "text-amber-400" },
    { label: "CTR Médio", value: fmt(avgCtr, "percent"), icon: BarChart3, color: "text-cyan-400" },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-card border-border/30">
            <CardContent className="p-4">
              <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
              <div className="h-6 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="bg-card border-border/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className="text-lg font-bold font-display">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
