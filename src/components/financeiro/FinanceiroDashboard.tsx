import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  CartesianGrid,
  Legend
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const CATEGORY_COLORS: Record<string, string> = {
  "Marketing": "#3b82f6",
  "Tráfego pago": "#8b5cf6",
  "Influenciadores": "#ec4899",
  "Logística": "#f97316",
  "Produto / Fornecedor": "#22c55e",
  "Dropshipping": "#06b6d4",
  "Estoque próprio": "#10b981",
  "Plataforma / SaaS": "#6366f1",
  "Operacional": "#eab308",
  "Impostos": "#ef4444",
  "Financeiro": "#64748b",
  "Outros": "#94a3b8",
};

export function FinanceiroDashboard() {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState("30");

  const startDate = subDays(new Date(), parseInt(periodo));

  const { data: receitas = [] } = useQuery({
    queryKey: ["receitas", user?.id, periodo],
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
    queryKey: ["despesas", user?.id, periodo],
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

  // Calculate KPIs
  const faturamentoBruto = receitas.reduce((acc, r) => acc + Number(r.valor_bruto), 0);
  const taxasTotal = receitas.reduce((acc, r) => acc + Number(r.taxas), 0);
  const receitaLiquida = faturamentoBruto - taxasTotal;
  const custosTotal = despesas.reduce((acc, d) => acc + Number(d.valor), 0);
  const lucro = receitaLiquida - custosTotal;
  const margem = receitaLiquida > 0 ? (lucro / receitaLiquida) * 100 : 0;

  // Previous period for comparison
  const prevStartDate = subDays(startDate, parseInt(periodo));
  const { data: receitasPrev = [] } = useQuery({
    queryKey: ["receitas-prev", user?.id, periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receitas")
        .select("*")
        .gte("data", format(prevStartDate, "yyyy-MM-dd"))
        .lt("data", format(startDate, "yyyy-MM-dd"));
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const faturamentoPrev = receitasPrev.reduce((acc, r) => acc + Number(r.valor_bruto), 0);
  const variacaoFaturamento = faturamentoPrev > 0 
    ? ((faturamentoBruto - faturamentoPrev) / faturamentoPrev) * 100 
    : 0;

  // Daily evolution data
  const evolutionData = receitas.reduce((acc, r) => {
    const day = format(new Date(r.data), "dd/MM");
    const existing = acc.find(item => item.day === day);
    if (existing) {
      existing.receita += Number(r.valor_bruto);
    } else {
      acc.push({ day, receita: Number(r.valor_bruto), despesa: 0 });
    }
    return acc;
  }, [] as { day: string; receita: number; despesa: number }[]);

  despesas.forEach(d => {
    const day = format(new Date(d.data), "dd/MM");
    const existing = evolutionData.find(item => item.day === day);
    if (existing) {
      existing.despesa += Number(d.valor);
    } else {
      evolutionData.push({ day, receita: 0, despesa: Number(d.valor) });
    }
  });

  evolutionData.sort((a, b) => a.day.localeCompare(b.day));

  // Expenses by category
  const despesasPorCategoria = Object.entries(
    despesas.reduce((acc, d) => {
      acc[d.categoria] = (acc[d.categoria] || 0) + Number(d.valor);
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name,
    value,
    color: CATEGORY_COLORS[name] || "#94a3b8",
  }));

  const kpis = [
    {
      title: "Faturamento Bruto",
      value: faturamentoBruto,
      icon: DollarSign,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      change: variacaoFaturamento,
    },
    {
      title: "Receita Líquida",
      value: receitaLiquida,
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Custos Totais",
      value: custosTotal,
      icon: TrendingDown,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
    },
    {
      title: lucro >= 0 ? "Lucro" : "Prejuízo",
      value: Math.abs(lucro),
      icon: lucro >= 0 ? Wallet : AlertTriangle,
      color: lucro >= 0 ? "text-emerald-400" : "text-red-400",
      bgColor: lucro >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
      isNegative: lucro < 0,
    },
    {
      title: "Margem",
      value: margem,
      isPercentage: true,
      icon: Target,
      color: margem >= 20 ? "text-emerald-400" : margem >= 10 ? "text-yellow-400" : "text-red-400",
      bgColor: margem >= 20 ? "bg-emerald-500/10" : margem >= 10 ? "bg-yellow-500/10" : "bg-red-500/10",
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-end">
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 rounded-xl bg-card border border-border ${kpi.bgColor}`}
          >
            <div className="flex items-center justify-between mb-2">
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              {kpi.change !== undefined && (
                <div className={`flex items-center text-xs ${kpi.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {kpi.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(kpi.change).toFixed(1)}%
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>
              {kpi.isNegative && "-"}
              {kpi.isPercentage ? `${kpi.value.toFixed(1)}%` : formatCurrency(kpi.value)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Evolution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-xl bg-card border border-border"
        >
          <h3 className="text-lg font-semibold mb-4">Receitas vs Despesas</h3>
          {evolutionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Area type="monotone" dataKey="receita" name="Receita" stroke="#22c55e" fillOpacity={1} fill="url(#colorReceita)" />
                <Area type="monotone" dataKey="despesa" name="Despesa" stroke="#ef4444" fillOpacity={1} fill="url(#colorDespesa)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </motion.div>

        {/* Expenses by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-xl bg-card border border-border"
        >
          <h3 className="text-lg font-semibold mb-4">Despesas por Categoria</h3>
          {despesasPorCategoria.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={despesasPorCategoria}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {despesasPorCategoria.map((entry, index) => (
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
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </motion.div>
      </div>

      {/* Alerts */}
      {margem < 10 && faturamentoBruto > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div>
            <p className="font-medium text-red-400">Alerta de Margem Baixa</p>
            <p className="text-sm text-muted-foreground">
              Sua margem está em {margem.toFixed(1)}%. Considere revisar seus custos ou ajustar preços.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
