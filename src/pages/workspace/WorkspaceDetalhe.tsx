import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, LayoutGrid, Table as TableIcon, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { CreateTaskDialog } from '@/components/workspace/CreateTaskDialog';
import { WorkspaceKanban } from '@/components/workspace/WorkspaceKanban';
import { WorkspaceTable } from '@/components/workspace/WorkspaceTable';
import { WorkspaceCalendar } from '@/components/workspace/WorkspaceCalendar';
import { WorkspaceFilters } from '@/components/workspace/WorkspaceFilters';
import { motion } from 'framer-motion';
import { isToday, isThisWeek, isThisMonth, isBefore, startOfDay } from 'date-fns';

export default function WorkspaceDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<'kanban' | 'table' | 'calendar'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [responsibleFilter, setResponsibleFilter] = useState('todos');
  const [tagFilter, setTagFilter] = useState('todas');
  const [dateFilter, setDateFilter] = useState('todas');
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(() => {
    return localStorage.getItem('neua-workspace-show-completed') === 'true';
  });

  const { data: workspace, isLoading: loadingWorkspace } = useQuery({
    queryKey: ['workspace', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['workspace-tasks', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('*, workspace_subtasks(*)')
        .eq('workspace_id', id!)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ['workspace-statuses', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_statuses')
        .select('*')
        .eq('workspace_id', id!)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
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
    if (!showCompleted && completedStatusIds.includes(task.status_id || '')) {
      return false;
    }

    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesResponsible = responsibleFilter === 'todos' || 
      task.responsible === responsibleFilter;
    
    const matchesTag = tagFilter === 'todas' || 
      (task.tags && task.tags.includes(tagFilter));
    
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

  if (loadingWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Workspace não encontrado</p>
        <Button onClick={() => navigate('/workspace')} variant="outline">
          Voltar para Workspaces
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8" style={{ backgroundColor: '#242424', minHeight: '100%' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/workspace')}
            className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground font-['Space_Grotesk']">
            {workspace.name}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Gerencie as tarefas deste workspace
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between">
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
            <Button onClick={() => setIsCreateTaskOpen(true)} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>

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
              workspaceId={workspace.id}
              filterFn={filterTasks}
            />
          )}
          {view === 'table' && (
            <WorkspaceTable
              workspaceId={workspace.id}
              filterFn={filterTasks}
            />
          )}
          {view === 'calendar' && (
            <WorkspaceCalendar
              workspaceId={workspace.id}
              filterFn={filterTasks}
            />
          )}
        </motion.div>
      </motion.div>

      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        workspaceId={workspace.id}
      />
    </div>
  );
}
