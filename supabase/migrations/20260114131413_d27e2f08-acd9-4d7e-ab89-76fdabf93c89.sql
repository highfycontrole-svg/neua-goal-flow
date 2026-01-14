-- Create table for planner calendar events
CREATE TABLE public.planner_eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'planejado',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for planner ideas
CREATE TABLE public.planner_ideias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  tipo_customizado VARCHAR(100),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  qualidade VARCHAR(20) NOT NULL DEFAULT 'boa',
  status VARCHAR(20) NOT NULL DEFAULT 'nao_feita',
  resultado VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.planner_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_ideias ENABLE ROW LEVEL SECURITY;

-- RLS Policies for planner_eventos
CREATE POLICY "Users can view their own events"
ON public.planner_eventos
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events"
ON public.planner_eventos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
ON public.planner_eventos
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
ON public.planner_eventos
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for planner_ideias
CREATE POLICY "Users can view their own ideas"
ON public.planner_ideias
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ideas"
ON public.planner_ideias
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ideas"
ON public.planner_ideias
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ideas"
ON public.planner_ideias
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at on planner_eventos
CREATE TRIGGER update_planner_eventos_updated_at
BEFORE UPDATE ON public.planner_eventos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on planner_ideias
CREATE TRIGGER update_planner_ideias_updated_at
BEFORE UPDATE ON public.planner_ideias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();