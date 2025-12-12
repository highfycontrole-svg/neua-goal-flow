import { Plus, Trash2, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

type Planner = {
  id: string;
  nome_empresa: string | null;
  etapa_atual: number;
  created_at: string;
};

interface PlannerSidebarProps {
  planners: Planner[];
  currentPlannerId: string | null;
  onSelectPlanner: (id: string) => void;
  onCreatePlanner: () => void;
  onDeletePlanner: (id: string) => void;
  isCreating: boolean;
}

export function PlannerSidebar({
  planners,
  currentPlannerId,
  onSelectPlanner,
  onCreatePlanner,
  onDeletePlanner,
  isCreating,
}: PlannerSidebarProps) {
  return (
    <div className="w-full lg:w-80 flex-shrink-0 bg-[#161616] rounded-2xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground text-sm">Meus Planejamentos</h3>
        <Button
          size="sm"
          onClick={onCreatePlanner}
          disabled={isCreating}
          className="h-8 px-3"
        >
          {isCreating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="space-y-2">
          {planners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum planejamento criado</p>
            </div>
          ) : (
            planners.map((planner) => (
              <motion.div
                key={planner.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'group p-3 rounded-xl cursor-pointer transition-all duration-200',
                  currentPlannerId === planner.id
                    ? 'bg-primary/20 border border-primary/30'
                    : 'bg-[#1a1a1a] hover:bg-[#242424] border border-transparent'
                )}
                onClick={() => onSelectPlanner(planner.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {planner.nome_empresa || 'Novo Planejamento'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Etapa {planner.etapa_atual}/8
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(planner.created_at), "dd MMM", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePlanner(planner.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1 bg-[#242424] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(planner.etapa_atual / 8) * 100}%` }}
                  />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
