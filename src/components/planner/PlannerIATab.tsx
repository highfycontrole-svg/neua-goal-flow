import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Send, Loader2, FileText, RotateCcw, Download, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PlannerChatMessage } from '@/components/planner/PlannerChatMessage';
import { PlannerSidebar } from '@/components/planner/PlannerSidebar';
import { PlannerProgressIndicator } from '@/components/planner/PlannerProgressIndicator';
import { PlannerSummary } from '@/components/planner/PlannerSummary';
import { motion, AnimatePresence } from 'framer-motion';
// jsPDF is dynamically imported when the user clicks "Export PDF"

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

const STAGE_KEYWORDS = [
  { stage: 1, keywords: ['nome da empresa', 'nicho', 'tempo de operação', 'modelo de negócio', 'faturamento', 'margem de lucro'] },
  { stage: 2, keywords: ['cliente ideal', 'dores do cliente', 'concorrentes', 'produtos mais vendidos', 'problemas operacionais'] },
  { stage: 3, keywords: ['canais de marketing', 'tráfego pago', 'canais orgânicos', 'influenciadores', 'automação'] },
  { stage: 4, keywords: ['diagnóstico interno', 'diagnóstico externo', 'swot', 'pontos fortes', 'pontos fracos'] },
  { stage: 5, keywords: ['metas macro', 'metas smart', 'kpis', 'indicadores'] },
  { stage: 6, keywords: ['plano de ação', 'marketing & aquisição', 'vendas & conversão', 'operação & logística'] },
  { stage: 7, keywords: ['responsáveis', 'orçamento', 'investimento mensal'] },
  { stage: 8, keywords: ['riscos', 'contingência', 'resumo executivo', 'sistema de acompanhamento'] },
];

function detectCurrentStage(messages: Message[]): number {
  if (messages.length === 0) return 1;
  
  const allContent = messages.map(m => m.content.toLowerCase()).join(' ');
  
  let highestStage = 1;
  
  for (const { stage, keywords } of STAGE_KEYWORDS) {
    const matchCount = keywords.filter(keyword => allContent.includes(keyword)).length;
    if (matchCount >= 2) {
      highestStage = Math.max(highestStage, stage);
    }
  }
  
  return highestStage;
}

function extractPlannerData(messages: Message[]): Partial<Planner> {
  const allContent = messages.map(m => m.content).join('\n');
  const data: Partial<Planner> = {};
  
  const faturamentoMatch = allContent.match(/faturamento[^\d]*(\d+[.,]?\d*)\s*(mil|k|reais|R\$)?/i);
  if (faturamentoMatch) {
    let value = parseFloat(faturamentoMatch[1].replace(',', '.'));
    if (faturamentoMatch[2]?.toLowerCase().includes('mil') || faturamentoMatch[2]?.toLowerCase() === 'k') {
      value *= 1000;
    }
    data.faturamento_mensal = value;
  }
  
  const margemMatch = allContent.match(/margem[^\d]*(\d+[.,]?\d*)\s*%/i);
  if (margemMatch) {
    data.margem_lucro = parseFloat(margemMatch[1].replace(',', '.'));
  }
  
  const ticketMatch = allContent.match(/ticket[^\d]*(\d+[.,]?\d*)/i);
  if (ticketMatch) {
    data.ticket_medio = parseFloat(ticketMatch[1].replace(',', '.'));
  }
  
  const nichoMatch = allContent.match(/nicho[:\s]+([^,.\n]+)/i);
  if (nichoMatch) {
    data.nicho = nichoMatch[1].trim().slice(0, 50);
  }
  
  return data;
}

export function PlannerIATab() {
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

  useEffect(() => {
    if (user) {
      fetchPlanners();
    }
  }, [user]);

  useEffect(() => {
    if (currentPlannerId) {
      fetchMessages(currentPlannerId);
      fetchPlannerData(currentPlannerId);
    } else {
      setMessages([]);
      setCurrentPlannerData(null);
    }
  }, [currentPlannerId]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [inputValue]);

  const updatePlannerProgress = useCallback(async (plannerId: string, msgs: Message[]) => {
    const newStage = detectCurrentStage(msgs);
    const extractedData = extractPlannerData(msgs);
    
    const updateData: Record<string, unknown> = {
      etapa_atual: newStage,
    };
    
    if (extractedData.nicho) updateData.nicho = extractedData.nicho;
    if (extractedData.faturamento_mensal) updateData.faturamento_mensal = extractedData.faturamento_mensal;
    if (extractedData.margem_lucro) updateData.margem_lucro = extractedData.margem_lucro;
    if (extractedData.ticket_medio) updateData.ticket_medio = extractedData.ticket_medio;
    
    await supabase
      .from('planner_2026')
      .update(updateData)
      .eq('id', plannerId);
    
    setPlanners(prev => prev.map(p => 
      p.id === plannerId ? { ...p, etapa_atual: newStage } : p
    ));
    
    fetchPlannerData(plannerId);
  }, []);

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

    const msgs = data?.map(m => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })) || [];
    setMessages(msgs);
    
    if (msgs.length > 0) {
      updatePlannerProgress(plannerId, msgs);
    }
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
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
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
        messages: newMessages,
        onDelta: upsertAssistant,
        onDone: async () => {
          await supabase.from('planner_2026_messages').insert({
            planner_id: currentPlannerId,
            user_id: user!.id,
            role: 'assistant',
            content: assistantContent
          });

          const currentPlanner = planners.find(p => p.id === currentPlannerId);
          if (!currentPlanner?.nome_empresa && userMessage.content.length > 0) {
            await supabase
              .from('planner_2026')
              .update({ nome_empresa: userMessage.content.slice(0, 50) })
              .eq('id', currentPlannerId);
          }

          const finalMessages = [...newMessages, { role: 'assistant' as const, content: assistantContent }];
          await updatePlannerProgress(currentPlannerId, finalMessages);
          
          fetchPlanners();
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

  const exportToPDF = async () => {
    if (!currentPlannerData || messages.length === 0) {
      toast.error('Nenhum conteúdo para exportar');
      return;
    }

    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = 20;

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

    doc.setDrawColor(200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

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
    <div className="h-full flex flex-col lg:flex-row gap-3 sm:gap-4">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-foreground text-sm sm:text-base truncate">
                      {currentPlanner?.nome_empresa || 'Novo Planejamento'}
                    </h2>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Assistido por IA
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowSummary(!showSummary)}
                    className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                  >
                    {showSummary ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    <span className="hidden sm:inline ml-1">Resumo</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportToPDF}
                    className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                  >
                    <Download className="h-3 w-3" />
                    <span className="hidden sm:inline ml-1">PDF</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setMessages([]);
                      sendInitialMessage(currentPlannerId);
                    }}
                    className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mt-3 sm:mt-4">
                <PlannerProgressIndicator etapaAtual={currentPlanner?.etapa_atual || 1} />
              </div>

              {/* Summary Panel */}
              <AnimatePresence>
                {showSummary && currentPlannerData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 sm:mt-4 overflow-hidden"
                  >
                    <PlannerSummary data={currentPlannerData} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-3 sm:p-4"
            >
              <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto pb-4">
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

            {/* Input */}
            <div className="flex-shrink-0 p-3 sm:p-4 border-t border-border/30 bg-[#1a1a1a]">
              <div className="flex gap-2 max-w-4xl mx-auto">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
                  disabled={isLoading}
                  className="flex-1 bg-[#242424] border-border/30 min-h-[40px] max-h-[120px] resize-none text-sm"
                  rows={1}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={isLoading || !inputValue.trim()}
                  className="h-10 w-10 sm:h-11 sm:w-auto sm:px-6 self-end"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground text-center mt-1.5 sm:mt-2">
                Enter para enviar • Shift+Enter para nova linha
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center">
            <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 sm:mb-6">
              <FileText className="h-7 w-7 sm:h-10 sm:w-10 text-primary" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-2">Planner IA</h2>
            <p className="text-xs sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md">
              Crie um planejamento estratégico completo para o seu e-commerce em 2026 com a ajuda de IA.
            </p>
            <Button onClick={createNewPlanner} disabled={isCreating} size="lg" className="h-10 sm:h-12">
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
