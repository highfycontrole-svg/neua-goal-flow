-- Create enum for project types
CREATE TYPE mindos_project_type AS ENUM ('mindmap', 'flowchart');

-- Create enum for node types
CREATE TYPE mindos_node_type AS ENUM ('idea', 'task', 'text', 'icon');

-- Create mindos_projects table
CREATE TABLE public.mindos_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type mindos_project_type NOT NULL,
  thumbnail_url TEXT,
  viewport JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mindos_nodes table
CREATE TABLE public.mindos_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.mindos_projects(id) ON DELETE CASCADE,
  node_type mindos_node_type NOT NULL DEFAULT 'idea',
  position_x NUMERIC NOT NULL DEFAULT 0,
  position_y NUMERIC NOT NULL DEFAULT 0,
  width NUMERIC,
  height NUMERIC,
  content JSONB DEFAULT '{}'::jsonb,
  style JSONB DEFAULT '{}'::jsonb,
  icon_category TEXT,
  icon_name TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mindos_edges table (connections)
CREATE TABLE public.mindos_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.mindos_projects(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.mindos_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.mindos_nodes(id) ON DELETE CASCADE,
  edge_type TEXT DEFAULT 'default',
  style JSONB DEFAULT '{}'::jsonb,
  label TEXT,
  animated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mindos_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mindos_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mindos_edges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mindos_projects
CREATE POLICY "Users can view their own projects" 
ON public.mindos_projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON public.mindos_projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.mindos_projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.mindos_projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for mindos_nodes
CREATE POLICY "Users can view nodes of their projects" 
ON public.mindos_nodes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.mindos_projects 
  WHERE id = mindos_nodes.project_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create nodes in their projects" 
ON public.mindos_nodes 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.mindos_projects 
  WHERE id = mindos_nodes.project_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update nodes in their projects" 
ON public.mindos_nodes 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.mindos_projects 
  WHERE id = mindos_nodes.project_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete nodes in their projects" 
ON public.mindos_nodes 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.mindos_projects 
  WHERE id = mindos_nodes.project_id AND user_id = auth.uid()
));

-- RLS Policies for mindos_edges
CREATE POLICY "Users can view edges of their projects" 
ON public.mindos_edges 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.mindos_projects 
  WHERE id = mindos_edges.project_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create edges in their projects" 
ON public.mindos_edges 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.mindos_projects 
  WHERE id = mindos_edges.project_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update edges in their projects" 
ON public.mindos_edges 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.mindos_projects 
  WHERE id = mindos_edges.project_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete edges in their projects" 
ON public.mindos_edges 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.mindos_projects 
  WHERE id = mindos_edges.project_id AND user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_mindos_projects_updated_at
BEFORE UPDATE ON public.mindos_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mindos_nodes_updated_at
BEFORE UPDATE ON public.mindos_nodes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_mindos_projects_user_id ON public.mindos_projects(user_id);
CREATE INDEX idx_mindos_projects_type ON public.mindos_projects(type);
CREATE INDEX idx_mindos_nodes_project_id ON public.mindos_nodes(project_id);
CREATE INDEX idx_mindos_edges_project_id ON public.mindos_edges(project_id);
CREATE INDEX idx_mindos_edges_source ON public.mindos_edges(source_node_id);
CREATE INDEX idx_mindos_edges_target ON public.mindos_edges(target_node_id);