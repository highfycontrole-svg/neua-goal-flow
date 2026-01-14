-- Add time fields to planner_eventos table
ALTER TABLE public.planner_eventos 
ADD COLUMN hora_inicio TIME DEFAULT NULL,
ADD COLUMN duracao_minutos INTEGER DEFAULT NULL;