import { useState, useEffect } from 'react';
import { registerContextActions } from '@/hooks/useGlobalContextMenu';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Brain, MoreVertical, Trash2, Copy, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MindMapProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProject, setEditingProject] = useState<{ id: string; name: string } | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['mindos-projects', 'mindmap', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mindos_projects')
        .select('*')
        .eq('type', 'mindmap')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('mindos_projects')
        .insert({
          name,
          type: 'mindmap',
          user_id: user!.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mindos-projects'] });
      toast.success('Projeto criado com sucesso!');
      setCreateDialogOpen(false);
      setNewProjectName('');
      navigate(`/mindos/mindmap/${data.id}`);
    },
    onError: () => {
      toast.error('Erro ao criar projeto');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('mindos_projects')
        .update({ name })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mindos-projects'] });
      toast.success('Projeto renomeado!');
      setEditDialogOpen(false);
      setEditingProject(null);
    },
    onError: () => {
      toast.error('Erro ao renomear projeto');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const project = projects?.find(p => p.id === projectId);
      if (!project) throw new Error('Projeto não encontrado');

      const { data: newProject, error: projectError } = await supabase
        .from('mindos_projects')
        .insert({
          name: `${project.name} (Cópia)`,
          type: 'mindmap',
          user_id: user!.id,
          viewport: project.viewport,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Copy nodes
      const { data: nodes, error: nodesError } = await supabase
        .from('mindos_nodes')
        .select('*')
        .eq('project_id', projectId);

      if (nodesError) throw nodesError;

      if (nodes && nodes.length > 0) {
        const nodeIdMap = new Map<string, string>();
        
        for (const node of nodes) {
          const newNodeId = crypto.randomUUID();
          nodeIdMap.set(node.id, newNodeId);
          
          await supabase.from('mindos_nodes').insert({
            id: newNodeId,
            project_id: newProject.id,
            node_type: node.node_type,
            position_x: node.position_x,
            position_y: node.position_y,
            width: node.width,
            height: node.height,
            content: node.content,
            style: node.style,
            tags: node.tags,
            status: node.status,
          });
        }

        // Copy edges
        const { data: edges } = await supabase
          .from('mindos_edges')
          .select('*')
          .eq('project_id', projectId);

        if (edges && edges.length > 0) {
          for (const edge of edges) {
            const newSourceId = nodeIdMap.get(edge.source_node_id);
            const newTargetId = nodeIdMap.get(edge.target_node_id);
            
            if (newSourceId && newTargetId) {
              await supabase.from('mindos_edges').insert({
                project_id: newProject.id,
                source_node_id: newSourceId,
                target_node_id: newTargetId,
                edge_type: edge.edge_type,
                style: edge.style,
                label: edge.label,
                animated: edge.animated,
              });
            }
          }
        }
      }

      return newProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mindos-projects'] });
      toast.success('Projeto duplicado!');
    },
    onError: () => {
      toast.error('Erro ao duplicar projeto');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('mindos_projects')
        .delete()
        .eq('id', projectId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mindos-projects'] });
      toast.success('Projeto excluído!');
    },
    onError: () => {
      toast.error('Erro ao excluir projeto');
    },
  });

  const handleCreate = () => {
    if (!newProjectName.trim()) {
      toast.error('Digite um nome para o projeto');
      return;
    }
    createMutation.mutate(newProjectName.trim());
  };

  const handleEdit = () => {
    if (!editingProject || !editingProject.name.trim()) {
      toast.error('Digite um nome para o projeto');
      return;
    }
    updateMutation.mutate({ id: editingProject.id, name: editingProject.name.trim() });
  };

  // Register context menu actions for right-click on project cards
  useEffect(() => {
    return registerContextActions({
      'project:open': (id) => navigate(`/mindos/mindmap/${id}`),
      'project:rename': (id, name) => {
        setEditingProject({ id, name });
        setEditDialogOpen(true);
      },
      'project:duplicate': (id) => duplicateMutation.mutate(id),
      'project:delete': (id) => {
        if (confirm('Tem certeza que deseja excluir este projeto?')) {
          deleteMutation.mutate(id);
        }
      },
    });
  }, [navigate, duplicateMutation, deleteMutation]);

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Meus Mapas Mentais</h2>
          <p className="text-sm text-muted-foreground">
            Crie e organize suas ideias visualmente
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : projects && projects.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          <AnimatePresence>
            {projects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card 
                  className="bg-surface-1 border-border/30 hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => navigate(`/mindos/mindmap/${project.id}`)}
                  data-context-type="project"
                  data-context-id={project.id}
                  data-context-name={project.name}
                  data-context-actions="open,rename,duplicate,---,delete"
                >
                  <CardContent className="p-0">
                    {/* Thumbnail Preview */}
                    <div className="h-32 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-t-lg flex items-center justify-center">
                      <Brain className="h-12 w-12 text-purple-400/50" />
                    </div>
                    
                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">{project.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Atualizado {format(new Date(project.updated_at), "dd 'de' MMM", { locale: ptBR })}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-surface-3 border-border/30">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProject({ id: project.id, name: project.name });
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Renomear
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateMutation.mutate(project.id);
                              }}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Tem certeza que deseja excluir este projeto?')) {
                                  deleteMutation.mutate(project.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-purple-500/10 mb-4">
            <Brain className="h-12 w-12 text-purple-400" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhum mapa mental ainda</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crie seu primeiro mapa mental para começar a organizar suas ideias
          </p>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Primeiro Projeto
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-surface-3 border-border/30">
          <DialogHeader>
            <DialogTitle>Novo Mapa Mental</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome do projeto..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="bg-surface-1 border-border/30"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Criando...' : 'Criar Projeto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-surface-3 border-border/30">
          <DialogHeader>
            <DialogTitle>Renomear Projeto</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome do projeto..."
              value={editingProject?.name || ''}
              onChange={(e) => setEditingProject(prev => prev ? { ...prev, name: e.target.value } : null)}
              onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
              className="bg-surface-1 border-border/30"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
