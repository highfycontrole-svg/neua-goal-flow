import { Plus, Trash2, FileText, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

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
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
      {/* Mobile toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="lg:hidden w-full flex items-center justify-between p-3 bg-surface-1 rounded-xl mb-2"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Meus Planejamentos ({planners.length})
          </span>
        </div>
        {isCollapsed ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Desktop always visible, mobile collapsible */}
      <div className={cn(
        "bg-surface-1 rounded-2xl overflow-hidden transition-all duration-300",
        isCollapsed ? "hidden lg:block" : "block"
      )}>
        <div className="p-3 sm:p-4 flex flex-col max-h-[350px] lg:max-h-[calc(100vh-220px)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 gap-2">
            <h3 className="font-semibold text-foreground text-sm hidden lg:block truncate">
              Meus Planejamentos
            </h3>
            <Button
              size="sm"
              onClick={onCreatePlanner}
              disabled={isCreating}
              className="h-8 px-3 flex-1 lg:flex-none"
            >
              {isCreating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span className="ml-1.5">Novo</span>
            </Button>
          </div>

          {/* Planners list - scrollable */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
            {planners.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
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
                    'group p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all duration-200',
                    currentPlannerId === planner.id
                      ? 'bg-primary/20 border border-primary/30'
                      : 'bg-surface-2 hover:bg-surface-3 border border-transparent'
                  )}
                  onClick={() => {
                    onSelectPlanner(planner.id);
                    setIsCollapsed(true);
                  }}
                >
                  {/* Card header with title and delete */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm text-foreground truncate flex-1">
                      {planner.nome_empresa || 'Novo Planejamento'}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePlanner(planner.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Meta info */}
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] sm:text-[11px] text-muted-foreground">
                    <span className="bg-surface-3 px-1.5 py-0.5 rounded">
                      Etapa {planner.etapa_atual}/8
                    </span>
                    <span>
                      {format(new Date(planner.created_at), "dd/MM/yy", { locale: ptBR })}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-2 h-1 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                      style={{ width: `${(planner.etapa_atual / 8) * 100}%` }}
                    />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
