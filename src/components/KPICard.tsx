import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  /** Optional accent color for the icon container. Defaults to 'primary'. */
  accent?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  className?: string;
}

const accentMap: Record<NonNullable<KPICardProps['accent']>, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary/12', text: 'text-primary' },
  success: { bg: 'bg-success/15', text: 'text-success' },
  warning: { bg: 'bg-warning/15', text: 'text-warning' },
  destructive: { bg: 'bg-destructive/15', text: 'text-destructive' },
  info: { bg: 'bg-info/15', text: 'text-info' },
};

export function KPICard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  accent = 'primary',
  className = '',
}: KPICardProps) {
  const colors = accentMap[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className={`group relative overflow-hidden p-5 rounded-2xl border border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-[0_8px_28px_-12px_hsl(217_95%_62%/0.35)] ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/55 mb-2 truncate">
            {title}
          </p>
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-foreground truncate">
            {value}
          </h3>
        </div>
        <div
          className={`h-11 w-11 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0 ml-3 transition-transform duration-200 group-hover:scale-105`}
        >
          <Icon className={`h-5 w-5 ${colors.text}`} />
        </div>
      </div>

      {description && (
        <p className="text-sm text-foreground/60">{description}</p>
      )}

      {trend && (
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
              trend.isPositive
                ? 'bg-success/15 text-success'
                : 'bg-destructive/15 text-destructive'
            }`}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {trend.isPositive ? '+' : ''}
            {trend.value.toFixed(1)}%
          </span>
          <span className="text-xs text-foreground/55">
            {trend.label ?? 'vs mês anterior'}
          </span>
        </div>
      )}
    </motion.div>
  );
}
