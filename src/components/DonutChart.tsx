import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';

interface DonutChartProps {
  data: Array<{
    setor: string;
    total: number;
    concluidas: number;
  }>;
  onSectorClick?: (setor: string) => void;
}

const COLORS = [
  'hsl(217, 91%, 60%)',  // primary
  'hsl(160, 60%, 45%)',  // chart-2
  'hsl(30, 80%, 55%)',   // chart-3
  'hsl(280, 65%, 60%)',  // chart-4
  'hsl(340, 75%, 55%)',  // chart-5
  'hsl(217, 91%, 70%)',
  'hsl(190, 70%, 50%)',
  'hsl(50, 90%, 60%)',
];

export function DonutChart({ data, onSectorClick }: DonutChartProps) {
  const chartData = data.map((item) => ({
    name: item.setor,
    value: item.total,
    concluidas: item.concluidas,
  }));

  const statusData = data.reduce(
    (acc, item) => {
      acc.concluidas += item.concluidas;
      acc.pendentes += item.total - item.concluidas;
      return acc;
    },
    { concluidas: 0, pendentes: 0 }
  );

  const statusChartData = [
    { name: 'Concluídas', value: statusData.concluidas },
    { name: 'Pendentes', value: statusData.pendentes },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-6 rounded-2xl border border-border/30"
        style={{ backgroundColor: 'hsl(var(--surface-1))' }}
      >
        <h3 className="text-lg sm:text-xl font-display font-semibold mb-4">Distribuição por Setor</h3>
        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              onClick={(data) => onSectorClick?.(data.name)}
              className="cursor-pointer"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--surface-2))',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.75rem',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 sm:p-6 rounded-2xl border border-border/30"
        style={{ backgroundColor: 'hsl(var(--surface-1))' }}
      >
        <h3 className="text-lg sm:text-xl font-display font-semibold mb-4">Status das Metas</h3>
        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
          <PieChart>
            <Pie
              data={statusChartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              <Cell fill="hsl(160, 60%, 45%)" />
              <Cell fill="hsl(30, 80%, 55%)" />
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--surface-2))',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.75rem',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
