import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreateArquitetoDialog } from './CreateArquitetoDialog';
import { EditArquitetoDialog } from './EditArquitetoDialog';

interface Arquiteto {
  id: string;
  nome_completo: string;
  arroba_principal: string;
  email_contato: string;
  telefone_contato: string;
  classificacao_tier: string;
  status_arquiteto: string;
  cupom_exclusivo: string;
  data_entrada_club: string;
}

interface RegistroArquitetosProps {
  onSelectArquiteto: (id: string) => void;
}

export function RegistroArquitetos({ onSelectArquiteto }: RegistroArquitetosProps) {
  const { user } = useAuth();
  const [arquitetos, setArquitetos] = useState<Arquiteto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArquiteto, setSelectedArquiteto] = useState<Arquiteto | null>(null);

  useEffect(() => {
    if (user) loadArquitetos();
  }, [user]);

  const loadArquitetos = async () => {
    try {
      const { data, error } = await supabase
        .from('arquitetos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArquitetos(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar arquitetos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este arquiteto?')) return;

    try {
      const { error } = await supabase
        .from('arquitetos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Arquiteto excluído com sucesso');
      loadArquitetos();
    } catch (error: any) {
      toast.error('Erro ao excluir arquiteto');
      console.error(error);
    }
  };

  const getTierColor = (tier: string) => {
    const colors = {
      'Bronze': 'bg-orange-900/20 text-orange-400 border-orange-400/30',
      'Prata': 'bg-gray-500/20 text-gray-300 border-gray-400/30',
      'Ouro': 'bg-yellow-600/20 text-yellow-400 border-yellow-400/30',
      'Platina': 'bg-cyan-600/20 text-cyan-400 border-cyan-400/30'
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-500/20 text-gray-300';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Ativo': 'bg-green-900/20 text-green-400 border-green-400/30',
      'Em Análise': 'bg-yellow-900/20 text-yellow-400 border-yellow-400/30',
      'Pausado': 'bg-orange-900/20 text-orange-400 border-orange-400/30',
      'Desligado': 'bg-red-900/20 text-red-400 border-red-400/30'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Registro de Arquitetos</h2>
        <CreateArquitetoDialog onSuccess={loadArquitetos} />
      </div>

      <div className="card-neua overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Nome</TableHead>
              <TableHead>Arroba</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cupom</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {arquitetos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum arquiteto cadastrado ainda
                </TableCell>
              </TableRow>
            ) : (
              arquitetos.map((arquiteto) => (
                <TableRow
                  key={arquiteto.id}
                  className="border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => onSelectArquiteto(arquiteto.id)}
                >
                  <TableCell className="font-medium">{arquiteto.nome_completo}</TableCell>
                  <TableCell className="text-primary">{arquiteto.arroba_principal}</TableCell>
                  <TableCell className="text-muted-foreground">{arquiteto.email_contato}</TableCell>
                  <TableCell className="text-muted-foreground">{arquiteto.telefone_contato}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTierColor(arquiteto.classificacao_tier)}>
                      {arquiteto.classificacao_tier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(arquiteto.status_arquiteto)}>
                      {arquiteto.status_arquiteto}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{arquiteto.cupom_exclusivo}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedArquiteto(arquiteto)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(arquiteto.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedArquiteto && (
        <EditArquitetoDialog
          arquiteto={selectedArquiteto}
          open={!!selectedArquiteto}
          onOpenChange={(open) => !open && setSelectedArquiteto(null)}
          onSuccess={loadArquitetos}
        />
      )}
    </div>
  );
}
