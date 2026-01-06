import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Package, Truck, CheckCircle, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";

interface Pedido {
  id: string;
  status: string;
  transportadora: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  "Entregue": "#22c55e",
  "Negado": "#ef4444",
  "Em trânsito BR": "#3b82f6",
  "Enviado": "#a855f7",
  "Recolhido": "#f97316",
  "Aguardando Envio": "#eab308",
  "Reenvio": "#06b6d4",
  "SEM RASTREIO": "#6b7280",
};

export function PedidosMetricas() {
  const { user } = useAuth();

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["pedidos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Pedido[];
    },
    enabled: !!user?.id,
  });

  // Calculate metrics
  const totalPedidos = pedidos.length;
  const entregues = pedidos.filter((p) => p.status === "Entregue").length;
  const emTransito = pedidos.filter((p) => ["Em trânsito BR", "Enviado"].includes(p.status)).length;
  const taxaEntrega = totalPedidos > 0 ? ((entregues / totalPedidos) * 100).toFixed(1) : "0";

  // Status distribution
  const statusData = Object.entries(
    pedidos.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] || "#6b7280" }));

  // Transportadora distribution
  const transportadoraData = Object.entries(
    pedidos.reduce((acc, p) => {
      const key = p.transportadora || "Não informada";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Monthly evolution
  const monthlyData = pedidos.reduce((acc, p) => {
    const month = new Date(p.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    const existing = acc.find((item) => item.month === month);
    if (existing) {
      existing.total++;
      if (p.status === "Entregue") existing.entregues++;
    } else {
      acc.push({
        month,
        total: 1,
        entregues: p.status === "Entregue" ? 1 : 0,
      });
    }
    return acc;
  }, [] as { month: string; total: number; entregues: number }[]);

  const kpis = [
    {
      title: "Total de Pedidos",
      value: totalPedidos,
      icon: Package,
      color: "text-primary",
    },
    {
      title: "Entregues",
      value: entregues,
      icon: CheckCircle,
      color: "text-green-400",
    },
    {
      title: "Em Trânsito",
      value: emTransito,
      icon: Truck,
      color: "text-blue-400",
    },
    {
      title: "Taxa de Entrega",
      value: `${taxaEntrega}%`,
      icon: TrendingUp,
      color: "text-purple-400",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 rounded-xl bg-card border border-border"
          >
            <div className="flex items-center gap-3 mb-2">
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              <span className="text-sm text-muted-foreground">{kpi.title}</span>
            </div>
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-xl bg-card border border-border"
        >
          <h3 className="text-lg font-semibold mb-4">Pedidos por Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <AlertCircle className="h-5 w-5 mr-2" />
              Nenhum dado disponível
            </div>
          )}
        </motion.div>

        {/* Transportadora Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-xl bg-card border border-border"
        >
          <h3 className="text-lg font-semibold mb-4">Pedidos por Transportadora</h3>
          {transportadoraData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transportadoraData} layout="vertical">
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <AlertCircle className="h-5 w-5 mr-2" />
              Nenhum dado disponível
            </div>
          )}
        </motion.div>
      </div>

      {/* Monthly Evolution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 rounded-xl bg-card border border-border"
      >
        <h3 className="text-lg font-semibold mb-4">Evolução Mensal</h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                name="Total"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
              <Line
                type="monotone"
                dataKey="entregues"
                name="Entregues"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: "#22c55e" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <AlertCircle className="h-5 w-5 mr-2" />
            Nenhum dado disponível
          </div>
        )}
      </motion.div>

      {/* Status Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-xl bg-card border border-border"
      >
        <h3 className="text-lg font-semibold mb-4">Legenda de Status</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm text-muted-foreground">{status}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
