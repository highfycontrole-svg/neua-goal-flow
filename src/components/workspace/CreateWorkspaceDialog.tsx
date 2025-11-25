import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({ open, onOpenChange }: CreateWorkspaceDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !name.trim()) return;

    setIsLoading(true);
    try {
      // Criar workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert([{ user_id: user.id, name: name.trim() }])
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      // Criar status padrão
      const defaultStatuses = [
        { name: 'A Fazer', color: '#6B7280', order_index: 0 },
        { name: 'Em Progresso', color: '#3B82F6', order_index: 1 },
        { name: 'Em Revisão', color: '#F59E0B', order_index: 2 },
        { name: 'Concluído', color: '#10B981', order_index: 3 },
      ];

      const statusInserts = defaultStatuses.map(status => ({
        workspace_id: workspace.id,
        ...status,
      }));

      const { error: statusError } = await supabase
        .from('workspace_statuses')
        .insert(statusInserts);

      if (statusError) throw statusError;

      toast({
        title: 'Workspace criado!',
        description: `O workspace "${name}" foi criado com sucesso.`,
      });

      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setName('');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao criar workspace',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Workspace</Label>
              <Input
                id="name"
                placeholder="Ex: Scrum Diário, Linha Editorial..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Workspace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
