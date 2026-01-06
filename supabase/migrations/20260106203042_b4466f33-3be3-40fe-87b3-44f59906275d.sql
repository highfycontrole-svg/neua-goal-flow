-- Create pedidos table for order tracking
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  numero_pedido TEXT NOT NULL,
  codigos_rastreio TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'Aguardando Envio',
  transportadora TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Usuários podem ver seus próprios pedidos" 
ON public.pedidos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios pedidos" 
ON public.pedidos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios pedidos" 
ON public.pedidos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios pedidos" 
ON public.pedidos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pedidos_updated_at
BEFORE UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();