import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, LayoutGrid, Table as TableIcon, Calendar as CalendarIcon, Search } from 'lucide-react';
import { CreateWorkspaceDialog } from '@/components/workspace/CreateWorkspaceDialog';
import { WorkspaceKanban } from '@/components/workspace/WorkspaceKanban';
import { WorkspaceTable } from '@/components/workspace/WorkspaceTable';
import { WorkspaceCalendar } from '@/components/workspace/WorkspaceCalendar';
import { motion } from 'framer-motion';

export default function WorkspaceNeua() {
  const { user } = useAuth();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [view, setView] = useState<'kanban' | 'table' | 'calendar'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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

  const selectedWorkspace = workspaces?.find(w => w.id === selectedWorkspaceId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground font-['Space_Grotesk']">
            Workspace Neua
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas tarefas e projetos de forma visual e organizada
          </p>
        </div>

        {/* Workspace Selector & Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Select value={selectedWorkspaceId || ''} onValueChange={setSelectedWorkspaceId}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Selecione um workspace" />
            </SelectTrigger>
            <SelectContent>
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
            {/* Search & View Tabs */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
              <div className="relative w-full md:w-[400px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tarefas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-auto">
                <TabsList>
                  <TabsTrigger value="kanban" className="gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    Kanban
                  </TabsTrigger>
                  <TabsTrigger value="table" className="gap-2">
                    <TableIcon className="h-4 w-4" />
                    Tabela
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Calendário
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
                  searchQuery={searchQuery}
                />
              )}
              {view === 'table' && (
                <WorkspaceTable
                  workspaceId={selectedWorkspace.id}
                  searchQuery={searchQuery}
                />
              )}
              {view === 'calendar' && (
                <WorkspaceCalendar
                  workspaceId={selectedWorkspace.id}
                  searchQuery={searchQuery}
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
