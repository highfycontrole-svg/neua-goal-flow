import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { 
  PieChart as PieChartIcon, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { format, subDays } from "date-fns";
import { FinanceiroExportButton } from "./FinanceiroExportButton";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#22c55e", "#06b6d4", "#eab308", "#ef4444"];

export function LucroMargemTab() {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [periodo, setPeriodo] = useState("30");

  const startDate = subDays(new Date(), parseInt(periodo));

  const { data: receitas = [] } = useQuery({
    queryKey: ["receitas-lucro", user?.id, periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receitas")
        .select("*")
        .gte("data", format(startDate, "yyyy-MM-dd"))
        .order("data", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: despesas = [] } = useQuery({
    queryKey: ["despesas-lucro", user?.id, periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("despesas")
        .select("*")
        .gte("data", format(startDate, "yyyy-MM-dd"))
        .order("data", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: campanhas = [] } = useQuery({
    queryKey: ["campanhas-lucro", user?.id, periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_campanhas")
        .select("*")
        .gte("data_inicio", format(startDate, "yyyy-MM-dd"));
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: influenciadores = [] } = useQuery({
    queryKey: ["influenciadores-lucro", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_influenciadores")
        .select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Calculate DRE
  const receitaBruta = receitas.reduce((acc, r) => acc + Number(r.valor_bruto), 0);
  const taxas = receitas.reduce((acc, r) => acc + Number(r.taxas), 0);
  const receitaLiquida = receitaBruta - taxas;

  // Expenses by category
  const despesasPorCategoria = despesas.reduce((acc, d) => {
    acc[d.categoria] = (acc[d.categoria] || 0) + Number(d.valor);
    return acc;
  }, {} as Record<string, number>);

  const custoMarketing = (despesasPorCategoria["Marketing"] || 0) + (despesasPorCategoria["Tráfego pago"] || 0);
  const custoInfluenciadores = despesasPorCategoria["Influenciadores"] || 0;
  const custoProduto = (despesasPorCategoria["Produto / Fornecedor"] || 0) + 
                       (despesasPorCategoria["Dropshipping"] || 0) + 
                       (despesasPorCategoria["Estoque próprio"] || 0);
  const custoLogistica = despesasPorCategoria["Logística"] || 0;
  const custoOperacional = (despesasPorCategoria["Plataforma / SaaS"] || 0) + 
                           (despesasPorCategoria["Operacional"] || 0);
  const impostos = despesasPorCategoria["Impostos"] || 0;
  const outros = (despesasPorCategoria["Financeiro"] || 0) + (despesasPorCategoria["Outros"] || 0);

  const custoTotal = Object.values(despesasPorCategoria).reduce((a, b) => a + b, 0);
  const lucroReal = receitaLiquida - custoTotal;
  const margemReal = receitaLiquida > 0 ? (lucroReal / receitaLiquida) * 100 : 0;

  // DRE items for visualization
  const dreItems = [
    { label: "Receita Bruta", value: receitaBruta, type: "receita" },
    { label: "(-) Taxas e Deduções", value: taxas, type: "deducao" },
    { label: "= Receita Líquida", value: receitaLiquida, type: "subtotal" },
    { label: "(-) Marketing", value: custoMarketing, type: "custo" },
    { label: "(-) Influenciadores", value: custoInfluenciadores, type: "custo" },
    { label: "(-) Produto/Fornecedor", value: custoProduto, type: "custo" },
    { label: "(-) Logística", value: custoLogistica, type: "custo" },
    { label: "(-) Operacional", value: custoOperacional, type: "custo" },
    { label: "(-) Impostos", value: impostos, type: "custo" },
    { label: "(-) Outros", value: outros, type: "custo" },
    { label: "= LUCRO REAL", value: lucroReal, type: "resultado" },
  ];

  // Margin by channel (simplified based on origin)
  const margemPorCanal = Object.entries(
    receitas.reduce((acc, r) => {
      acc[r.origem] = (acc[r.origem] || 0) + Number(r.valor_liquido);
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value], i) => ({
    name,
    value,
    color: COLORS[i % COLORS.length],
  }));

  // Margin evolution by week
  const margemPorSemana = receitas.reduce((acc, r) => {
    const week = format(new Date(r.data), "'S'w");
    if (!acc[week]) {
      acc[week] = { receita: 0, despesa: 0 };
    }
    acc[week].receita += Number(r.valor_liquido);
    return acc;
  }, {} as Record<string, { receita: number; despesa: number }>);

  // Add expenses to weeks
  despesas.forEach(d => {
    const week = format(new Date(d.data), "'S'w");
    if (!margemPorSemana[week]) {
      margemPorSemana[week] = { receita: 0, despesa: 0 };
    }
    margemPorSemana[week].despesa += Number(d.valor);
  });

  const margemEvolutionData = Object.entries(margemPorSemana).map(([week, data]) => ({
    week,
    margem: data.receita > 0 ? ((data.receita - data.despesa) / data.receita) * 100 : 0,
  }));

  const generateTextReport = () => {
    const dateStr = new Date().toLocaleDateString('pt-BR');
    return `📈 RELATÓRIO LUCRO & MARGEM
📅 Data: ${dateStr}
📆 Período: Últimos ${periodo} dias

💰 DRE SIMPLIFICADA
━━━━━━━━━━━━━━━━━━━━
• Receita Bruta: ${formatCurrency(receitaBruta)}
• Taxas/Deduções: -${formatCurrency(taxas)}
• Receita Líquida: ${formatCurrency(receitaLiquida)}
• Marketing: -${formatCurrency(custoMarketing)}
• Influenciadores: -${formatCurrency(custoInfluenciadores)}
• Produto/Fornecedor: -${formatCurrency(custoProduto)}
• Logística: -${formatCurrency(custoLogistica)}
• Operacional: -${formatCurrency(custoOperacional)}
• Impostos: -${formatCurrency(impostos)}

📊 RESULTADO
━━━━━━━━━━━━━━━━━━━━
• ${lucroReal >= 0 ? 'LUCRO REAL' : 'PREJUÍZO'}: ${formatCurrency(Math.abs(lucroReal))}
• MARGEM REAL: ${margemReal.toFixed(1)}%

${margemReal < 15 ? '⚠️ ALERTA: Margem abaixo do ideal (15-20%)' : '✅ Margem saudável'}

💡 Relatório gerado automaticamente pela Neua`;
  };

  const xlsData = {
    headers: ['Item', 'Valor'],
    rows: dreItems.map((item) => [
      item.label,
      item.value,
    ]) as (string | number)[][],
    sheetName: 'Lucro e Margem'
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Lucro Real & Margem Verdadeira</h2>
        <div className="flex gap-2">
          <FinanceiroExportButton
            containerRef={containerRef}
            sectionName="lucro-margem"
            textReport={generateTextReport()}
            xlsData={xlsData}
          />
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Result Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-xl border ${lucroReal >= 0 ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            {lucroReal >= 0 ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-400" />
            )}
            <span className="text-muted-foreground">{lucroReal >= 0 ? "Lucro Real" : "Prejuízo"}</span>
          </div>
          <p className={`text-3xl font-bold ${lucroReal >= 0 ? "text-green-400" : "text-red-400"}`}>
            {formatCurrency(Math.abs(lucroReal))}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-6 rounded-xl border ${margemReal >= 20 ? "bg-emerald-500/10 border-emerald-500/30" : margemReal >= 10 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className={margemReal >= 20 ? "text-emerald-400" : margemReal >= 10 ? "text-yellow-400" : "text-red-400"} />
            <span className="text-muted-foreground">Margem Real</span>
          </div>
          <p className={`text-3xl font-bold ${margemReal >= 20 ? "text-emerald-400" : margemReal >= 10 ? "text-yellow-400" : "text-red-400"}`}>
            {margemReal.toFixed(1)}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-blue-400" />
            <span className="text-muted-foreground">Receita Líquida</span>
          </div>
          <p className="text-3xl font-bold text-blue-400">{formatCurrency(receitaLiquida)}</p>
        </motion.div>
      </div>

      {/* DRE Simplified */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-xl bg-card border border-border"
      >
        <h3 className="text-lg font-semibold mb-4">DRE Simplificada</h3>
        <div className="space-y-2">
          {dreItems.map((item, i) => (
            <div
              key={i}
              className={`flex justify-between items-center p-3 rounded-lg ${
                item.type === "receita" ? "bg-green-500/10" :
                item.type === "subtotal" ? "bg-blue-500/10 font-medium" :
                item.type === "deducao" || item.type === "custo" ? "bg-secondary/50" :
                item.value >= 0 ? "bg-green-500/20 font-bold" : "bg-red-500/20 font-bold"
              }`}
            >
              <span className="text-sm">{item.label}</span>
              <span className={`font-mono ${
                item.type === "receita" || item.type === "subtotal" ? "text-green-400" :
                item.type === "resultado" ? (item.value >= 0 ? "text-green-400" : "text-red-400") :
                "text-red-400"
              }`}>
                {item.type === "deducao" || item.type === "custo" ? "-" : ""}
                {formatCurrency(Math.abs(item.value))}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Channel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-xl bg-card border border-border"
        >
          <h3 className="text-lg font-semibold mb-4">Receita por Canal</h3>
          {margemPorCanal.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={margemPorCanal}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {margemPorCanal.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </motion.div>

        {/* Margin Evolution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-xl bg-card border border-border"
        >
          <h3 className="text-lg font-semibold mb-4">Evolução da Margem</h3>
          {margemEvolutionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={margemEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Line
                  type="monotone"
                  dataKey="margem"
                  name="Margem"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </motion.div>
      </div>

      {/* Insights */}
      {margemReal < 15 && receitaLiquida > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-400">Margem Abaixo do Ideal</p>
            <p className="text-sm text-muted-foreground">
              Sua margem está em {margemReal.toFixed(1)}%. Para um e-commerce saudável, busque manter acima de 15-20%. 
              Principais custos: {Object.entries(despesasPorCategoria).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k).join(", ")}.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
