import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const ETAPAS = [
  { id: 1, nome: 'Dados do Negócio' },
  { id: 2, nome: 'Financeiro' },
  { id: 3, nome: 'Clientes & Mercado' },
  { id: 4, nome: 'Operação' },
  { id: 5, nome: 'Marketing' },
  { id: 6, nome: 'Diagnóstico' },
  { id: 7, nome: 'Metas 2026' },
  { id: 8, nome: 'Plano de Ação' },
];

interface PlannerProgressIndicatorProps {
  etapaAtual: number;
}

export function PlannerProgressIndicator({ etapaAtual }: PlannerProgressIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Progresso do Planejamento</span>
        <span className="text-xs font-medium text-primary">{Math.round((etapaAtual / 8) * 100)}%</span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-[#242424] rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 ease-out"
          style={{ width: `${(etapaAtual / 8) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="hidden md:flex items-center justify-between gap-1">
        {ETAPAS.map((etapa) => {
          const isCompleted = etapa.id < etapaAtual;
          const isCurrent = etapa.id === etapaAtual;
          
          return (
            <div key={etapa.id} className="flex-1 flex flex-col items-center">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isCurrent && 'bg-primary/30 text-primary ring-2 ring-primary',
                  !isCompleted && !isCurrent && 'bg-[#242424] text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : etapa.id}
              </div>
              <span
                className={cn(
                  'text-[10px] mt-1 text-center leading-tight max-w-[60px] truncate',
                  isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {etapa.nome}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile view - only current step */}
      <div className="md:hidden flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/30 text-primary ring-2 ring-primary flex items-center justify-center text-xs font-medium">
          {etapaAtual}
        </div>
        <span className="text-sm text-primary font-medium">
          {ETAPAS.find(e => e.id === etapaAtual)?.nome || 'Etapa ' + etapaAtual}
        </span>
      </div>
    </div>
  );
}
