import { Plus, Trash2, FileText, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
      {/* Mobile toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="lg:hidden w-full flex items-center justify-between p-3 bg-[#161616] rounded-xl mb-2"
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

      <AnimatePresence>
        {(!isCollapsed || window.innerWidth >= 1024) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#161616] rounded-2xl overflow-hidden"
          >
            <div className="p-4 flex flex-col h-full max-h-[300px] lg:max-h-[calc(100vh-200px)]">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground text-sm hidden lg:block">
                  Meus Planejamentos
                </h3>
                <Button
                  size="sm"
                  onClick={onCreatePlanner}
                  disabled={isCreating}
                  className="h-8 px-3 w-full lg:w-auto"
                >
                  {isCreating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 mr-2" />
                  )}
                  <span className="lg:hidden">Novo Planejamento</span>
                </Button>
              </div>

              {/* Planners list */}
              <ScrollArea className="flex-1 -mx-1 px-1">
                <div className="space-y-2">
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
                          'group p-3 rounded-xl cursor-pointer transition-all duration-200 w-full',
                          currentPlannerId === planner.id
                            ? 'bg-primary/20 border border-primary/30'
                            : 'bg-[#1a1a1a] hover:bg-[#242424] border border-transparent'
                        )}
                        onClick={() => {
                          onSelectPlanner(planner.id);
                          if (window.innerWidth < 1024) {
                            setIsCollapsed(true);
                          }
                        }}
                      >
                        {/* Card content */}
                        <div className="flex items-start gap-2 w-full">
                          {/* Text content */}
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="font-medium text-sm text-foreground truncate pr-1">
                              {planner.nome_empresa || 'Novo Planejamento'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                Etapa {planner.etapa_atual}/8
                              </span>
                              <span className="text-[11px] text-muted-foreground">•</span>
                              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                {format(new Date(planner.created_at), "dd/MM/yy", { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                          
                          {/* Delete button - always visible on mobile, hover on desktop */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePlanner(planner.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-2 h-1.5 bg-[#242424] rounded-full overflow-hidden w-full">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300"
                            style={{ width: `${(planner.etapa_atual / 8) * 100}%` }}
                          />
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
