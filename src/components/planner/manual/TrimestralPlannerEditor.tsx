import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Target, Zap, CheckCircle2, CalendarDays, BarChart3,
  Flag, Trophy, AlertTriangle, Users, Megaphone, ShoppingCart,
  Settings, DollarSign, Package, UserCheck, Link2, User,
} from 'lucide-react';

type Quarter = 'q1' | 'q2' | 'q3' | 'q4';

const QUARTERS: { id: Quarter; label: string; months: { key: string; name: string }[] }[] = [
  { id: 'q1', label: 'Q1 2026', months: [
    { key: 'jan', name: 'Janeiro' }, { key: 'fev', name: 'Fevereiro' }, { key: 'mar', name: 'Março' },
  ]},
  { id: 'q2', label: 'Q2 2026', months: [
    { key: 'abr', name: 'Abril' }, { key: 'mai', name: 'Maio' }, { key: 'jun', name: 'Junho' },
  ]},
  { id: 'q3', label: 'Q3 2026', months: [
    { key: 'jul', name: 'Julho' }, { key: 'ago', name: 'Agosto' }, { key: 'set', name: 'Setembro' },
  ]},
  { id: 'q4', label: 'Q4 2026', months: [
    { key: 'out', name: 'Outubro' }, { key: 'nov', name: 'Novembro' }, { key: 'dez', name: 'Dezembro' },
  ]},
];

const ACTION_AREAS = [
  { key: 'marketing', label: 'Marketing', icon: Megaphone, placeholder: 'Ações de marketing planejadas para o trimestre...' },
  { key: 'vendas', label: 'Vendas', icon: ShoppingCart, placeholder: 'Metas e ações de vendas...' },
  { key: 'operacional', label: 'Operacional', icon: Settings, placeholder: 'Processos, logística, melhorias operacionais...' },
  { key: 'financeiro', label: 'Financeiro', icon: DollarSign, placeholder: 'Controle de caixa, investimentos, metas financeiras...' },
  { key: 'produto', label: 'Produto', icon: Package, placeholder: 'Desenvolvimento, lançamentos, melhorias de produto...' },
  { key: 'equipe', label: 'Equipe', icon: UserCheck, placeholder: 'Contratações, treinamentos, gestão de pessoas...' },
];

interface TrimestralPlannerEditorProps {
  content: Record<string, any>;
  onContentChange: (key: string, value: any) => void;
}

export function TrimestralPlannerEditor({ content, onContentChange }: TrimestralPlannerEditorProps) {
  const [activeQ, setActiveQ] = useState<Quarter>('q1');

  const getVal = useCallback((field: string): string => {
    return (content[activeQ] as any)?.[field] || '';
  }, [content, activeQ]);

  const setVal = useCallback((field: string, value: string) => {
    const qContent = { ...(content[activeQ] as any || {}), [field]: value };
    onContentChange(activeQ, qContent);
  }, [content, activeQ, onContentChange]);

  const qIndex = QUARTERS.findIndex(q => q.id === activeQ);
  const currentQ = QUARTERS[qIndex];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Quarter Tabs */}
      <div className="flex-shrink-0 px-4 sm:px-6 pt-4">
        <div className="flex gap-2 p-1 bg-[#161616] rounded-xl border border-border/30">
          {QUARTERS.map((q) => (
            <button
              key={q.id}
              onClick={() => setActiveQ(q.id)}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                activeQ === q.id
                  ? 'bg-primary/20 text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              )}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
          {/* S1 - Visão do Trimestre */}
          <Section index={0} title="Visão do Trimestre">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SectionCard icon={Target} label={`Qual é a Prioridade Nº1 do ${currentQ.label}?`}>
                <Input
                  value={getVal('prioridade_1')}
                  onChange={e => setVal('prioridade_1', e.target.value)}
                  placeholder="Ex: Atingir R$50k de faturamento"
                  className="bg-[#161616] border-border/30 focus:border-primary/50"
                />
              </SectionCard>
              <SectionCard icon={Zap} label={`O ${currentQ.label} é tempo de:`}>
                <Input
                  value={getVal('tempo_de')}
                  onChange={e => setVal('tempo_de', e.target.value)}
                  placeholder="Ex: Escala, consolidação, experimentação..."
                  className="bg-[#161616] border-border/30 focus:border-primary/50"
                />
              </SectionCard>
            </div>
          </Section>

          {/* S2 - Definição de Sucesso */}
          <Section index={1} title="Definição de Sucesso">
            <SectionCard icon={CheckCircle2} label={`O que caracteriza um ${currentQ.label} de sucesso para a Neua?`}>
              <Textarea
                value={getVal('definicao_sucesso')}
                onChange={e => setVal('definicao_sucesso', e.target.value)}
                placeholder="Descreva os resultados e marcos que, ao final do trimestre, representariam sucesso real..."
                className="min-h-[100px] bg-[#161616] border-border/30 focus:border-primary/50 resize-none"
              />
            </SectionCard>
          </Section>

          {/* S3 - Calendário */}
          <Section index={2} title={`Calendário ${currentQ.label}`}>
            <SectionCard icon={CalendarDays} label="Eventos e marcos por mês">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {currentQ.months.map(m => (
                  <div key={m.key} className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{m.name}</label>
                    <Textarea
                      value={getVal(`calendario_${m.key}`)}
                      onChange={e => setVal(`calendario_${m.key}`, e.target.value)}
                      placeholder="Principais eventos, lançamentos e marcos..."
                      className="min-h-[80px] bg-[#161616] border-border/30 focus:border-primary/50 resize-none text-sm"
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          </Section>

          {/* S4 - KPIs */}
          <Section index={3} title={`KPIs ${currentQ.label}`}>
            <SectionCard icon={BarChart3} label="Indicadores principais">
              <Textarea
                value={getVal('kpis')}
                onChange={e => setVal('kpis', e.target.value)}
                placeholder={"Liste os KPIs principais:\n• Faturamento: R$ ___\n• ROI: ___\n• Novos clientes: ___\n• CAC: R$ ___\n• Taxa de conversão: ___"}
                className="min-h-[120px] bg-[#161616] border-border/30 focus:border-primary/50 resize-none"
              />
            </SectionCard>
          </Section>

          {/* S5 - Metas */}
          <Section index={4} title="Metas e Super Metas">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SectionCard icon={Flag} label={`Metas ${currentQ.label}`}>
                <Textarea
                  value={getVal('metas')}
                  onChange={e => setVal('metas', e.target.value)}
                  placeholder="Metas mensuráveis para o trimestre..."
                  className="min-h-[120px] bg-[#161616] border-border/30 focus:border-primary/50 resize-none"
                />
              </SectionCard>
              <div className="rounded-xl border border-yellow-500/30 bg-[#1a1a1a] p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-foreground">Super Meta {currentQ.label}</span>
                </div>
                <Textarea
                  value={getVal('super_meta')}
                  onChange={e => setVal('super_meta', e.target.value)}
                  placeholder="A super meta que, se atingida, muda o jogo. Seja audacioso."
                  className="min-h-[120px] bg-[#161616] border-border/30 focus:border-primary/50 resize-none"
                />
              </div>
            </div>
          </Section>

          {/* S6 - Riscos */}
          <Section index={5} title={`Riscos e Contingência ${currentQ.label}`}>
            <div className="rounded-xl border border-orange-500/20 bg-[#1a1a1a] p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-semibold text-foreground">Riscos e Contingência</span>
              </div>
              <Textarea
                value={getVal('riscos')}
                onChange={e => setVal('riscos', e.target.value)}
                placeholder="Identifique os principais riscos do trimestre e os planos de contingência para cada um..."
                className="min-h-[120px] bg-[#161616] border-border/30 focus:border-primary/50 resize-none"
              />
            </div>
          </Section>

          {/* S7 - Plano de Ação por Área */}
          <Section index={6} title="Plano de Ação + Responsabilidade" icon={Users}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ACTION_AREAS.map(area => (
                <SectionCard key={area.key} icon={area.icon} label={area.label}>
                  <Textarea
                    value={getVal(`acao_${area.key}`)}
                    onChange={e => setVal(`acao_${area.key}`, e.target.value)}
                    placeholder={area.placeholder}
                    className="min-h-[100px] bg-[#161616] border-border/30 focus:border-primary/50 resize-none text-sm"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={getVal(`resp_${area.key}`)}
                      onChange={e => setVal(`resp_${area.key}`, e.target.value)}
                      placeholder="Responsável"
                      className="bg-[#161616] border-border/30 focus:border-primary/50 h-8 text-sm"
                    />
                  </div>
                </SectionCard>
              ))}
            </div>
          </Section>

          {/* S8 - Links */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 7 * 0.04 }}
          >
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Atividades Vinculadas</span>
              </div>
              <p className="text-xs text-muted-foreground">
                As tarefas do Workspace e as Metas cadastradas na aba Metas são automaticamente conectadas ao planejamento deste trimestre.
              </p>
              <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                Em breve · Integração automática
              </span>
            </div>
          </motion.div>
        </div>
      </ScrollArea>
    </div>
  );
}

function Section({ children, index, title, icon: Icon }: { children: React.ReactNode; index: number; title: string; icon?: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function SectionCard({ children, icon: Icon, label }: { children: React.ReactNode; icon: any; label: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-[#1a1a1a] p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      </div>
      {children}
    </div>
  );
}
