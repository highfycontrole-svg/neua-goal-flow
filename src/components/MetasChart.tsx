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
      className="p-4 sm:p-6 rounded-2xl border border-border/30"
      style={{ backgroundColor: 'hsl(var(--surface-1))' }}
    >
      <h3 className="text-lg sm:text-xl font-display font-semibold mb-4">Metas por Setor</h3>
      <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="setor" stroke="hsl(var(--muted-foreground))" fontSize={10} className="sm:text-xs" />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--surface-2))',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.75rem',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="metas" fill="hsl(var(--primary))" name="Metas" radius={[8, 8, 0, 0]} />
          <Bar dataKey="superMetas" fill="hsl(217 91% 70%)" name="Super Metas" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
