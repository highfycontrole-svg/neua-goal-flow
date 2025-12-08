
-- Create products table
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  foto_url TEXT,
  categoria TEXT,
  colecao TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  ranking TEXT NOT NULL DEFAULT 'normal',
  preco_custo NUMERIC NOT NULL DEFAULT 0,
  frete NUMERIC NOT NULL DEFAULT 0,
  total_taxas NUMERIC NOT NULL DEFAULT 0,
  preco_venda NUMERIC NOT NULL DEFAULT 0,
  lucro NUMERIC NOT NULL DEFAULT 0,
  markup NUMERIC NOT NULL DEFAULT 0,
  margem_liquida NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Usuários podem ver seus próprios produtos" 
ON public.produtos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios produtos" 
ON public.produtos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios produtos" 
ON public.produtos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios produtos" 
ON public.produtos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_produtos_updated_at
BEFORE UPDATE ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('produtos', 'produtos', true);

-- Storage policies
CREATE POLICY "Imagens de produtos são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'produtos');

CREATE POLICY "Usuários podem fazer upload de imagens de produtos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'produtos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar suas imagens de produtos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'produtos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem deletar suas imagens de produtos"
ON storage.objects FOR DELETE
USING (bucket_id = 'produtos' AND auth.uid() IS NOT NULL);
