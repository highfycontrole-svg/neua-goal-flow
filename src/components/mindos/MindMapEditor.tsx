import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
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

  const targetIds = new Set(edges.map(e => e.target));
  const rootNodes = nodes.filter(n => !targetIds.has(n.id));
  if (rootNodes.length === 0 && nodes.length > 0) {
    rootNodes.push(nodes[0]);
  }

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

  function countLeaves(nodeId: string, visited: Set<string>): number {
    if (visited.has(nodeId)) return 1;
    visited.add(nodeId);
    const kids = children[nodeId] || [];
    if (kids.length === 0) return 1;
    return kids.reduce((sum, kid) => sum + countLeaves(kid, visited), 0);
  }

  function layoutSubtree(nodeId: string, x: number, y: number, visited: Set<string>) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    positioned.set(nodeId, { x, y });
    const kids = children[nodeId] || [];
    if (kids.length === 0) return;

    if (mode === 'radial' || mode === 'left-right') {
      const leafCounts = kids.map(k => countLeaves(k, new Set([...visited])));
      const totalLeaves = leafCounts.reduce((a, b) => a + b, 0);
      let currentY = y - ((totalLeaves - 1) * (NODE_H + GAP_Y)) / 2;
      kids.forEach((kid, i) => {
        layoutSubtree(kid, x + NODE_W + GAP_X, currentY, visited);
        currentY += leafCounts[i] * (NODE_H + GAP_Y);
      });
    } else if (mode === 'top-down') {
      const leafCounts = kids.map(k => countLeaves(k, new Set([...visited])));
      const totalLeaves = leafCounts.reduce((a, b) => a + b, 0);
      let currentX = x - ((totalLeaves - 1) * (NODE_W + GAP_X)) / 2;
      kids.forEach((kid, i) => {
        layoutSubtree(kid, currentX, y + NODE_H + GAP_Y, visited);
        currentX += leafCounts[i] * (NODE_W + GAP_X);
      });
    } else {
      let currentY = y + NODE_H + GAP_Y;
      kids.forEach((kid) => {
        layoutSubtree(kid, x + 40, currentY, visited);
        currentY += NODE_H + GAP_Y;
      });
    }
  }

  let startY = 0;
  rootNodes.forEach(root => {
    layoutSubtree(root.id, 0, startY, new Set());
    startY += 500;
  });

  // Position unconnected nodes
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
  const [nodesInitialized, setNodesInitialized] = useState(false);

  // Refs to break circular dependencies
  const nodesRef = useRef<Node[]>([]);
  nodesRef.current = nodes;
  const edgesRef = useRef<Edge[]>([]);
  edgesRef.current = edges;

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

  const handleUpdateNode = useCallback((nodeId: string, updates: any) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return { ...n, data: { ...n.data, ...updates } };
        }
        return n;
      })
    );
    setHasUnsavedChanges(true);
  }, [setNodes]);

  // Stable handleAddChild that uses refs instead of nodes state
  const handleAddChild = useCallback(
    async (parentId: string, direction: 'right' | 'bottom') => {
      const parentNode = nodesRef.current.find(n => n.id === parentId);
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

      // We'll set callbacks via a separate mechanism to avoid circular deps
      const newNode: Node = {
        id: newNodeId,
        type: 'mindmap',
        position: newPosition,
        data: {
          label: '',
          nodeType: parentData.nodeType || 'idea',
          style: {},
          tags: [],
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
      setHasUnsavedChanges(true);

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
    [projectId, queryClient, setNodes, setEdges]
  );

  // Store stable callback refs
  const handleDeleteNodeRef = useRef(handleDeleteNode);
  handleDeleteNodeRef.current = handleDeleteNode;
  const handleUpdateNodeRef = useRef(handleUpdateNode);
  handleUpdateNodeRef.current = handleUpdateNode;
  const handleAddChildRef = useRef(handleAddChild);
  handleAddChildRef.current = handleAddChild;

  // Stable callback wrappers that never change identity
  const stableDeleteNode = useCallback((id: string) => handleDeleteNodeRef.current(id), []);
  const stableUpdateNode = useCallback((id: string, updates: any) => handleUpdateNodeRef.current(id, updates), []);
  const stableAddChild = useCallback((id: string, dir: 'right' | 'bottom') => handleAddChildRef.current(id, dir), []);

  // Convert DB nodes to React Flow format - only when dbNodes changes
  useEffect(() => {
    if (dbNodes && !nodesInitialized) {
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
          onDelete: stableDeleteNode,
          onUpdate: stableUpdateNode,
          onAddChild: stableAddChild,
        } as MindMapNodeData,
      }));
      setNodes(flowNodes);
      setNodesInitialized(true);
    }
  }, [dbNodes, nodesInitialized, stableDeleteNode, stableUpdateNode, stableAddChild, setNodes]);

  // Reset initialization when project changes
  useEffect(() => {
    setNodesInitialized(false);
  }, [projectId]);

  // Inject callbacks into nodes that don't have them (e.g. newly added via handleAddChild)
  useEffect(() => {
    setNodes((nds) => {
      let changed = false;
      const updated = nds.map((n) => {
        const d = n.data as unknown as MindMapNodeData;
        if (!d.onDelete || !d.onUpdate || !d.onAddChild) {
          changed = true;
          return {
            ...n,
            data: {
              ...n.data,
              onDelete: stableDeleteNode,
              onUpdate: stableUpdateNode,
              onAddChild: stableAddChild,
            },
          };
        }
        return n;
      });
      return changed ? updated : nds;
    });
  }, [nodes.length, stableDeleteNode, stableUpdateNode, stableAddChild, setNodes]);

  // Convert DB edges
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

  // No manual connections in mind map
  const onConnect = useCallback((_: Connection) => {}, []);

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
          onDelete: stableDeleteNode,
          onUpdate: stableUpdateNode,
          onAddChild: stableAddChild,
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
    [projectId, screenToFlowPosition, stableDeleteNode, stableUpdateNode, stableAddChild, queryClient, setNodes]
  );

  const saveChanges = useCallback(async () => {
    setIsSaving(true);
    try {
      for (const node of nodesRef.current) {
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
  }, [projectId, getViewport, queryClient]);

  const onNodeDragStop = useCallback(
    async (_: any, node: Node) => {
      try {
        await supabase
          .from('mindos_nodes')
          .update({ position_x: node.position.x, position_y: node.position.y })
          .eq('id', node.id);
      } catch (error) {
        console.error('Error saving node position:', error);
      }
    },
    []
  );

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setEdgeContextMenu({ x: event.clientX, y: event.clientY, edgeId: edge.id });
    },
    []
  );

  const handleChangeEdgeType = useCallback(
    async (edgeId: string, type: string) => {
      setEdges((eds) => eds.map((e) => (e.id === edgeId ? { ...e, type } : e)));
      try {
        await supabase.from('mindos_edges').update({ edge_type: type }).eq('id', edgeId);
      } catch (error) {
        console.error('Error updating edge type:', error);
      }
    },
    [setEdges]
  );

  const applyLayout = useCallback((mode: LayoutMode) => {
    setLayoutMode(mode);
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    const layouted = autoLayout(currentNodes, currentEdges, mode);
    setNodes(layouted);
    setHasUnsavedChanges(true);
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [setNodes, fitView]);

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
        className="bg-surface-1"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
        <Controls className="bg-surface-3 border-border/30" />
        <MiniMap 
          className="!bg-surface-3 !border-border/30"
          nodeColor="#3b82f6"
          maskColor="rgba(0, 0, 0, 0.5)"
        />

        <Panel position="top-left" className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/mindos/mindmap')}
            className="bg-surface-3 border-border/30"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <span className="text-foreground font-medium">{project?.name}</span>
        </Panel>

        <Panel position="top-right" className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-surface-3 border-border/30">
                <LayoutTemplate className="h-4 w-4" />
                Layout
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-surface-3 border-border/30">
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
            <DropdownMenuContent className="bg-surface-3 border-border/30">
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

      {edgeContextMenu && (
        <EdgeContextMenu
          x={edgeContextMenu.x}
          y={edgeContextMenu.y}
          edgeId={edgeContextMenu.edgeId}
          onClose={() => setEdgeContextMenu(null)}
          onChangeType={handleChangeEdgeType}
        />
      )}

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
