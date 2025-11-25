-- Criar tabela de workspaces
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para workspaces
CREATE POLICY "Usuários podem ver seus próprios workspaces"
ON public.workspaces FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios workspaces"
ON public.workspaces FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios workspaces"
ON public.workspaces FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios workspaces"
ON public.workspaces FOR DELETE
USING (auth.uid() = user_id);

-- Criar tabela de status personalizados
CREATE TABLE public.workspace_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.workspace_statuses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para status
CREATE POLICY "Usuários podem ver status de seus workspaces"
ON public.workspace_statuses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.workspaces 
  WHERE workspaces.id = workspace_statuses.workspace_id 
  AND workspaces.user_id = auth.uid()
));

CREATE POLICY "Usuários podem criar status em seus workspaces"
ON public.workspace_statuses FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workspaces 
  WHERE workspaces.id = workspace_statuses.workspace_id 
  AND workspaces.user_id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar status de seus workspaces"
ON public.workspace_statuses FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.workspaces 
  WHERE workspaces.id = workspace_statuses.workspace_id 
  AND workspaces.user_id = auth.uid()
));

CREATE POLICY "Usuários podem deletar status de seus workspaces"
ON public.workspace_statuses FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.workspaces 
  WHERE workspaces.id = workspace_statuses.workspace_id 
  AND workspaces.user_id = auth.uid()
));

-- Criar tabela de tasks
CREATE TABLE public.workspace_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status_id UUID REFERENCES public.workspace_statuses(id) ON DELETE SET NULL,
  date DATE,
  notes TEXT,
  responsible TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.workspace_tasks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tasks
CREATE POLICY "Usuários podem ver tasks de seus workspaces"
ON public.workspace_tasks FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.workspaces 
  WHERE workspaces.id = workspace_tasks.workspace_id 
  AND workspaces.user_id = auth.uid()
));

CREATE POLICY "Usuários podem criar tasks em seus workspaces"
ON public.workspace_tasks FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workspaces 
  WHERE workspaces.id = workspace_tasks.workspace_id 
  AND workspaces.user_id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar tasks de seus workspaces"
ON public.workspace_tasks FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.workspaces 
  WHERE workspaces.id = workspace_tasks.workspace_id 
  AND workspaces.user_id = auth.uid()
));

CREATE POLICY "Usuários podem deletar tasks de seus workspaces"
ON public.workspace_tasks FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.workspaces 
  WHERE workspaces.id = workspace_tasks.workspace_id 
  AND workspaces.user_id = auth.uid()
));

-- Criar tabela de subtasks
CREATE TABLE public.workspace_subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.workspace_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.workspace_subtasks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para subtasks
CREATE POLICY "Usuários podem ver subtasks de tasks de seus workspaces"
ON public.workspace_subtasks FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.workspace_tasks 
  JOIN public.workspaces ON workspaces.id = workspace_tasks.workspace_id
  WHERE workspace_tasks.id = workspace_subtasks.task_id 
  AND workspaces.user_id = auth.uid()
));

CREATE POLICY "Usuários podem criar subtasks em tasks de seus workspaces"
ON public.workspace_subtasks FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workspace_tasks 
  JOIN public.workspaces ON workspaces.id = workspace_tasks.workspace_id
  WHERE workspace_tasks.id = workspace_subtasks.task_id 
  AND workspaces.user_id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar subtasks de tasks de seus workspaces"
ON public.workspace_subtasks FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.workspace_tasks 
  JOIN public.workspaces ON workspaces.id = workspace_tasks.workspace_id
  WHERE workspace_tasks.id = workspace_subtasks.task_id 
  AND workspaces.user_id = auth.uid()
));

CREATE POLICY "Usuários podem deletar subtasks de tasks de seus workspaces"
ON public.workspace_subtasks FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.workspace_tasks 
  JOIN public.workspaces ON workspaces.id = workspace_tasks.workspace_id
  WHERE workspace_tasks.id = workspace_subtasks.task_id 
  AND workspaces.user_id = auth.uid()
));

-- Criar trigger para atualizar updated_at em workspaces
CREATE TRIGGER update_workspaces_updated_at
BEFORE UPDATE ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar trigger para atualizar updated_at em tasks
CREATE TRIGGER update_workspace_tasks_updated_at
BEFORE UPDATE ON public.workspace_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();