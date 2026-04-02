import { useState, useEffect } from 'react';
import { Plus, Building2, Megaphone, LayoutGrid, Trash2, Loader2, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreateManualPlannerDialog } from './CreateManualPlannerDialog';
import { ManualPlannerEditor } from './ManualPlannerEditor';

type PlannerType = 'anual' | 'campanha' | 'trimestral';

interface ManualPlanner {
  id: string;
  nome: string;
  tipo: PlannerType;
  created_at: string;
  updated_at: string;
}

export function ManualPlannerList() {
  const { user } = useAuth();
  const [planners, setPlanners] = useState<ManualPlanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlannerId, setSelectedPlannerId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPlanners();
    }
  }, [user]);

  const fetchPlanners = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('planners_manuais')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching planners:', error);
      toast.error('Erro ao carregar planejamentos');
    } else {
      setPlanners((data || []).map(d => ({ ...d, tipo: d.tipo as PlannerType })));
    }
    setIsLoading(false);
  };

  const handleCreatePlanner = async (nome: string, tipo: PlannerType) => {
    if (!user) return;

    const initialContent = tipo === 'anual' 
      ? { diagnostico: '', objetivos: '', financeiro: '', metas: '', marketing: '', operacional: '', equipe: '', riscos: '', tarefas: '' }
      : tipo === 'campanha'
        ? { nome_campanha: '', objetivo: '', publico: '', periodo: '', orcamento: '', canais: '', cronograma: '', kpis: '', observacoes: '' }
        : { q1: {}, q2: {}, q3: {}, q4: {} };

    const { data, error } = await supabase
      .from('planners_manuais')
      .insert({
        user_id: user.id,
        nome,
        tipo,
        conteudo: initialContent,
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao criar planejamento');
      console.error(error);
      throw error;
    }

    setPlanners(prev => [data as ManualPlanner, ...prev]);
    setSelectedPlannerId(data.id);
    toast.success('Planejamento criado!');
  };

  const handleDeletePlanner = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    
    const { error } = await supabase
      .from('planners_manuais')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir');
      console.error(error);
    } else {
      setPlanners(prev => prev.filter(p => p.id !== id));
      toast.success('Planejamento excluído');
    }
    setDeletingId(null);
  };

  if (selectedPlannerId) {
    return (
      <ManualPlannerEditor
        plannerId={selectedPlannerId}
        onBack={() => {
          setSelectedPlannerId(null);
          fetchPlanners();
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#161616] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b border-border/30 bg-[#1a1a1a]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Planner Manual</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Crie planejamentos estruturados sem uso de IA
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Novo Planner
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : planners.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum planejamento criado
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Crie seu primeiro planejamento manual para começar a organizar suas estratégias.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeiro Planejamento
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {planners.map((planner, index) => (
                <motion.div
                  key={planner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedPlannerId(planner.id)}
                  className="group p-4 rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
                >
                    <div className="flex items-start justify-between gap-3">
                     <div className="flex items-start gap-3 min-w-0">
                       <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                         planner.tipo === 'anual' ? 'bg-blue-500/20' : planner.tipo === 'trimestral' ? 'bg-purple-500/20' : 'bg-orange-500/20'
                       }`}>
                         {planner.tipo === 'anual' ? (
                           <Building2 className="h-5 w-5 text-blue-400" />
                         ) : planner.tipo === 'trimestral' ? (
                           <LayoutGrid className="h-5 w-5 text-purple-400" />
                         ) : (
                           <Megaphone className="h-5 w-5 text-orange-400" />
                         )}
                       </div>
                       <div className="min-w-0">
                         <h3 className="font-semibold text-foreground truncate">{planner.nome}</h3>
                         <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 ${
                           planner.tipo === 'anual' 
                             ? 'bg-blue-500/20 text-blue-400' 
                             : planner.tipo === 'trimestral'
                               ? 'bg-purple-500/20 text-purple-400'
                               : 'bg-orange-500/20 text-orange-400'
                         }`}>
                           {planner.tipo === 'anual' ? 'Anual' : planner.tipo === 'trimestral' ? 'Trimestral' : 'Campanha'}
                         </span>
                       </div>
                     </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeletePlanner(planner.id, e)}
                      disabled={deletingId === planner.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    >
                      {deletingId === planner.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(planner.created_at), "dd 'de' MMM", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(planner.updated_at), 'HH:mm', { locale: ptBR })}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <CreateManualPlannerDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCreatePlanner={handleCreatePlanner}
      />
    </div>
  );
}
