import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useRef } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CalendarIcon
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";
import { FinanceiroExportButton } from "./FinanceiroExportButton";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [periodo, setPeriodo] = useState("30");
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });

  const isCustomPeriod = periodo === "custom";
  
  const getStartDate = () => {
    if (isCustomPeriod && customDateRange.from) {
      return customDateRange.from;
    }
    return subDays(new Date(), parseInt(periodo));
  };

  const getEndDate = () => {
    if (isCustomPeriod && customDateRange.to) {
      return customDateRange.to;
    }
    return new Date();
  };

  const startDate = getStartDate();
  const endDate = getEndDate();

  const { data: receitas = [] } = useQuery({
    queryKey: ["receitas", user?.id, periodo, customDateRange.from?.toISOString(), customDateRange.to?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("receitas")
        .select("*")
        .gte("data", format(startDate, "yyyy-MM-dd"))
        .order("data", { ascending: true });
      
      if (isCustomPeriod && customDateRange.to) {
        query = query.lte("data", format(endDate, "yyyy-MM-dd"));
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && (!isCustomPeriod || (!!customDateRange.from && !!customDateRange.to)),
  });

  const { data: despesas = [] } = useQuery({
    queryKey: ["despesas", user?.id, periodo, customDateRange.from?.toISOString(), customDateRange.to?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("despesas")
        .select("*")
        .gte("data", format(startDate, "yyyy-MM-dd"))
        .order("data", { ascending: true });
      
      if (isCustomPeriod && customDateRange.to) {
        query = query.lte("data", format(endDate, "yyyy-MM-dd"));
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && (!isCustomPeriod || (!!customDateRange.from && !!customDateRange.to)),
  });

  // Calculate KPIs
  const faturamentoBruto = receitas.reduce((acc, r) => acc + Number(r.valor_bruto), 0);
  const taxasTotal = receitas.reduce((acc, r) => acc + Number(r.taxas), 0);
  const receitaLiquida = faturamentoBruto - taxasTotal;
  const custosTotal = despesas.reduce((acc, d) => acc + Number(d.valor), 0);
  const lucro = receitaLiquida - custosTotal;
  const margem = receitaLiquida > 0 ? (lucro / receitaLiquida) * 100 : 0;

  // Previous period for comparison
  const daysDiff = isCustomPeriod && customDateRange.from && customDateRange.to
    ? Math.ceil((customDateRange.to.getTime() - customDateRange.from.getTime()) / (1000 * 60 * 60 * 24))
    : parseInt(periodo);
  
  const prevStartDate = subDays(startDate, daysDiff);
  const { data: receitasPrev = [] } = useQuery({
    queryKey: ["receitas-prev", user?.id, periodo, customDateRange.from?.toISOString(), customDateRange.to?.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receitas")
        .select("*")
        .gte("data", format(prevStartDate, "yyyy-MM-dd"))
        .lt("data", format(startDate, "yyyy-MM-dd"));
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && (!isCustomPeriod || (!!customDateRange.from && !!customDateRange.to)),
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

  const handlePeriodChange = (value: string) => {
    setPeriodo(value);
    if (value !== "custom") {
      setCustomDateRange({ from: undefined, to: undefined });
    }
  };

  const generateTextReport = () => {
    const dateStr = new Date().toLocaleDateString('pt-BR');
    return `📊 RELATÓRIO FINANCEIRO - DASHBOARD
📅 Data: ${dateStr}
📆 Período: ${isCustomPeriod ? 'Personalizado' : `Últimos ${periodo} dias`}

💰 RESUMO FINANCEIRO
━━━━━━━━━━━━━━━━━━━━
• Faturamento Bruto: ${formatCurrency(faturamentoBruto)}
• Receita Líquida: ${formatCurrency(receitaLiquida)}
• Custos Totais: ${formatCurrency(custosTotal)}
• ${lucro >= 0 ? 'Lucro' : 'Prejuízo'}: ${formatCurrency(Math.abs(lucro))}
• Margem: ${margem.toFixed(1)}%

📈 VARIAÇÃO
━━━━━━━━━━━━━━━━━━━━
• Variação Faturamento: ${variacaoFaturamento >= 0 ? '+' : ''}${variacaoFaturamento.toFixed(1)}%

💡 Relatório gerado automaticamente pela Neua`;
  };

  const xlsData = {
    headers: ['Métrica', 'Valor'],
    rows: [
      ['Faturamento Bruto', faturamentoBruto],
      ['Taxas', taxasTotal],
      ['Receita Líquida', receitaLiquida],
      ['Custos Totais', custosTotal],
      [lucro >= 0 ? 'Lucro' : 'Prejuízo', Math.abs(lucro)],
      ['Margem (%)', parseFloat(margem.toFixed(1))],
    ] as (string | number)[][],
    sheetName: 'Dashboard'
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <FinanceiroExportButton
          containerRef={containerRef}
          sectionName="dashboard"
          textReport={generateTextReport()}
          xlsData={xlsData}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Select value={periodo} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

        {isCustomPeriod && (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal",
                    !customDateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange.from ? format(customDateRange.from, "dd/MM/yyyy") : "Início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDateRange.from}
                  onSelect={(date) => setCustomDateRange(prev => ({ ...prev, from: date }))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">até</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal",
                    !customDateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange.to ? format(customDateRange.to, "dd/MM/yyyy") : "Fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDateRange.to}
                  onSelect={(date) => setCustomDateRange(prev => ({ ...prev, to: date }))}
                  disabled={(date) => customDateRange.from ? date < customDateRange.from : false}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
        </div>
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
