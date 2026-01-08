-- Add new columns for delivery time and logistics quality
ALTER TABLE public.pedidos
ADD COLUMN prazo_entrega integer DEFAULT NULL,
ADD COLUMN status_entrega text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.pedidos.prazo_entrega IS 'Prazo de entrega em dias';
COMMENT ON COLUMN public.pedidos.status_entrega IS 'Qualidade logística: Excelente, Prazo, Ruim, Péssimo';