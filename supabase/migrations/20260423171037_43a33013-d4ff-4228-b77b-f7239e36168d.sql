-- Create gravacoes table
CREATE TABLE public.gravacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  link_arquivo TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  origem TEXT NOT NULL DEFAULT 'manual',
  origem_id TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gravacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own gravacoes"
  ON public.gravacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own gravacoes"
  ON public.gravacoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gravacoes"
  ON public.gravacoes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gravacoes"
  ON public.gravacoes FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_gravacoes_updated_at
  BEFORE UPDATE ON public.gravacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_gravacoes_user_id ON public.gravacoes(user_id);
CREATE INDEX idx_gravacoes_origem ON public.gravacoes(origem, origem_id);

-- Add precisa_gravar to workspace_tasks
ALTER TABLE public.workspace_tasks
  ADD COLUMN precisa_gravar TEXT DEFAULT 'nao_precisa';