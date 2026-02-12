import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  EdgeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Plus, Lightbulb, CheckSquare, FileText, Save, Sparkles, Loader2, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { MindMapNode, MindMapNodeData } from './nodes/MindMapNode';
import { MindOsCopilot } from './MindOsCopilot';
import { EdgeContextMenu } from './EdgeContextMenu';

const nodeTypes = {
  mindmap: MindMapNode,
};

const defaultEdgeOptions = {
  style: { strokeWidth: 2, stroke: '#3b82f6' },
  type: 'smoothstep',
  animated: false,
};

type LayoutMode = 'radial' | 'top-down' | 'left-right' | 'vertical';

function autoLayout(nodes: Node[], edges: Edge[], mode: LayoutMode): Node[] {
  if (nodes.length === 0) return nodes;

  // Find root nodes (no incoming edges)
  const targetIds = new Set(edges.map(e => e.target));
  const rootNodes = nodes.filter(n => !targetIds.has(n.id));
  if (rootNodes.length === 0) {
    // fallback: first node is root
    rootNodes.push(nodes[0]);
  }

  // Build adjacency
  const children: Record<string, string[]> = {};
  edges.forEach(e => {
    if (!children[e.source]) children[e.source] = [];
    children[e.source].push(e.target);
  });

  const positioned = new Map<string, { x: number; y: number }>();
  const NODE_W = 220;
  const NODE_H = 120;
  const GAP_X = 80;
  const GAP_Y = 60;

  function layoutTree(nodeId: string, x: number, y: number, depth: number): number {
    const kids = children[nodeId] || [];
    if (kids.length === 0) {
      positioned.set(nodeId, { x, y });
      return 1;
    }

    let totalSlots = 0;
    const kidSlots: number[] = [];
    kids.forEach(kid => {
      const slots = layoutTree(kid, 0, 0, depth + 1); // dry run
      kidSlots.push(slots);
      totalSlots += slots;
    });

    // Position this node
    if (mode === 'radial' || mode === 'left-right') {
      positioned.set(nodeId, { x, y });
      let currentY = y - ((totalSlots - 1) * (NODE_H + GAP_Y)) / 2;
      kids.forEach((kid, i) => {
        layoutSubtree(kid, x + NODE_W + GAP_X, currentY, depth + 1);
        currentY += kidSlots[i] * (NODE_H + GAP_Y);
      });
    } else if (mode === 'top-down') {
      positioned.set(nodeId, { x, y });
      let currentX = x - ((totalSlots - 1) * (NODE_W + GAP_X)) / 2;
      kids.forEach((kid, i) => {
        layoutSubtree(kid, currentX, y + NODE_H + GAP_Y, depth + 1);
        currentX += kidSlots[i] * (NODE_W + GAP_X);
      });
    } else {
      // vertical list
      positioned.set(nodeId, { x, y });
      let currentY = y + NODE_H + GAP_Y;
      kids.forEach((kid) => {
        layoutSubtree(kid, x + 40, currentY, depth + 1);
        currentY += NODE_H + GAP_Y;
      });
    }

    return totalSlots;
  }

  function layoutSubtree(nodeId: string, x: number, y: number, depth: number) {
    const kids = children[nodeId] || [];
    positioned.set(nodeId, { x, y });

    if (mode === 'radial' || mode === 'left-right') {
      let totalH = kids.length * (NODE_H + GAP_Y) - GAP_Y;
      let currentY = y - totalH / 2;
      kids.forEach(kid => {
        layoutSubtree(kid, x + NODE_W + GAP_X, currentY, depth + 1);
        currentY += NODE_H + GAP_Y;
      });
    } else if (mode === 'top-down') {
      let totalW = kids.length * (NODE_W + GAP_X) - GAP_X;
      let currentX = x - totalW / 2;
      kids.forEach(kid => {
        layoutSubtree(kid, currentX, y + NODE_H + GAP_Y, depth + 1);
        currentX += NODE_W + GAP_X;
      });
    } else {
      let currentY = y + NODE_H + GAP_Y;
      kids.forEach(kid => {
        layoutSubtree(kid, x + 40, currentY, depth + 1);
        currentY += NODE_H + GAP_Y;
      });
    }
  }

  // Layout from each root
  let startY = 0;
  rootNodes.forEach(root => {
    layoutSubtree(root.id, 0, startY, 0);
    startY += 400;
  });

  // Also position unconnected nodes
  let unconnectedY = startY;
  nodes.forEach(n => {
    if (!positioned.has(n.id)) {
      positioned.set(n.id, { x: 0, y: unconnectedY });
      unconnectedY += NODE_H + GAP_Y;
    }
  });

  return nodes.map(n => ({
    ...n,
    position: positioned.get(n.id) || n.position,
  }));
}

function MindMapEditorInner() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getViewport, fitView } = useReactFlow();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('radial');
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
      toast.error('Erro ao excluir nó');
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

  // Add child node from (+) button
  const handleAddChild = useCallback(
    async (parentId: string, direction: 'right' | 'bottom') => {
      const parentNode = nodes.find(n => n.id === parentId);
      if (!parentNode) return;

      const offset = direction === 'right' 
        ? { x: 300, y: 0 } 
        : { x: 0, y: 180 };

      const newPosition = {
        x: parentNode.position.x + offset.x,
        y: parentNode.position.y + offset.y,
      };

      const parentData = parentNode.data as unknown as MindMapNodeData;
      const newNodeId = crypto.randomUUID();
      const newEdgeId = crypto.randomUUID();

      const newNode: Node = {
        id: newNodeId,
        type: 'mindmap',
        position: newPosition,
        data: {
          label: '',
          nodeType: parentData.nodeType || 'idea',
          style: {},
          tags: [],
          onDelete: handleDeleteNode,
          onUpdate: handleUpdateNode,
          onAddChild: handleAddChild,
        } as MindMapNodeData,
      };

      const newEdge: Edge = {
        id: newEdgeId,
        source: parentId,
        target: newNodeId,
        type: 'smoothstep',
        animated: false,
        style: defaultEdgeOptions.style,
      };

      setNodes((nds) => [...nds, newNode]);
      setEdges((eds) => [...eds, newEdge]);

      try {
        await supabase.from('mindos_nodes').insert({
          id: newNodeId,
          project_id: projectId,
          node_type: parentData.nodeType || 'idea',
          position_x: newPosition.x,
          position_y: newPosition.y,
          content: { label: '' },
        });

        await supabase.from('mindos_edges').insert({
          id: newEdgeId,
          project_id: projectId,
          source_node_id: parentId,
          target_node_id: newNodeId,
          edge_type: 'smoothstep',
        });

        queryClient.invalidateQueries({ queryKey: ['mindos-nodes', projectId] });
        queryClient.invalidateQueries({ queryKey: ['mindos-edges', projectId] });
      } catch (error) {
        toast.error('Erro ao criar nó');
      }
    },
    [nodes, projectId, handleDeleteNode, handleUpdateNode, queryClient, setNodes, setEdges]
  );

  // Convert DB nodes to React Flow format
  useEffect(() => {
    if (dbNodes) {
      const flowNodes: Node[] = dbNodes.map((node) => ({
        id: node.id,
        type: 'mindmap',
        position: { x: Number(node.position_x), y: Number(node.position_y) },
        data: {
          label: (node.content as any)?.label || '',
          nodeType: node.node_type,
          style: node.style || {},
          tags: node.tags || [],
          status: node.status,
          onDelete: handleDeleteNode,
          onUpdate: handleUpdateNode,
          onAddChild: handleAddChild,
        } as MindMapNodeData,
      }));
      setNodes(flowNodes);
    }
  }, [dbNodes, handleDeleteNode, handleUpdateNode, handleAddChild, setNodes]);

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

  // Disabled: No manual edge connections in mind map mode
  const onConnect = useCallback((_: Connection) => {
    // Connections are only created via the (+) button
  }, []);

  const addNode = useCallback(
    async (nodeType: 'idea' | 'task' | 'text') => {
      const position = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const newNodeId = crypto.randomUUID();
      const newNode: Node = {
        id: newNodeId,
        type: 'mindmap',
        position,
        data: {
          label: '',
          nodeType,
          style: {},
          tags: [],
          onDelete: handleDeleteNode,
          onUpdate: handleUpdateNode,
          onAddChild: handleAddChild,
        } as MindMapNodeData,
      };

      setNodes((nds) => [...nds, newNode]);

      try {
        const { error } = await supabase.from('mindos_nodes').insert({
          id: newNodeId,
          project_id: projectId,
          node_type: nodeType,
          position_x: position.x,
          position_y: position.y,
          content: { label: '' },
        });

        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['mindos-nodes', projectId] });
      } catch (error) {
        toast.error('Erro ao criar nó');
      }
    },
    [projectId, screenToFlowPosition, handleDeleteNode, handleUpdateNode, handleAddChild, queryClient, setNodes]
  );

  const saveChanges = useCallback(async () => {
    setIsSaving(true);
    try {
      for (const node of nodes) {
        const nodeData = node.data as MindMapNodeData;
        await supabase
          .from('mindos_nodes')
          .update({
            position_x: node.position.x,
            position_y: node.position.y,
            content: { label: nodeData.label },
            style: nodeData.style || {},
            tags: nodeData.tags || [],
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

  // Auto-save on node drag end
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

  // Apply layout
  const applyLayout = useCallback((mode: LayoutMode) => {
    setLayoutMode(mode);
    const layouted = autoLayout(nodes, edges, mode);
    setNodes(layouted);
    setHasUnsavedChanges(true);
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [nodes, edges, setNodes, fitView]);

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
        connectionLineStyle={{ display: 'none' }}
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
          nodeColor="#3b82f6"
          maskColor="rgba(0, 0, 0, 0.5)"
        />

        {/* Top Panel */}
        <Panel position="top-left" className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/mindos/mindmap')}
            className="bg-[#242424] border-border/30"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <span className="text-foreground font-medium">{project?.name}</span>
        </Panel>

        {/* Right Panel */}
        <Panel position="top-right" className="flex items-center gap-2">
          {/* Layout selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-[#242424] border-border/30">
                <LayoutTemplate className="h-4 w-4" />
                Layout
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#242424] border-border/30">
              <DropdownMenuItem onClick={() => applyLayout('radial')}>
                Mapa Mental (Radial)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyLayout('top-down')}>
                Organograma (Top-Down)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyLayout('left-right')}>
                Organograma (Left-Right)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyLayout('vertical')}>
                Lista (Vertical)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Nó
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#242424] border-border/30">
              <DropdownMenuItem onClick={() => addNode('idea')}>
                <Lightbulb className="h-4 w-4 mr-2 text-yellow-400" />
                Ideia
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addNode('task')}>
                <CheckSquare className="h-4 w-4 mr-2 text-blue-400" />
                Tarefa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addNode('text')}>
                <FileText className="h-4 w-4 mr-2 text-gray-400" />
                Texto Livre
              </DropdownMenuItem>
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
        projectType="mindmap"
        onAddNode={addNode}
      />
    </div>
  );
}

export default function MindMapEditor() {
  return (
    <ReactFlowProvider>
      <MindMapEditorInner />
    </ReactFlowProvider>
  );
}
