import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useState } from "react";
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, ArrowRight } from "lucide-react";
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
  ReferenceLine
} from "recharts";
import { format, addDays, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export function FluxoCaixaTab() {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState("30");

  const startDate = subDays(new Date(), 30); // Last 30 days for realized
  const endDate = addDays(new Date(), parseInt(periodo)); // Projection period

  const { data: receitas = [] } = useQuery({
    queryKey: ["receitas-fluxo", user?.id],
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
    queryKey: ["despesas-fluxo", user?.id],
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

  // Calculate metrics
  const today = new Date();
  const receitasRealizadas = receitas.filter(r => r.status === "recebido").reduce((acc, r) => acc + Number(r.valor_bruto), 0);
  const receitasPrevistas = receitas.filter(r => r.status === "a_receber").reduce((acc, r) => acc + Number(r.valor_bruto), 0);
  const despesasRealizadas = despesas.reduce((acc, d) => acc + Number(d.valor), 0);
  
  // Estimated recurring expenses for projection
  const despesasRecorrentes = despesas.filter(d => d.recorrente).reduce((acc, d) => acc + Number(d.valor), 0);
  const despesasPrevistas = despesasRecorrentes * (parseInt(periodo) / 30);

  const saldoAtual = receitasRealizadas - despesasRealizadas;
  const saldoProjetado = saldoAtual + receitasPrevistas - despesasPrevistas;

  // Build chart data
  const chartData: { day: string; entradas: number; saidas: number; saldo: number }[] = [];
  let runningBalance = saldoAtual;

  // Group by week for better visualization
  const today_str = format(today, "yyyy-MM-dd");
  for (let i = 0; i <= parseInt(periodo); i += 7) {
    const dayDate = addDays(today, i);
    const dayStr = format(dayDate, "dd/MM");
    
    const dayReceitas = receitas
      .filter(r => {
        const rDate = new Date(r.data);
        return rDate >= dayDate && rDate < addDays(dayDate, 7);
      })
      .reduce((acc, r) => acc + Number(r.valor_bruto), 0);
    
    const dayDespesas = despesas
      .filter(d => {
        const dDate = new Date(d.data);
        return dDate >= dayDate && dDate < addDays(dayDate, 7);
      })
      .reduce((acc, d) => acc + Number(d.valor), 0);
    
    // Add estimated recurring for projection
    const estimatedDespesas = i > 0 ? despesasRecorrentes / 4 : dayDespesas;
    
    runningBalance += dayReceitas - estimatedDespesas;
    
    chartData.push({
      day: dayStr,
      entradas: dayReceitas,
      saidas: estimatedDespesas,
      saldo: runningBalance,
    });
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const kpis = [
    {
      title: "Entradas Realizadas",
      value: receitasRealizadas,
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Entradas Previstas",
      value: receitasPrevistas,
      icon: TrendingUp,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Saídas Realizadas",
      value: despesasRealizadas,
      icon: TrendingDown,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Saídas Previstas",
      value: despesasPrevistas,
      icon: TrendingDown,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Fluxo de Caixa</h2>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Próximos 7 dias</SelectItem>
            <SelectItem value="30">Próximos 30 dias</SelectItem>
            <SelectItem value="90">Próximos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-5 rounded-xl bg-card border border-border ${kpi.bgColor}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <span className="text-sm text-muted-foreground">{kpi.title}</span>
            </div>
            <p className={`text-2xl font-bold ${kpi.color}`}>{formatCurrency(kpi.value)}</p>
          </motion.div>
        ))}
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-6 rounded-xl border ${saldoAtual >= 0 ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <Wallet className={saldoAtual >= 0 ? "text-green-400" : "text-red-400"} />
            <span className="text-muted-foreground">Saldo Atual</span>
          </div>
          <p className={`text-3xl font-bold ${saldoAtual >= 0 ? "text-green-400" : "text-red-400"}`}>
            {formatCurrency(saldoAtual)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-6 rounded-xl border ${saldoProjetado >= 0 ? "bg-blue-500/10 border-blue-500/30" : "bg-red-500/10 border-red-500/30"}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <ArrowRight className={saldoProjetado >= 0 ? "text-blue-400" : "text-red-400"} />
            <span className="text-muted-foreground">Saldo Projetado ({periodo} dias)</span>
          </div>
          <p className={`text-3xl font-bold ${saldoProjetado >= 0 ? "text-blue-400" : "text-red-400"}`}>
            {formatCurrency(saldoProjetado)}
          </p>
        </motion.div>
      </div>

      {/* Alert */}
      {saldoProjetado < 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div>
            <p className="font-medium text-red-400">Alerta de Caixa Negativo</p>
            <p className="text-sm text-muted-foreground">
              Com base nas projeções, seu caixa pode ficar negativo nos próximos {periodo} dias. Revise suas despesas ou busque novas fontes de receita.
            </p>
          </div>
        </motion.div>
      )}

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 rounded-xl bg-card border border-border"
      >
        <h3 className="text-lg font-semibold mb-4">Projeção de Fluxo de Caixa</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Bar dataKey="entradas" name="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        )}
      </motion.div>
    </div>
  );
}
