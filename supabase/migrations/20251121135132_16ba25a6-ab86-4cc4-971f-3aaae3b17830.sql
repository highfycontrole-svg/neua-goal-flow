-- Criar enums para os campos de seleção
CREATE TYPE public.tier_classificacao AS ENUM ('Bronze', 'Prata', 'Ouro', 'Platina');
CREATE TYPE public.status_arquiteto AS ENUM ('Ativo', 'Em Análise', 'Pausado', 'Desligado');
CREATE TYPE public.status_pagamento AS ENUM ('Pendente', 'Pago', 'Em Revisão');
CREATE TYPE public.status_conteudo AS ENUM ('Entregue', 'Pendente', 'Atrasado', 'Não Aplicável');
CREATE TYPE public.status_envio AS ENUM ('Enviado', 'Em Trânsito', 'Entregue', 'Problema');
CREATE TYPE public.tipo_envio AS ENUM ('Kit Trimestral', 'Lançamento', 'Evento Especial', 'Boas-Vindas');
CREATE TYPE public.tipo_interacao AS ENUM ('E-mail', 'Ligação', 'WhatsApp', 'Reunião', 'Feedback');

-- Tabela de Arquitetos (Perfis)
CREATE TABLE public.arquitetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  arroba_principal TEXT,
  email_contato TEXT,
  telefone_contato TEXT,
  endereco_completo TEXT,
  links_redes_sociais JSONB DEFAULT '[]'::jsonb,
  data_entrada_club DATE,
  seguidores_entrada INTEGER,
  cupom_exclusivo TEXT,
  classificacao_tier tier_classificacao DEFAULT 'Bronze',
  condicao_obrigacao_conteudo TEXT,
  produto_boas_vindas_enviado TEXT,
  data_envio_boas_vindas DATE,
  status_arquiteto status_arquiteto DEFAULT 'Ativo',
  notas_internas TEXT,
  link_contrato_assinado TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Desempenho Financeiro
CREATE TABLE public.desempenho_financeiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  arquiteto_id UUID NOT NULL REFERENCES public.arquitetos(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  vendas_pedidos INTEGER DEFAULT 0,
  valor_total_vendido DECIMAL(10,2) DEFAULT 0,
  ticket_medio DECIMAL(10,2) DEFAULT 0,
  taxa_conversao_cupom DECIMAL(5,2),
  comissao_base DECIMAL(10,2) DEFAULT 0,
  comissao_escalavel DECIMAL(10,2) DEFAULT 0,
  comissao_total_a_pagar DECIMAL(10,2) DEFAULT 0,
  status_pagamento status_pagamento DEFAULT 'Pendente',
  data_pagamento DATE,
  historico_classificacao_tier JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(arquiteto_id, mes_referencia)
);

-- Tabela de Logística e Conteúdo
CREATE TABLE public.logistica_conteudo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  arquiteto_id UUID NOT NULL REFERENCES public.arquitetos(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  obrigacao_conteudo_mensal TEXT,
  status_reel status_conteudo DEFAULT 'Pendente',
  link_reel TEXT,
  status_stories status_conteudo DEFAULT 'Pendente',
  links_stories TEXT,
  qualidade_conteudo_avaliacao INTEGER CHECK (qualidade_conteudo_avaliacao >= 1 AND qualidade_conteudo_avaliacao <= 5),
  observacoes_conteudo TEXT,
  cupom_mencionado_conteudo BOOLEAN DEFAULT false,
  data_ultimo_envio_produto DATE,
  proxima_data_envio_programada DATE,
  tipo_envio tipo_envio,
  produtos_enviados_sku TEXT,
  data_envio_efetiva DATE,
  codigo_rastreio TEXT,
  status_envio status_envio,
  confirmacao_recebimento BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(arquiteto_id, mes_referencia)
);

-- Tabela de Histórico de Interações
CREATE TABLE public.interacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  arquiteto_id UUID NOT NULL REFERENCES public.arquitetos(id) ON DELETE CASCADE,
  data_interacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tipo_interacao tipo_interacao NOT NULL,
  assunto_motivo TEXT,
  resumo_interacao TEXT,
  responsavel_interacao TEXT,
  proxima_acao_follow_up TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.arquitetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desempenho_financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistica_conteudo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para arquitetos
CREATE POLICY "Usuários podem ver seus próprios arquitetos"
  ON public.arquitetos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios arquitetos"
  ON public.arquitetos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios arquitetos"
  ON public.arquitetos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios arquitetos"
  ON public.arquitetos FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para desempenho_financeiro
CREATE POLICY "Usuários podem ver seu próprio desempenho financeiro"
  ON public.desempenho_financeiro FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seu próprio desempenho financeiro"
  ON public.desempenho_financeiro FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio desempenho financeiro"
  ON public.desempenho_financeiro FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seu próprio desempenho financeiro"
  ON public.desempenho_financeiro FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para logistica_conteudo
CREATE POLICY "Usuários podem ver sua própria logística de conteúdo"
  ON public.logistica_conteudo FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar sua própria logística de conteúdo"
  ON public.logistica_conteudo FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar sua própria logística de conteúdo"
  ON public.logistica_conteudo FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar sua própria logística de conteúdo"
  ON public.logistica_conteudo FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para interacoes
CREATE POLICY "Usuários podem ver suas próprias interações"
  ON public.interacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias interações"
  ON public.interacoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias interações"
  ON public.interacoes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias interações"
  ON public.interacoes FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_arquitetos_updated_at
  BEFORE UPDATE ON public.arquitetos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_desempenho_financeiro_updated_at
  BEFORE UPDATE ON public.desempenho_financeiro
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_logistica_conteudo_updated_at
  BEFORE UPDATE ON public.logistica_conteudo
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();