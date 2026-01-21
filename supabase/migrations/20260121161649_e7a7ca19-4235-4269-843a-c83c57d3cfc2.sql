-- Add links field to workspace_tasks for clickable links in tasks
ALTER TABLE public.workspace_tasks 
ADD COLUMN IF NOT EXISTS links TEXT[];

-- Add link_anuncio_pronto field to ad_anuncios for ready ad links
ALTER TABLE public.ad_anuncios 
ADD COLUMN IF NOT EXISTS link_anuncio_pronto TEXT;