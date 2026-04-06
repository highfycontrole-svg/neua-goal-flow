import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { KPICard } from '@/components/KPICard';
import { LayoutGrid, CheckCircle2, Clock, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { CreateWorkspaceDialog } from '@/components/workspace/CreateWorkspaceDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { registerContextActions } from '@/hooks/useGlobalContextMenu';

const STATUS_COLORS: Record<string, string> = {
  'default': '#3B82F6',
  'completed': '#10B981',
  'in_progress': '#F59E0B',
  'blocked': '#EF4444',
};

export default function WorkspaceResumo() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (workspaceId: string) => {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['all-workspace-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-workspace-statuses'] });
      toast.success('Workspace excluído com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir workspace');
    },
  });

  const { data: workspaces = [], isLoading: loadingWorkspaces } = useQuery({
    queryKey: ['workspaces', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: allTasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['all-workspace-tasks', user?.id],
    queryFn: async () => {
      const workspaceIds = workspaces.map(w => w.id);
      if (workspaceIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('*, workspace_statuses(*)')
        .in('workspace_id', workspaceIds);
      if (error) throw error;
      return data;
    },
    enabled: workspaces.length > 0 && !loadingWorkspaces,
  });

  const { data: allStatuses = [] } = useQuery({
    queryKey: ['all-workspace-statuses', user?.id],
    queryFn: async () => {
      const workspaceIds = workspaces.map(w => w.id);
      if (workspaceIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('workspace_statuses')
        .select('*')
        .in('workspace_id', workspaceIds);
      if (error) throw error;
      return data;
    },
    enabled: workspaces.length > 0 && !loadingWorkspaces,
  });

  // Calculate stats
  const totalTasks = allTasks.length;
  const tasksWithDates = allTasks.filter(t => t.date);
  const overdueTasks = tasksWithDates.filter(t => new Date(t.date) < new Date()).length;
  
  // Group tasks by status
  const tasksByStatus = allTasks.reduce((acc: Record<string, number>, task) => {
    const statusName = task.workspace_statuses?.name || 'Sem Status';
    acc[statusName] = (acc[statusName] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(tasksByStatus).map(([name, value], index) => ({
    name,
    value,
    color: allStatuses.find(s => s.name === name)?.color || STATUS_COLORS.default,
  }));

  // Tasks by workspace
  const tasksByWorkspace = workspaces.map(workspace => {
    const workspaceTasks = allTasks.filter(t => t.workspace_id === workspace.id);
    return {
      name: workspace.name.length > 15 ? workspace.name.substring(0, 15) + '...' : workspace.name,
      fullName: workspace.name,
      tasks: workspaceTasks.length,
      id: workspace.id,
    };
  });

  const isLoading = loadingWorkspaces || loadingTasks;

  // Register context menu actions for right-click on workspace cards
  useEffect(() => {
    return registerContextActions({
      'workspace:open': (id) => navigate(`/workspace/${id}`),
      'workspace:delete': (id) => {
        if (confirm('Tem certeza que deseja excluir este workspace?')) {
          deleteWorkspaceMutation.mutate(id);
        }
      },
    });
  }, [navigate, deleteWorkspaceMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-1 sm:mb-2">Workspace Neua</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Visão geral de todos os seus workspaces e tarefas
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Novo Workspace
        </Button>
      </motion.div>

      {/* KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
      >
        <KPICard
          title="Total de Workspaces"
          value={workspaces.length}
          icon={LayoutGrid}
          description="Workspaces criados"
        />
        <KPICard
          title="Total de Tarefas"
          value={totalTasks}
          icon={CheckCircle2}
          description="Em todos os workspaces"
        />
        <KPICard
          title="Com Data"
          value={tasksWithDates.length}
          icon={Clock}
          description="Tarefas agendadas"
        />
        <KPICard
          title="Atrasadas"
          value={overdueTasks}
          icon={AlertTriangle}
          description="Tarefas vencidas"
        />
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Tasks by Status */}
        <Card className="border-border/50 bg-background">
          <CardHeader>
            <CardTitle className="text-xl font-display">Tarefas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={(entry) => entry.name}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma tarefa encontrada
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks by Workspace */}
        <Card className="border-border/50" style={{ backgroundColor: '#161616' }}>
          <CardHeader>
            <CardTitle className="text-xl font-display">Tarefas por Workspace</CardTitle>
          </CardHeader>
          <CardContent>
            {tasksByWorkspace.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tasksByWorkspace}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                  />
                  <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum workspace encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Workspaces Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-display font-bold mb-4">Seus Workspaces</h2>
        {workspaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((workspace) => {
              const workspaceTasks = allTasks.filter(t => t.workspace_id === workspace.id);
              const workspaceStatuses = allStatuses.filter(s => s.workspace_id === workspace.id);
              
              return (
                <motion.div
                  key={workspace.id}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className="cursor-pointer border-border/50 hover:border-primary/50 transition-all duration-300"
                    style={{ backgroundColor: '#161616' }}
                    onClick={() => navigate(`/workspace/${workspace.id}`)}
                    data-context-type="workspace"
                    data-context-id={workspace.id}
                    data-context-name={workspace.name}
                    data-context-actions="open,---,delete"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-display font-semibold text-lg flex-1 min-w-0 truncate mr-2">{workspace.name}</h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <LayoutGrid className="h-5 w-5 text-primary" />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir workspace "{workspace.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Todas as tarefas e status deste workspace serão permanentemente excluídos.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteWorkspaceMutation.mutate(workspace.id);
                                  }}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tarefas</span>
                          <span className="font-medium">{workspaceTasks.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <span className="font-medium">{workspaceStatuses.length}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-1">
                        {workspaceStatuses.slice(0, 5).map((status) => (
                          <div 
                            key={status.id}
                            className="h-2 flex-1 rounded-full"
                            style={{ backgroundColor: status.color }}
                            title={status.name}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="border-border/50" style={{ backgroundColor: '#161616' }}>
            <CardContent className="py-12 text-center">
              <LayoutGrid className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum workspace criado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro workspace para começar a organizar suas tarefas
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Workspace
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      <CreateWorkspaceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
