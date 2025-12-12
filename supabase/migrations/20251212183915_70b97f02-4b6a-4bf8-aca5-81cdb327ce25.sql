-- Tabela para armazenar planejamentos 2026
CREATE TABLE public.planner_2026 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome_empresa TEXT,
  nicho TEXT,
  tempo_operacao TEXT,
  modelo_negocio TEXT,
  faturamento_mensal NUMERIC,
  margem_lucro NUMERIC,
  ticket_medio NUMERIC,
  cac_medio NUMERIC,
  margem_contribuicao NUMERIC,
  despesas_fixas NUMERIC,
  situacao_atual TEXT,
  cliente_ideal TEXT,
  dores_cliente TEXT,
  concorrentes_diretos TEXT,
  concorrentes_indiretos TEXT,
  tendencias_mercado TEXT,
  produtos_mais_vendidos TEXT,
  produtos_maior_margem TEXT,
  problemas_operacionais TEXT,
  tempo_medio_envio TEXT,
  taxa_devolucao NUMERIC,
  fornecedores TEXT,
  canais_marketing TEXT,
  resultados_trafego TEXT,
  canais_organicos TEXT,
  frequencia_conteudo TEXT,
  influenciadores TEXT,
  automacao_atual TEXT,
  diagnostico_interno JSONB DEFAULT '{}',
  diagnostico_externo JSONB DEFAULT '{}',
  swot JSONB DEFAULT '{}',
  metas_macro JSONB DEFAULT '[]',
  metas_smart JSONB DEFAULT '[]',
  kpis JSONB DEFAULT '[]',
  plano_acao JSONB DEFAULT '{}',
  responsaveis JSONB DEFAULT '[]',
  orcamento JSONB DEFAULT '{}',
  sistema_acompanhamento JSONB DEFAULT '{}',
  riscos JSONB DEFAULT '[]',
  resumo_executivo TEXT,
  etapa_atual INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.planner_2026 ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Usuários podem ver seus próprios planejamentos" 
ON public.planner_2026 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios planejamentos" 
ON public.planner_2026 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios planejamentos" 
ON public.planner_2026 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios planejamentos" 
ON public.planner_2026 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_planner_2026_updated_at
BEFORE UPDATE ON public.planner_2026
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para mensagens do chat
CREATE TABLE public.planner_2026_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  planner_id UUID NOT NULL REFERENCES public.planner_2026(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.planner_2026_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Usuários podem ver mensagens de seus planejamentos" 
ON public.planner_2026_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar mensagens em seus planejamentos" 
ON public.planner_2026_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar mensagens de seus planejamentos" 
ON public.planner_2026_messages 
FOR DELETE 
USING (auth.uid() = user_id);