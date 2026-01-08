-- Create receitas (income) table
CREATE TABLE public.receitas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  origem TEXT NOT NULL DEFAULT 'E-commerce Neua',
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
  valor_bruto NUMERIC NOT NULL DEFAULT 0,
  taxas NUMERIC NOT NULL DEFAULT 0,
  valor_liquido NUMERIC GENERATED ALWAYS AS (valor_bruto - taxas) STORED,
  forma_recebimento TEXT,
  status TEXT NOT NULL DEFAULT 'a_receber',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create despesas (expenses) table
CREATE TABLE public.despesas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  descricao TEXT,
  valor NUMERIC NOT NULL DEFAULT 0,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  forma_pagamento TEXT,
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
  canal TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketing_campanhas (paid traffic campaigns) table
CREATE TABLE public.marketing_campanhas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plataforma TEXT NOT NULL,
  nome_campanha TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  investimento NUMERIC NOT NULL DEFAULT 0,
  pedidos_gerados INTEGER NOT NULL DEFAULT 0,
  receita_gerada NUMERIC NOT NULL DEFAULT 0,
  roas NUMERIC GENERATED ALWAYS AS (CASE WHEN investimento > 0 THEN receita_gerada / investimento ELSE 0 END) STORED,
  cpa NUMERIC GENERATED ALWAYS AS (CASE WHEN pedidos_gerados > 0 THEN investimento / pedidos_gerados ELSE 0 END) STORED,
  status TEXT NOT NULL DEFAULT 'ativa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketing_influenciadores table
CREATE TABLE public.marketing_influenciadores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  plataforma TEXT NOT NULL,
  tipo_pagamento TEXT NOT NULL DEFAULT 'fixo',
  custo NUMERIC NOT NULL DEFAULT 0,
  pedidos_gerados INTEGER NOT NULL DEFAULT 0,
  receita_gerada NUMERIC NOT NULL DEFAULT 0,
  roi NUMERIC GENERATED ALWAYS AS (CASE WHEN custo > 0 THEN (receita_gerada - custo) / custo * 100 ELSE 0 END) STORED,
  custo_por_pedido NUMERIC GENERATED ALWAYS AS (CASE WHEN pedidos_gerados > 0 THEN custo / pedidos_gerados ELSE 0 END) STORED,
  data_inicio DATE,
  data_fim DATE,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create produtos_financeiro (product cost/margin tracking) table
CREATE TABLE public.produtos_financeiro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE,
  sku TEXT,
  tipo TEXT NOT NULL DEFAULT 'estoque_proprio',
  custo_unitario NUMERIC NOT NULL DEFAULT 0,
  fornecedor TEXT,
  custo_logistico_medio NUMERIC NOT NULL DEFAULT 0,
  preco_venda NUMERIC NOT NULL DEFAULT 0,
  margem_produto NUMERIC GENERATED ALWAYS AS (CASE WHEN preco_venda > 0 THEN ((preco_venda - custo_unitario - custo_logistico_medio) / preco_venda) * 100 ELSE 0 END) STORED,
  prazo_medio_dias INTEGER,
  taxa_problema NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fluxo_caixa (cash flow projections) table
CREATE TABLE public.fluxo_caixa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data DATE NOT NULL,
  tipo TEXT NOT NULL,
  categoria TEXT,
  descricao TEXT,
  valor NUMERIC NOT NULL DEFAULT 0,
  realizado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_influenciadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluxo_caixa ENABLE ROW LEVEL SECURITY;

-- RLS policies for receitas
CREATE POLICY "Usuários podem ver suas próprias receitas" ON public.receitas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar suas próprias receitas" ON public.receitas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas próprias receitas" ON public.receitas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas próprias receitas" ON public.receitas FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for despesas
CREATE POLICY "Usuários podem ver suas próprias despesas" ON public.despesas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar suas próprias despesas" ON public.despesas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas próprias despesas" ON public.despesas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas próprias despesas" ON public.despesas FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for marketing_campanhas
CREATE POLICY "Usuários podem ver suas próprias campanhas" ON public.marketing_campanhas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar suas próprias campanhas" ON public.marketing_campanhas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas próprias campanhas" ON public.marketing_campanhas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas próprias campanhas" ON public.marketing_campanhas FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for marketing_influenciadores
CREATE POLICY "Usuários podem ver seus próprios influenciadores" ON public.marketing_influenciadores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar seus próprios influenciadores" ON public.marketing_influenciadores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus próprios influenciadores" ON public.marketing_influenciadores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus próprios influenciadores" ON public.marketing_influenciadores FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for produtos_financeiro
CREATE POLICY "Usuários podem ver seus próprios produtos financeiros" ON public.produtos_financeiro FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar seus próprios produtos financeiros" ON public.produtos_financeiro FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus próprios produtos financeiros" ON public.produtos_financeiro FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus próprios produtos financeiros" ON public.produtos_financeiro FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for fluxo_caixa
CREATE POLICY "Usuários podem ver seu próprio fluxo de caixa" ON public.fluxo_caixa FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar seu próprio fluxo de caixa" ON public.fluxo_caixa FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seu próprio fluxo de caixa" ON public.fluxo_caixa FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seu próprio fluxo de caixa" ON public.fluxo_caixa FOR DELETE USING (auth.uid() = user_id);