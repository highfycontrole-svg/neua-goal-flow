import { Building2, Target, DollarSign, TrendingUp, Calendar, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface PlannerData {
  nome_empresa?: string | null;
  nicho?: string | null;
  faturamento_mensal?: number | null;
  margem_lucro?: number | null;
  ticket_medio?: number | null;
  etapa_atual?: number | null;
  metas_macro?: unknown;
  metas_smart?: unknown;
  riscos?: unknown;
}

interface PlannerSummaryProps {
  data: PlannerData;
}

export function PlannerSummary({ data }: PlannerSummaryProps) {
  const metasMacro = Array.isArray(data.metas_macro) ? data.metas_macro : [];
  const metasSmart = Array.isArray(data.metas_smart) ? data.metas_smart : [];
  const riscos = Array.isArray(data.riscos) ? data.riscos : [];

  const cards = [
    {
      icon: Building2,
      label: 'Empresa',
      value: data.nome_empresa || 'Não definido',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      icon: Target,
      label: 'Nicho',
      value: data.nicho || 'Não definido',
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
    {
      icon: DollarSign,
      label: 'Faturamento Mensal',
      value: data.faturamento_mensal 
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.faturamento_mensal)
        : 'Não definido',
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      icon: TrendingUp,
      label: 'Margem de Lucro',
      value: data.margem_lucro ? `${data.margem_lucro}%` : 'Não definido',
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
    },
  ];

  const statsCards = [
    {
      icon: Target,
      label: 'Metas Macro',
      value: metasMacro.length,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: CheckCircle2,
      label: 'Metas SMART',
      value: metasSmart.length,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
    },
    {
      icon: AlertTriangle,
      label: 'Riscos Identificados',
      value: riscos.length,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
    },
    {
      icon: Calendar,
      label: 'Etapa Atual',
      value: `${data.etapa_atual || 1}/8`,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Resumo do Planejamento</h3>
      </div>

      {/* Main info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[#1a1a1a] rounded-xl p-3 border border-border/20"
          >
            <div className={`h-8 w-8 rounded-lg ${card.bgColor} flex items-center justify-center mb-2`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{card.label}</p>
            <p className="text-sm font-medium text-foreground truncate mt-0.5">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-3">
        {statsCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="bg-[#1a1a1a] rounded-xl p-3 text-center border border-border/20"
          >
            <div className={`h-6 w-6 rounded-lg ${card.bgColor} flex items-center justify-center mx-auto mb-1.5`}>
              <card.icon className={`h-3 w-3 ${card.color}`} />
            </div>
            <p className="text-lg font-bold text-foreground">{card.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{card.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
