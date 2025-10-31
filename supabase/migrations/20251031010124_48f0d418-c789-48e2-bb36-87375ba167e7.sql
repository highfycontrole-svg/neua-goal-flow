-- Criar tabela de setores
CREATE TABLE public.setores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir setores padrão
INSERT INTO public.setores (nome) VALUES 
  ('Vendas'),
  ('Marketing'),
  ('Financeiro'),
  ('Operações'),
  ('Recursos Humanos'),
  ('Tecnologia');

-- Criar tabela de super_metas
CREATE TABLE public.super_metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  valor_meta DECIMAL(15,2) NOT NULL,
  valor_realizado DECIMAL(15,2) NOT NULL DEFAULT 0,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL CHECK (ano >= 2020 AND ano <= 2100),
  setor_id UUID NOT NULL REFERENCES public.setores(id) ON DELETE RESTRICT,
  status BOOLEAN NOT NULL DEFAULT false,
  prioridade TEXT NOT NULL DEFAULT 'Média' CHECK (prioridade IN ('Alta', 'Média', 'Baixa')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de metas
CREATE TABLE public.metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  super_meta_id UUID REFERENCES public.super_metas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  valor_meta DECIMAL(15,2) NOT NULL,
  valor_realizado DECIMAL(15,2) NOT NULL DEFAULT 0,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL CHECK (ano >= 2020 AND ano <= 2100),
  setor_id UUID NOT NULL REFERENCES public.setores(id) ON DELETE RESTRICT,
  status BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para setores (público para leitura)
CREATE POLICY "Setores são visíveis para todos usuários autenticados"
  ON public.setores FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Políticas RLS para super_metas
CREATE POLICY "Usuários podem ver suas próprias super metas"
  ON public.super_metas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias super metas"
  ON public.super_metas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias super metas"
  ON public.super_metas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias super metas"
  ON public.super_metas FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para metas
CREATE POLICY "Usuários podem ver suas próprias metas"
  ON public.metas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias metas"
  ON public.metas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias metas"
  ON public.metas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias metas"
  ON public.metas FOR DELETE
  USING (auth.uid() = user_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_super_metas_updated_at
  BEFORE UPDATE ON public.super_metas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_metas_updated_at
  BEFORE UPDATE ON public.metas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_super_metas_user_id ON public.super_metas(user_id);
CREATE INDEX idx_super_metas_setor_id ON public.super_metas(setor_id);
CREATE INDEX idx_super_metas_ano_mes ON public.super_metas(ano, mes);
CREATE INDEX idx_metas_user_id ON public.metas(user_id);
CREATE INDEX idx_metas_super_meta_id ON public.metas(super_meta_id);
CREATE INDEX idx_metas_setor_id ON public.metas(setor_id);
CREATE INDEX idx_metas_ano_mes ON public.metas(ano, mes);