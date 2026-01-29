import { useState } from 'react';
import { Node } from '@xyflow/react';
import { Sparkles, Send, Loader2, X, Lightbulb, Target, AlertTriangle, Layers } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MindOsCopilotProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: Node[];
  projectType: 'mindmap' | 'flowchart';
  onAddNode?: (type: 'idea' | 'task' | 'text') => void;
}

const suggestedPrompts = [
  { icon: Lightbulb, label: 'Sugerir conexões', prompt: 'Analise os nós atuais e sugira conexões que podem estar faltando.' },
  { icon: Target, label: 'Identificar lacunas', prompt: 'Quais são as lacunas ou pontos cegos neste mapa?' },
  { icon: AlertTriangle, label: 'Encontrar redundâncias', prompt: 'Existem ideias redundantes ou duplicadas que podem ser consolidadas?' },
  { icon: Layers, label: 'Agrupar por tema', prompt: 'Como posso agrupar esses elementos por temas ou categorias?' },
];

export function MindOsCopilot({ open, onOpenChange, nodes, projectType, onAddNode }: MindOsCopilotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getNodesSummary = () => {
    return nodes.map(node => {
      const data = node.data as any;
      return {
        id: node.id,
        label: data.label || 'Sem título',
        type: data.nodeType || data.iconName || 'unknown',
      };
    });
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const nodesSummary = getNodesSummary();
      const systemPrompt = projectType === 'mindmap' 
        ? `Você é um assistente especializado em mapas mentais e pensamento visual. 
           Ajude o usuário a organizar suas ideias, identificar conexões, encontrar lacunas e melhorar a estrutura do mapa.
           Os nós atuais do mapa são: ${JSON.stringify(nodesSummary)}`
        : `Você é um assistente especializado em funis de marketing e flowcharts.
           Ajude o usuário a otimizar seu funil, identificar pontos de conversão, sugerir melhorias e analisar a jornada do cliente.
           Os blocos atuais do flowchart são: ${JSON.stringify(nodesSummary)}`;

      const response = await supabase.functions.invoke('planner-chat', {
        body: {
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content },
          ],
        },
      });

      if (response.error) throw response.error;

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: response.data?.message || 'Desculpe, não consegui processar sua solicitação.' 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Copilot error:', error);
      toast.error('Erro ao processar solicitação');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#242424] border-border/30 max-w-2xl h-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            MindOs Copilot
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages */}
          <ScrollArea className="flex-1 pr-4">
            {messages.length === 0 ? (
              <div className="py-8 text-center">
                <Sparkles className="h-12 w-12 text-purple-400/50 mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">Olá! Sou seu Copilot</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Posso ajudar você a analisar, organizar e melhorar seu {projectType === 'mindmap' ? 'mapa mental' : 'flowchart'}.
                </p>
                
                {/* Suggested prompts */}
                <div className="grid grid-cols-2 gap-2">
                  {suggestedPrompts.map((prompt, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleSuggestedPrompt(prompt.prompt)}
                      className="flex items-center gap-2 p-3 rounded-lg bg-[#161616] hover:bg-primary/10 transition-colors text-left group"
                    >
                      <prompt.icon className="h-4 w-4 text-purple-400 group-hover:text-primary" />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground">
                        {prompt.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <AnimatePresence>
                  {messages.map((message, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-[#161616] text-foreground'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm prose-invert max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-[#161616] rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="flex-shrink-0 pt-4 border-t border-border/30">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Pergunte algo sobre seu mapa..."
                className="flex-1 bg-[#161616] border-border/30 resize-none min-h-[44px] max-h-[120px]"
                rows={1}
              />
              <Button 
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
