import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type PlannerType = 'anual' | 'campanha';

interface PlannerData {
  id: string;
  nome: string;
  tipo: PlannerType;
  conteudo: Record<string, string>;
  created_at: string;
  updated_at: string;
}

interface ManualPlannerEditorProps {
  plannerId: string;
  onBack: () => void;
}

const SECTIONS_ANUAL = [
  { key: 'diagnostico', title: 'Diagnóstico do Negócio', placeholder: 'Descreva a situação atual da empresa, pontos fortes, pontos fracos...' },
  { key: 'objetivos', title: 'Objetivos Gerais do Ano', placeholder: 'Quais são os principais objetivos para 2026?' },
  { key: 'financeiro', title: 'Planejamento Financeiro', placeholder: 'Projeções de faturamento, investimentos, margem de lucro...' },
  { key: 'metas', title: 'Metas Estratégicas', placeholder: 'Liste as metas SMART para o ano...' },
  { key: 'marketing', title: 'Planejamento de Marketing', placeholder: 'Estratégias de marketing, canais, campanhas planejadas...' },
  { key: 'operacional', title: 'Planejamento Operacional', placeholder: 'Melhorias em processos, logística, tecnologia...' },
  { key: 'equipe', title: 'Planejamento de Equipe', placeholder: 'Contratações, treinamentos, estrutura organizacional...' },
  { key: 'riscos', title: 'Principais Riscos e Contingências', placeholder: 'Identifique riscos potenciais e planos de contingência...' },
  { key: 'tarefas', title: 'Tarefas e Iniciativas Estratégicas', placeholder: 'Liste as principais iniciativas e projetos do ano...' },
];

const SECTIONS_CAMPANHA = [
  { key: 'nome_campanha', title: 'Nome da Campanha', placeholder: 'Ex: Black Friday 2026, Lançamento Verão...' },
  { key: 'objetivo', title: 'Objetivo da Campanha', placeholder: 'Qual o objetivo principal desta campanha?' },
  { key: 'publico', title: 'Público-Alvo', placeholder: 'Defina o público-alvo desta campanha...' },
  { key: 'periodo', title: 'Período da Campanha', placeholder: 'Datas de início e fim da campanha...' },
  { key: 'orcamento', title: 'Orçamento Previsto', placeholder: 'Quanto será investido nesta campanha?' },
  { key: 'canais', title: 'Estratégia de Canais', placeholder: 'Quais canais serão utilizados? (Instagram, Google, etc)' },
  { key: 'cronograma', title: 'Cronograma de Ações', placeholder: 'Liste as ações e suas datas...' },
  { key: 'kpis', title: 'KPIs e Métricas de Sucesso', placeholder: 'Como será medido o sucesso da campanha?' },
  { key: 'observacoes', title: 'Observações Gerais', placeholder: 'Outras informações relevantes...' },
];

export function ManualPlannerEditor({ plannerId, onBack }: ManualPlannerEditorProps) {
  const [planner, setPlanner] = useState<PlannerData | null>(null);
  const [content, setContent] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPlanner();
  }, [plannerId]);

  const fetchPlanner = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('planners_manuais')
      .select('*')
      .eq('id', plannerId)
      .single();

    if (error) {
      console.error('Error fetching planner:', error);
      toast.error('Erro ao carregar planejamento');
      onBack();
      return;
    }

    setPlanner(data as PlannerData);
    setContent((data.conteudo as Record<string, string>) || {});
    setIsLoading(false);
  };

  const handleContentChange = useCallback((key: string, value: string) => {
    setContent(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const saveContent = async () => {
    if (!planner) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from('planners_manuais')
      .update({ conteudo: content })
      .eq('id', plannerId);

    if (error) {
      toast.error('Erro ao salvar');
      console.error(error);
    } else {
      toast.success('Salvo com sucesso!');
      setHasChanges(false);
    }
    setIsSaving(false);
  };

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    if (!hasChanges) return;
    
    const timer = setTimeout(() => {
      saveContent();
    }, 30000);

    return () => clearTimeout(timer);
  }, [content, hasChanges]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!planner) return null;

  const sections = planner.tipo === 'anual' ? SECTIONS_ANUAL : SECTIONS_CAMPANHA;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border/30 bg-[#1a1a1a]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="font-semibold text-foreground">{planner.nome}</h2>
              <p className="text-xs text-muted-foreground">
                {planner.tipo === 'anual' ? 'Planejamento Anual' : 'Planejamento de Campanha'}
              </p>
            </div>
          </div>
          <Button 
            onClick={saveContent} 
            disabled={isSaving || !hasChanges}
            size="sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {hasChanges ? 'Salvar' : 'Salvo'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar Navigation */}
        <div className="w-48 lg:w-56 flex-shrink-0 border-r border-border/30 bg-[#161616]">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {sections.map((section, index) => (
                <motion.button
                  key={section.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setActiveSection(section.key)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                    activeSection === section.key
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="text-xs text-muted-foreground mr-2">{index + 1}.</span>
                  {section.title}
                </motion.button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Editor Area */}
        <div className="flex-1 min-w-0">
          <ScrollArea className="h-full">
            <div className="p-4 sm:p-6 space-y-6 max-w-3xl">
              <AnimatePresence mode="wait">
                {activeSection ? (
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {(() => {
                      const section = sections.find(s => s.key === activeSection);
                      if (!section) return null;
                      return (
                        <>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{section.placeholder}</p>
                          </div>
                          <Textarea
                            value={content[section.key] || ''}
                            onChange={(e) => handleContentChange(section.key, e.target.value)}
                            placeholder={section.placeholder}
                            className="min-h-[300px] bg-[#1a1a1a] border-border/30 resize-none"
                          />
                        </>
                      );
                    })()}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <p className="text-muted-foreground">
                      Selecione uma seção ao lado para começar a editar
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
