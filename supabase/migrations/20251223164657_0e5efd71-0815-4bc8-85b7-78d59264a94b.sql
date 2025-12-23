-- Criar tabela para planners manuais
CREATE TABLE public.planners_manuais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('anual', 'campanha')),
  conteudo JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.planners_manuais ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver seus próprios planners manuais"
ON public.planners_manuais
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios planners manuais"
ON public.planners_manuais
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios planners manuais"
ON public.planners_manuais
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios planners manuais"
ON public.planners_manuais
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_planners_manuais_updated_at
BEFORE UPDATE ON public.planners_manuais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();