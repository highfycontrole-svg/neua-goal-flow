-- Adicionar coluna prioridade em metas
ALTER TABLE public.metas 
ADD COLUMN IF NOT EXISTS prioridade text NOT NULL DEFAULT 'Média';

-- Adicionar constraint para validar valores de prioridade
ALTER TABLE public.metas 
ADD CONSTRAINT metas_prioridade_check 
CHECK (prioridade IN ('Alta', 'Média', 'Baixa'));