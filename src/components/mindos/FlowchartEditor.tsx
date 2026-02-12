import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, Plus, Save, Sparkles, Loader2,
  Megaphone, UserPlus, Leaf, Heart, Globe, FileText, ShoppingCart, CreditCard,
  Instagram, Youtube, Facebook, Mail, MessageCircle, Bot, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { FlowchartNode, FlowchartNodeData, flowchartIcons } from './nodes/FlowchartNode';
import { MindOsCopilot } from './MindOsCopilot';
import { EdgeContextMenu } from './EdgeContextMenu';

const nodeTypes = {
  flowchart: FlowchartNode,
};

const defaultEdgeOptions = {
  style: { strokeWidth: 2, stroke: '#22c55e' },
  type: 'smoothstep',
  animated: false,
};

const iconCategories = {
  'Ações': ['ad', 'signup', 'organic', 'engagement'],
  'Destinos': ['landing', 'capture', 'site', 'purchase', 'cart'],
  'Redes Sociais': ['instagram', 'youtube', 'facebook', 'tiktok'],
  'Ferramentas': ['email', 'whatsapp', 'manychat', 'crm'],
};

function FlowchartEditorInner() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getViewport } = useReactFlow();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [edgeContextMenu, setEdgeContextMenu] = useState<{ x: number; y: number; edgeId: string } | null>(null);

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['mindos-project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mindos_projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch nodes
  const { data: dbNodes, isLoading: nodesLoading } = useQuery({
    queryKey: ['mindos-nodes', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mindos_nodes')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch edges
  const { data: dbEdges, isLoading: edgesLoading } = useQuery({
    queryKey: ['mindos-edges', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mindos_edges')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const handleDeleteNode = useCallback(async (nodeId: string) => {
    try {
      const { error } = await supabase
        .from('mindos_nodes')
        .delete()
        .eq('id', nodeId);
      
      if (error) throw error;
      
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      queryClient.invalidateQueries({ queryKey: ['mindos-nodes', projectId] });
      queryClient.invalidateQueries({ queryKey: ['mindos-edges', projectId] });
    } catch (error) {
      toast.error('Erro ao excluir bloco');
    }
  }, [projectId, queryClient, setNodes, setEdges]);

  const handleUpdateNode = useCallback(async (nodeId: string, updates: any) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: { ...n.data, ...updates },
          };
        }
        return n;
      })
    );
    setHasUnsavedChanges(true);
  }, [setNodes]);

  // Convert DB nodes to React Flow format
  useEffect(() => {
    if (dbNodes) {
      const flowNodes: Node[] = dbNodes.map((node) => ({
        id: node.id,
        type: 'flowchart',
        position: { x: Number(node.position_x), y: Number(node.position_y) },
        data: {
          label: (node.content as any)?.label || '',
          subtitle: (node.content as any)?.subtitle || '',
          iconName: node.icon_name || 'custom',
          style: node.style || {},
          onDelete: handleDeleteNode,
          onUpdate: handleUpdateNode,
        } as FlowchartNodeData,
      }));
      setNodes(flowNodes);
    }
  }, [dbNodes, handleDeleteNode, handleUpdateNode, setNodes]);

  // Convert DB edges to React Flow format
  useEffect(() => {
    if (dbEdges) {
      const flowEdges: Edge[] = dbEdges.map((edge) => ({
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        type: edge.edge_type || 'smoothstep',
        label: edge.label || undefined,
        animated: edge.animated || false,
        style: (edge.style as any) || defaultEdgeOptions.style,
      }));
      setEdges(flowEdges);
    }
  }, [dbEdges, setEdges]);

  // Flowchart: allow drag-to-connect
  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const newEdge = {
        id: crypto.randomUUID(),
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'smoothstep',
        animated: false,
        style: defaultEdgeOptions.style,
      };

      setEdges((eds) => addEdge(newEdge, eds));

      try {
        const { error } = await supabase.from('mindos_edges').insert({
          id: newEdge.id,
          project_id: projectId,
          source_node_id: connection.source,
          target_node_id: connection.target,
          edge_type: 'smoothstep',
        });

        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['mindos-edges', projectId] });
      } catch (error) {
        toast.error('Erro ao criar conexão');
      }
    },
    [projectId, queryClient, setEdges]
  );

  const addNode = useCallback(
    async (iconName: string) => {
      const position = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const iconConfig = flowchartIcons[iconName] || flowchartIcons.custom;
      const newNodeId = crypto.randomUUID();
      const newNode: Node = {
        id: newNodeId,
        type: 'flowchart',
        position,
        data: {
          label: iconConfig.label,
          subtitle: '',
          iconName,
          style: {},
          onDelete: handleDeleteNode,
          onUpdate: handleUpdateNode,
        } as FlowchartNodeData,
      };

      setNodes((nds) => [...nds, newNode]);

      try {
        const { error } = await supabase.from('mindos_nodes').insert({
          id: newNodeId,
          project_id: projectId,
          node_type: 'icon',
          position_x: position.x,
          position_y: position.y,
          icon_name: iconName,
          icon_category: Object.entries(iconCategories).find(([_, icons]) => icons.includes(iconName))?.[0] || 'custom',
          content: { label: iconConfig.label, subtitle: '' },
        });

        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['mindos-nodes', projectId] });
      } catch (error) {
        toast.error('Erro ao criar bloco');
      }
    },
    [projectId, screenToFlowPosition, handleDeleteNode, handleUpdateNode, queryClient, setNodes]
  );

  const saveChanges = useCallback(async () => {
    setIsSaving(true);
    try {
      for (const node of nodes) {
        const nodeData = node.data as FlowchartNodeData;
        await supabase
          .from('mindos_nodes')
          .update({
            position_x: node.position.x,
            position_y: node.position.y,
            content: { label: nodeData.label, subtitle: nodeData.subtitle },
            style: nodeData.style || {},
          })
          .eq('id', node.id);
      }

      const viewport = getViewport();
      await supabase
        .from('mindos_projects')
        .update({ viewport })
        .eq('id', projectId);

      setHasUnsavedChanges(false);
      toast.success('Alterações salvas!');
      queryClient.invalidateQueries({ queryKey: ['mindos-nodes', projectId] });
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  }, [nodes, projectId, getViewport, queryClient]);

  const onNodeDragStop = useCallback(
    async (_: any, node: Node) => {
      try {
        await supabase
          .from('mindos_nodes')
          .update({
            position_x: node.position.x,
            position_y: node.position.y,
          })
          .eq('id', node.id);
      } catch (error) {
        console.error('Error saving node position:', error);
      }
    },
    []
  );

  // Edge context menu
  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setEdgeContextMenu({
        x: event.clientX,
        y: event.clientY,
        edgeId: edge.id,
      });
    },
    []
  );

  const handleChangeEdgeType = useCallback(
    async (edgeId: string, type: string) => {
      setEdges((eds) =>
        eds.map((e) => (e.id === edgeId ? { ...e, type } : e))
      );
      try {
        await supabase
          .from('mindos_edges')
          .update({ edge_type: type })
          .eq('id', edgeId);
      } catch (error) {
        console.error('Error updating edge type:', error);
      }
    },
    [setEdges]
  );

  // Close edge context menu on click anywhere
  useEffect(() => {
    const handler = () => setEdgeContextMenu(null);
    if (edgeContextMenu) {
      window.addEventListener('click', handler);
      return () => window.removeEventListener('click', handler);
    }
  }, [edgeContextMenu]);

  const isLoading = projectLoading || nodesLoading || edgesLoading;

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onEdgeContextMenu={onEdgeContextMenu}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        className="bg-[#161616]"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
        <Controls className="bg-[#242424] border-border/30" />
        <MiniMap 
          className="!bg-[#242424] !border-border/30"
          nodeColor="#22c55e"
          maskColor="rgba(0, 0, 0, 0.5)"
        />

        {/* Top Panel */}
        <Panel position="top-left" className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/mindos/flowchart')}
            className="bg-[#242424] border-border/30"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <span className="text-foreground font-medium">{project?.name}</span>
        </Panel>

        {/* Right Panel - Add Nodes */}
        <Panel position="top-right" className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4" />
                Adicionar Bloco
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#242424] border-border/30 w-56">
              {Object.entries(iconCategories).map(([category, icons]) => (
                <DropdownMenuSub key={category}>
                  <DropdownMenuSubTrigger>{category}</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-[#242424] border-border/30">
                    {icons.map((iconName) => {
                      const config = flowchartIcons[iconName];
                      const Icon = config.icon;
                      return (
                        <DropdownMenuItem key={iconName} onClick={() => addNode(iconName)}>
                          <Icon className="h-4 w-4 mr-2" style={{ color: config.color }} />
                          {config.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline"
            className="gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30 hover:border-purple-500/50"
            onClick={() => setCopilotOpen(true)}
          >
            <Sparkles className="h-4 w-4 text-purple-400" />
            Copilot
          </Button>

          {hasUnsavedChanges && (
            <Button 
              onClick={saveChanges} 
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </Button>
          )}
        </Panel>
      </ReactFlow>

      {/* Edge Context Menu */}
      {edgeContextMenu && (
        <EdgeContextMenu
          x={edgeContextMenu.x}
          y={edgeContextMenu.y}
          edgeId={edgeContextMenu.edgeId}
          onClose={() => setEdgeContextMenu(null)}
          onChangeType={handleChangeEdgeType}
        />
      )}

      {/* Copilot Modal */}
      <MindOsCopilot
        open={copilotOpen}
        onOpenChange={setCopilotOpen}
        nodes={nodes}
        projectType="flowchart"
      />
    </div>
  );
}

export default function FlowchartEditor() {
  return (
    <ReactFlowProvider>
      <FlowchartEditorInner />
    </ReactFlowProvider>
  );
}
