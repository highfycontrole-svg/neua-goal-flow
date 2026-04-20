import { useState, useEffect } from 'react';
import { Plus, Lightbulb, Trash2, Loader2, Edit2, CheckCircle, XCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { CreateIdeiaDialog } from '@/components/planner/ideias/CreateIdeiaDialog';
import { EditIdeiaDialog } from '@/components/planner/ideias/EditIdeiaDialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface PlannerIdeia {
  id: string;
  user_id: string;
  tipo: string;
  tipo_customizado: string | null;
  titulo: string;
  descricao: string | null;
  qualidade: string;
  status: string;
  resultado: string | null;
  created_at: string;
  updated_at: string;
}

const TIPO_OPTIONS = [
  { value: 'conteudo', label: 'Conteúdo' },
  { value: 'anuncio', label: 'Anúncio' },
  { value: 'campanha', label: 'Campanha' },
  { value: 'estrategia', label: 'Estratégia' },
  { value: 'loja', label: 'Loja' },
  { value: 'produto', label: 'Produto' },
  { value: 'outro', label: 'Outro' },
];

const TIPO_COLORS: Record<string, string> = {
  'conteudo': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'anuncio': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'campanha': 'bg-green-500/20 text-green-400 border-green-500/30',
  'estrategia': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'loja': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'produto': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'outro': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const QUALIDADE_COLORS: Record<string, string> = {
  'boa': 'bg-green-500/20 text-green-400',
  'ok': 'bg-yellow-500/20 text-yellow-400',
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  'nao_feita': { label: 'Não Feita', icon: XCircle, color: 'text-muted-foreground' },
  'feita': { label: 'Feita', icon: CheckCircle, color: 'text-green-400' },
};

const RESULTADO_CONFIG: Record<string, { label: string; icon: typeof ThumbsUp; color: string }> = {
  'boa': { label: 'Foi Boa', icon: ThumbsUp, color: 'text-green-400' },
  'ruim': { label: 'Foi Ruim', icon: ThumbsDown, color: 'text-red-400' },
};

export default function PlannerIdeiasPage() {
  const { user } = useAuth();
  const [ideias, setIdeias] = useState<PlannerIdeia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedIdeia, setSelectedIdeia] = useState<PlannerIdeia | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Filters
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterQualidade, setFilterQualidade] = useState<string>('todos');

  useEffect(() => {
    if (user) {
      fetchIdeias();
    }
  }, [user]);

  const fetchIdeias = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('planner_ideias')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ideias:', error);
      toast.error('Erro ao carregar ideias');
    } else {
      setIdeias(data || []);
    }
    setIsLoading(false);
  };

  const handleDeleteIdeia = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    
    const { error } = await supabase
      .from('planner_ideias')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir ideia');
      console.error(error);
    } else {
      setIdeias(prev => prev.filter(i => i.id !== id));
      toast.success('Ideia excluída');
    }
    setDeletingId(null);
  };

  const filteredIdeias = ideias.filter(ideia => {
    if (filterTipo !== 'todos' && ideia.tipo !== filterTipo) return false;
    if (filterStatus !== 'todos' && ideia.status !== filterStatus) return false;
    if (filterQualidade !== 'todos' && ideia.qualidade !== filterQualidade) return false;
    return true;
  });

  const getTipoLabel = (ideia: PlannerIdeia) => {
    if (ideia.tipo === 'outro' && ideia.tipo_customizado) {
      return ideia.tipo_customizado;
    }
    return TIPO_OPTIONS.find(t => t.value === ideia.tipo)?.label || ideia.tipo;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Banco de Ideias</h2>
            <p className="text-sm text-muted-foreground">
              Capture e organize suas ideias estratégicas
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Ideia
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[140px] bg-surface-2 border-border/50">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tipos</SelectItem>
              {TIPO_OPTIONS.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] bg-surface-2 border-border/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="nao_feita">Não Feita</SelectItem>
              <SelectItem value="feita">Feita</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterQualidade} onValueChange={setFilterQualidade}>
            <SelectTrigger className="w-[140px] bg-surface-2 border-border/50">
              <SelectValue placeholder="Qualidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="boa">Ideia Boa</SelectItem>
              <SelectItem value="ok">Ideia OK</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredIdeias.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
              <Lightbulb className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {ideias.length === 0 ? 'Nenhuma ideia registrada' : 'Nenhuma ideia encontrada'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              {ideias.length === 0 
                ? 'Comece a registrar suas ideias para não perder nenhuma oportunidade.'
                : 'Tente ajustar os filtros para ver outras ideias.'}
            </p>
            {ideias.length === 0 && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Primeira Ideia
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredIdeias.map((ideia, index) => {
                const StatusIcon = STATUS_CONFIG[ideia.status]?.icon || XCircle;
                const ResultadoIcon = ideia.resultado ? RESULTADO_CONFIG[ideia.resultado]?.icon : null;
                
                return (
                  <motion.div
                    key={ideia.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedIdeia(ideia)}
                    className="group p-4 rounded-xl border border-border/50 bg-surface-2 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Lightbulb className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground truncate">{ideia.titulo}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${TIPO_COLORS[ideia.tipo] || TIPO_COLORS.outro}`}>
                              {getTipoLabel(ideia)}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${QUALIDADE_COLORS[ideia.qualidade]}`}>
                              {ideia.qualidade === 'boa' ? '⭐ Boa' : '👍 OK'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteIdeia(ideia.id, e)}
                        disabled={deletingId === ideia.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      >
                        {deletingId === ideia.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>

                    {ideia.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {ideia.descricao}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border/30">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${STATUS_CONFIG[ideia.status]?.color}`} />
                        <span className={`text-xs ${STATUS_CONFIG[ideia.status]?.color}`}>
                          {STATUS_CONFIG[ideia.status]?.label}
                        </span>
                        {ideia.status === 'feita' && ideia.resultado && ResultadoIcon && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <ResultadoIcon className={`h-4 w-4 ${RESULTADO_CONFIG[ideia.resultado]?.color}`} />
                            <span className={`text-xs ${RESULTADO_CONFIG[ideia.resultado]?.color}`}>
                              {RESULTADO_CONFIG[ideia.resultado]?.label}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(ideia.created_at), "dd/MM/yy", { locale: ptBR })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <CreateIdeiaDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          fetchIdeias();
          setIsCreateDialogOpen(false);
        }}
      />

      {selectedIdeia && (
        <EditIdeiaDialog
          open={!!selectedIdeia}
          onOpenChange={(open) => !open && setSelectedIdeia(null)}
          ideia={selectedIdeia}
          onSuccess={() => {
            fetchIdeias();
            setSelectedIdeia(null);
          }}
        />
      )}
    </div>
  );
}
