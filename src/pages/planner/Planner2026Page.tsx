import { useState, useEffect, useRef } from 'react';
import { Plus, Send, Loader2, FileText, RotateCcw, Download, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PlannerChatMessage } from '@/components/planner/PlannerChatMessage';
import { PlannerSidebar } from '@/components/planner/PlannerSidebar';
import { PlannerProgressIndicator } from '@/components/planner/PlannerProgressIndicator';
import { PlannerSummary } from '@/components/planner/PlannerSummary';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';

type Message = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
};

type Planner = {
  id: string;
  nome_empresa: string | null;
  etapa_atual: number;
  created_at: string;
  nicho?: string | null;
  faturamento_mensal?: number | null;
  margem_lucro?: number | null;
  ticket_medio?: number | null;
  metas_macro?: unknown;
  metas_smart?: unknown;
  riscos?: unknown;
};

export default function Planner2026Page() {
  const { user } = useAuth();
  const [planners, setPlanners] = useState<Planner[]>([]);
  const [currentPlannerId, setCurrentPlannerId] = useState<string | null>(null);
  const [currentPlannerData, setCurrentPlannerData] = useState<Planner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch planners
  useEffect(() => {
    if (user) {
      fetchPlanners();
    }
  }, [user]);

  // Fetch messages and planner data when planner changes
  useEffect(() => {
    if (currentPlannerId) {
      fetchMessages(currentPlannerId);
      fetchPlannerData(currentPlannerId);
    } else {
      setMessages([]);
      setCurrentPlannerData(null);
    }
  }, [currentPlannerId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [inputValue]);

  const fetchPlanners = async () => {
    const { data, error } = await supabase
      .from('planner_2026')
      .select('id, nome_empresa, etapa_atual, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching planners:', error);
      return;
    }

    setPlanners(data || []);
    if (data && data.length > 0 && !currentPlannerId) {
      setCurrentPlannerId(data[0].id);
    }
  };

  const fetchPlannerData = async (plannerId: string) => {
    const { data, error } = await supabase
      .from('planner_2026')
      .select('*')
      .eq('id', plannerId)
      .single();

    if (error) {
      console.error('Error fetching planner data:', error);
      return;
    }

    setCurrentPlannerData(data);
  };

  const fetchMessages = async (plannerId: string) => {
    const { data, error } = await supabase
      .from('planner_2026_messages')
      .select('*')
      .eq('planner_id', plannerId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data?.map(m => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })) || []);
  };

  const createNewPlanner = async () => {
    if (!user) return;
    setIsCreating(true);

    const { data, error } = await supabase
      .from('planner_2026')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao criar planejamento');
      console.error(error);
      setIsCreating(false);
      return;
    }

    setPlanners(prev => [{ id: data.id, nome_empresa: null, etapa_atual: 1, created_at: data.created_at }, ...prev]);
    setCurrentPlannerId(data.id);
    setMessages([]);
    setIsCreating(false);
    
    setTimeout(() => {
      sendInitialMessage(data.id);
    }, 500);
  };

  const sendInitialMessage = async (plannerId: string) => {
    setIsLoading(true);
    
    const initialMessages: Message[] = [];
    let assistantContent = '';

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      await streamChat({
        messages: initialMessages,
        onDelta: upsertAssistant,
        onDone: async () => {
          await supabase.from('planner_2026_messages').insert({
            planner_id: plannerId,
            user_id: user!.id,
            role: 'assistant',
            content: assistantContent
          });
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao iniciar conversa');
      setIsLoading(false);
    }
  };

  const streamChat = async ({
    messages,
    onDelta,
    onDone,
  }: {
    messages: Message[];
    onDelta: (deltaText: string) => void;
    onDone: () => void;
  }) => {
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/planner-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, content: m.content })) }),
    });

    if (!resp.ok) {
      const errorData = await resp.json();
      throw new Error(errorData.error || 'Erro ao processar requisição');
    }

    if (!resp.body) throw new Error('No response body');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (raw.startsWith(':') || raw.trim() === '') continue;
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore partial leftovers */ }
      }
    }

    onDone();
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !currentPlannerId || isLoading) return;

    const userMessage: Message = { role: 'user', content: inputValue.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    await supabase.from('planner_2026_messages').insert({
      planner_id: currentPlannerId,
      user_id: user!.id,
      role: 'user',
      content: userMessage.content
    });

    let assistantContent = '';
    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMessage],
        onDelta: upsertAssistant,
        onDone: async () => {
          await supabase.from('planner_2026_messages').insert({
            planner_id: currentPlannerId,
            user_id: user!.id,
            role: 'assistant',
            content: assistantContent
          });

          if (assistantContent.length > 0 && userMessage.content.length > 0) {
            const currentPlanner = planners.find(p => p.id === currentPlannerId);
            if (!currentPlanner?.nome_empresa) {
              await supabase
                .from('planner_2026')
                .update({ nome_empresa: userMessage.content.slice(0, 50) })
                .eq('id', currentPlannerId);
              fetchPlanners();
            }
          }

          setIsLoading(false);
          textareaRef.current?.focus();
        }
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
      setIsLoading(false);
    }
  };

  const deletePlanner = async (id: string) => {
    const { error } = await supabase.from('planner_2026').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir planejamento');
      return;
    }
    
    setPlanners(prev => prev.filter(p => p.id !== id));
    if (currentPlannerId === id) {
      const remaining = planners.filter(p => p.id !== id);
      setCurrentPlannerId(remaining[0]?.id || null);
    }
    toast.success('Planejamento excluído');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const exportToPDF = () => {
    if (!currentPlannerData || messages.length === 0) {
      toast.error('Nenhum conteúdo para exportar');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Planejamento Estratégico 2026', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(currentPlannerData.nome_empresa || 'Empresa não definida', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setTextColor(128);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, margin, yPosition);
    doc.setTextColor(0);
    yPosition += 15;

    // Separator
    doc.setDrawColor(200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    // Messages content
    doc.setFontSize(10);
    messages.forEach((message) => {
      const prefix = message.role === 'user' ? 'Você: ' : 'Assistente: ';
      const text = prefix + message.content.replace(/[#*_`]/g, '');
      
      const lines = doc.splitTextToSize(text, contentWidth);
      
      lines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      
      yPosition += 5;
    });

    doc.save(`planejamento-2026-${currentPlannerData.nome_empresa || 'neua'}.pdf`);
    toast.success('PDF exportado com sucesso!');
  };

  const currentPlanner = planners.find(p => p.id === currentPlannerId);

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col lg:flex-row gap-4">
      {/* Sidebar */}
      <PlannerSidebar
        planners={planners}
        currentPlannerId={currentPlannerId}
        onSelectPlanner={setCurrentPlannerId}
        onCreatePlanner={createNewPlanner}
        onDeletePlanner={deletePlanner}
        isCreating={isCreating}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#161616] rounded-2xl overflow-hidden">
        {currentPlannerId ? (
          <>
            {/* Header */}
            <div className="flex-shrink-0 p-3 sm:p-4 border-b border-border/30 bg-[#1a1a1a]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-foreground text-sm sm:text-base truncate">
                      {currentPlanner?.nome_empresa || 'Novo Planejamento'}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Planner Neua 2026
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowSummary(!showSummary)}
                    className="text-xs h-8"
                  >
                    {showSummary ? <EyeOff className="h-3 w-3 mr-1.5" /> : <Eye className="h-3 w-3 mr-1.5" />}
                    <span className="hidden sm:inline">Resumo</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportToPDF}
                    className="text-xs h-8"
                  >
                    <Download className="h-3 w-3 mr-1.5" />
                    <span className="hidden sm:inline">Exportar PDF</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setMessages([]);
                      sendInitialMessage(currentPlannerId);
                    }}
                    className="text-xs h-8"
                  >
                    <RotateCcw className="h-3 w-3 sm:mr-1.5" />
                    <span className="hidden sm:inline">Reiniciar</span>
                  </Button>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mt-4">
                <PlannerProgressIndicator etapaAtual={currentPlanner?.etapa_atual || 1} />
              </div>

              {/* Summary Panel */}
              <AnimatePresence>
                {showSummary && currentPlannerData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden"
                  >
                    <PlannerSummary data={currentPlannerData} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Messages - Scrollable container */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-3 sm:p-4"
            >
              <div className="space-y-4 max-w-4xl mx-auto pb-4">
                <AnimatePresence mode="popLayout">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <PlannerChatMessage message={message} />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Pensando...</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Input - Fixed at bottom */}
            <div className="flex-shrink-0 p-3 sm:p-4 border-t border-border/30 bg-[#1a1a1a]">
              <div className="flex gap-2 sm:gap-3 max-w-4xl mx-auto">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
                  disabled={isLoading}
                  className="flex-1 bg-[#242424] border-border/30 min-h-[44px] max-h-[150px] resize-none text-sm"
                  rows={1}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={isLoading || !inputValue.trim()}
                  className="h-11 px-4 sm:px-6 self-end"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Pressione Enter para enviar • Shift+Enter para nova linha
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
              <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Planner Neua 2026</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md">
              Crie um planejamento estratégico completo para o seu e-commerce em 2026 com a ajuda de IA.
            </p>
            <Button onClick={createNewPlanner} disabled={isCreating} size="lg">
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Iniciar Novo Planejamento
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
