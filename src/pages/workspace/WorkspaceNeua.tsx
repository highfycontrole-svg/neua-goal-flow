import { useState, useMemo } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, LayoutGrid, Table as TableIcon, Calendar as CalendarIcon } from 'lucide-react';
import { CreateWorkspaceDialog } from '@/components/workspace/CreateWorkspaceDialog';
import { WorkspaceKanban } from '@/components/workspace/WorkspaceKanban';
import { WorkspaceTable } from '@/components/workspace/WorkspaceTable';
import { WorkspaceCalendar } from '@/components/workspace/WorkspaceCalendar';
import { WorkspaceFilters } from '@/components/workspace/WorkspaceFilters';
import { motion } from 'framer-motion';
import { isToday, isThisWeek, isThisMonth, isBefore, startOfDay } from 'date-fns';

export default function WorkspaceNeua() {
  const { user } = useAuth();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [view, setView] = useState<'kanban' | 'table' | 'calendar'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [responsibleFilter, setResponsibleFilter] = useState('todos');
  const [tagFilter, setTagFilter] = useState('todas');
  const [dateFilter, setDateFilter] = useState('todas');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(() => {
    return localStorage.getItem('neua-workspace-show-completed') === 'true';
  });

  const { data: workspaces = [], isLoading } = useQuery({
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

  const { data: tasks = [] } = useQuery({
    queryKey: ['workspace-tasks', selectedWorkspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('*, workspace_subtasks(*)')
        .eq('workspace_id', selectedWorkspaceId!)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedWorkspaceId,
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ['workspace-statuses', selectedWorkspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_statuses')
        .select('*')
        .eq('workspace_id', selectedWorkspaceId!)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedWorkspaceId,
  });

  // Extract unique responsibles and tags from tasks
  const { availableResponsibles, availableTags } = useMemo(() => {
    const responsibles = new Set<string>();
    const tags = new Set<string>();
    
    tasks.forEach(task => {
      if (task.responsible) responsibles.add(task.responsible);
      if (task.tags) task.tags.forEach((tag: string) => tags.add(tag));
    });
    
    return {
      availableResponsibles: Array.from(responsibles).sort(),
      availableTags: Array.from(tags).sort(),
    };
  }, [tasks]);

  const completedTerms = ['concluído', 'concluida', 'done', 'finalizado', 'completo'];

  const completedStatusIds = useMemo(() => {
    return statuses
      .filter(s => completedTerms.some(term => s.name.toLowerCase().includes(term)))
      .map(s => s.id);
  }, [statuses]);

  const completedCount = useMemo(() =>
    tasks.filter(t => completedStatusIds.includes(t.status_id || '')).length,
  [tasks, completedStatusIds]);

  const handleShowCompletedChange = (value: boolean) => {
    setShowCompleted(value);
    localStorage.setItem('neua-workspace-show-completed', String(value));
  };

  // Filter function for tasks
  const filterTasks = (task: any) => {
    // Hide completed
    if (!showCompleted && completedStatusIds.includes(task.status_id || '')) {
      return false;
    }

    // Search query filter
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Responsible filter
    const matchesResponsible = responsibleFilter === 'todos' || 
      task.responsible === responsibleFilter;
    
    // Tag filter
    const matchesTag = tagFilter === 'todas' || 
      (task.tags && task.tags.includes(tagFilter));
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'todas') {
      const taskDate = task.date ? new Date(task.date) : null;
      const today = startOfDay(new Date());
      
      switch (dateFilter) {
        case 'hoje':
          matchesDate = taskDate ? isToday(taskDate) : false;
          break;
        case 'semana':
          matchesDate = taskDate ? isThisWeek(taskDate, { weekStartsOn: 1 }) : false;
          break;
        case 'mes':
          matchesDate = taskDate ? isThisMonth(taskDate) : false;
          break;
        case 'atrasadas':
          matchesDate = taskDate ? isBefore(taskDate, today) : false;
          break;
        case 'sem-data':
          matchesDate = !taskDate;
          break;
      }
    }
    
    return matchesSearch && matchesResponsible && matchesTag && matchesDate;
  };

  const selectedWorkspace = workspaces?.find(w => w.id === selectedWorkspaceId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ backgroundColor: 'hsl(var(--surface-3))' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-2 text-foreground font-['Space_Grotesk']">
            Workspace Neua
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie suas tarefas e projetos de forma visual e organizada
          </p>
        </div>

        {/* Workspace Selector & Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <Select value={selectedWorkspaceId || ''} onValueChange={setSelectedWorkspaceId}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Selecione um workspace" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              {workspaces?.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Workspace
          </Button>
        </div>

        {selectedWorkspace && (
          <>
            {/* Filters & View Tabs */}
            <div className="flex flex-col gap-4 mb-6">
              <WorkspaceFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                responsibleFilter={responsibleFilter}
                onResponsibleChange={setResponsibleFilter}
                tagFilter={tagFilter}
                onTagChange={setTagFilter}
                dateFilter={dateFilter}
                onDateChange={setDateFilter}
                availableResponsibles={availableResponsibles}
                availableTags={availableTags}
                showCompleted={showCompleted}
                onShowCompletedChange={handleShowCompletedChange}
                completedCount={completedCount}
              />

              <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full sm:w-auto">
                <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
                  <TabsTrigger value="kanban" className="gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    <span className="hidden sm:inline">Kanban</span>
                  </TabsTrigger>
                  <TabsTrigger value="table" className="gap-2">
                    <TableIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Tabela</span>
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Calendário</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Views */}
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {view === 'kanban' && (
                <WorkspaceKanban
                  workspaceId={selectedWorkspace.id}
                  filterFn={filterTasks}
                />
              )}
              {view === 'table' && (
                <WorkspaceTable
                  workspaceId={selectedWorkspace.id}
                  filterFn={filterTasks}
                />
              )}
              {view === 'calendar' && (
                <WorkspaceCalendar
                  workspaceId={selectedWorkspace.id}
                  filterFn={filterTasks}
                />
              )}
            </motion.div>
          </>
        )}

        {!selectedWorkspace && workspaces.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <LayoutGrid className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum workspace criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro workspace para começar a organizar suas tarefas
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Workspace
            </Button>
          </motion.div>
        )}

        {!selectedWorkspace && workspaces.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <LayoutGrid className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Selecione um workspace</h3>
            <p className="text-muted-foreground">
              Escolha um workspace acima para visualizar suas tarefas
            </p>
          </motion.div>
        )}
      </motion.div>

      <CreateWorkspaceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
