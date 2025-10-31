import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

interface MetasChartProps {
  data: Array<{
    setor: string;
    metas: number;
    superMetas: number;
  }>;
}

export function MetasChart({ data }: MetasChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-neua p-6"
    >
      <h3 className="text-xl font-display font-semibold mb-4">Metas por Setor</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="setor" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.75rem',
            }}
          />
          <Legend />
          <Bar dataKey="metas" fill="hsl(var(--primary))" name="Metas" radius={[8, 8, 0, 0]} />
          <Bar dataKey="superMetas" fill="hsl(217 91% 70%)" name="Super Metas" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
