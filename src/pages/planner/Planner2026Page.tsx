import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Send, Loader2, Trash2, FileText, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PlannerChatMessage } from '@/components/planner/PlannerChatMessage';
import { PlannerSidebar } from '@/components/planner/PlannerSidebar';
import { motion, AnimatePresence } from 'framer-motion';

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
};

export default function Planner2026Page() {
  const { user } = useAuth();
  const [planners, setPlanners] = useState<Planner[]>([]);
  const [currentPlannerId, setCurrentPlannerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch planners
  useEffect(() => {
    if (user) {
      fetchPlanners();
    }
  }, [user]);

  // Fetch messages when planner changes
  useEffect(() => {
    if (currentPlannerId) {
      fetchMessages(currentPlannerId);
    } else {
      setMessages([]);
    }
  }, [currentPlannerId]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    
    // Send initial message to start conversation
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
          // Save assistant message
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

    // Save user message
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
          // Save assistant message
          await supabase.from('planner_2026_messages').insert({
            planner_id: currentPlannerId,
            user_id: user!.id,
            role: 'assistant',
            content: assistantContent
          });

          // Update planner name if empresa mentioned
          if (assistantContent.length > 0 && userMessage.content.length > 0) {
            const currentPlanner = planners.find(p => p.id === currentPlannerId);
            if (!currentPlanner?.nome_empresa) {
              // Check if user mentioned empresa name
              const empresaMatch = userMessage.content.match(/(?:empresa|negócio|loja|marca)?\s*(?:é|chama|chamamos)?\s*(.+)/i);
              if (empresaMatch) {
                await supabase
                  .from('planner_2026')
                  .update({ nome_empresa: userMessage.content.slice(0, 50) })
                  .eq('id', currentPlannerId);
                fetchPlanners();
              }
            }
          }

          setIsLoading(false);
          inputRef.current?.focus();
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

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* Sidebar */}
      <PlannerSidebar
        planners={planners}
        currentPlannerId={currentPlannerId}
        onSelectPlanner={setCurrentPlannerId}
        onCreatePlanner={createNewPlanner}
        onDeletePlanner={deletePlanner}
        isCreating={isCreating}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#161616] rounded-2xl overflow-hidden">
        {currentPlannerId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border/30 bg-[#1a1a1a]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">
                      {planners.find(p => p.id === currentPlannerId)?.nome_empresa || 'Novo Planejamento'}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Etapa {planners.find(p => p.id === currentPlannerId)?.etapa_atual || 1} de 8
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setMessages([]);
                      sendInitialMessage(currentPlannerId);
                    }}
                    className="text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Reiniciar
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-4xl mx-auto">
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
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border/30 bg-[#1a1a1a]">
              <div className="flex gap-3 max-w-4xl mx-auto">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  disabled={isLoading}
                  className="flex-1 bg-[#242424] border-border/30 h-12"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={isLoading || !inputValue.trim()}
                  className="h-12 px-6"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="h-20 w-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Planner Neua 2026</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
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
