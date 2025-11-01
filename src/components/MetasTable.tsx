import { useState } from 'react';
import { motion } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { EditMetaDialog } from './EditMetaDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Meta {
  id: string;
  nome: string;
  tipo: 'numero' | 'texto' | 'percentual' | 'moeda';
  valor_meta: string;
  valor_realizado: string;
  status: boolean;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  setor_id: string;
  ano: number;
  mes: number;
  setores?: { nome: string };
}

interface MetasTableProps {
  metas: Meta[];
  superMetas: Meta[];
  setores: Array<{ id: string; nome: string }>;
  allMetas?: Array<{ id: string; nome: string }>;
  onUpdate: () => void;
  viewType?: 'geral' | 'por-setor' | 'resumo';
}

export function MetasTable({ metas, superMetas, setores, allMetas = [], onUpdate, viewType = 'geral' }: MetasTableProps) {
  const [editingItem, setEditingItem] = useState<{ item: Meta; tipo: 'meta' | 'super_meta' } | null>(null);

  const handleDelete = async (id: string, tipo: 'meta' | 'super_meta') => {
    if (!confirm(`Tem certeza que deseja excluir esta ${tipo === 'meta' ? 'meta' : 'super meta'}?`)) return;

    const { error } = await supabase
      .from(tipo === 'meta' ? 'metas' : 'super_metas')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir');
      return;
    }

    toast.success('Excluído com sucesso');
    onUpdate();
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean, tipo: 'meta' | 'super_meta') => {
    const { error } = await supabase
      .from(tipo === 'meta' ? 'metas' : 'super_metas')
      .update({ status: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar status');
      return;
    }

    toast.success('Status atualizado');
    onUpdate();
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'Alta': return 'destructive';
      case 'Média': return 'default';
      case 'Baixa': return 'secondary';
      default: return 'default';
    }
  };

  const renderTable = (items: Meta[], tipo: 'meta' | 'super_meta', title: string) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-neua p-6 mb-6"
    >
      <h3 className="text-xl font-display font-semibold mb-4">{title}</h3>
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Status</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Meta</TableHead>
              <TableHead>Realizado</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Período</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Nenhum item encontrado
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(item.id, item.status, tipo)}
                      className="p-0 h-8 w-8"
                    >
                      {item.status ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell>{item.setores?.nome || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.tipo}</Badge>
                  </TableCell>
                  <TableCell>{item.valor_meta}</TableCell>
                  <TableCell>{item.valor_realizado || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(item.prioridade)}>
                      {item.prioridade}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(2000, item.mes - 1).toLocaleString('pt-BR', { month: 'short' })}/{item.ano}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingItem({ item, tipo })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id, tipo)}
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
    </motion.div>
  );

  if (viewType === 'por-setor') {
    return (
      <>
        {setores.map((setor) => {
          const setorMetas = metas.filter(m => m.setor_id === setor.id);
          const setorSuperMetas = superMetas.filter(sm => sm.setor_id === setor.id);
          if (setorMetas.length === 0 && setorSuperMetas.length === 0) return null;

          return (
            <div key={setor.id} className="mb-8">
              <h2 className="text-2xl font-display font-bold mb-4">{setor.nome}</h2>
              {setorMetas.length > 0 && renderTable(setorMetas, 'meta', 'Metas')}
              {setorSuperMetas.length > 0 && renderTable(setorSuperMetas, 'super_meta', 'Super Metas')}
            </div>
          );
        })}
        {editingItem && (
          <EditMetaDialog
            meta={editingItem.item}
            tipo={editingItem.tipo}
            setores={setores}
            metas={allMetas}
            open={!!editingItem}
            onOpenChange={(open) => {
              if (!open) setEditingItem(null);
            }}
            onSuccess={() => {
              onUpdate();
              setEditingItem(null);
            }}
          />
        )}
      </>
    );
  }

  if (viewType === 'resumo') {
    const allItems = [
      ...metas.map(m => ({ ...m, _tipo: 'meta' as const })),
      ...superMetas.map(sm => ({ ...sm, _tipo: 'super_meta' as const }))
    ];

    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-neua p-6"
        >
          <h3 className="text-xl font-display font-semibold mb-4">Resumo Geral</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="card-neua-elevated p-4">
              <p className="text-sm text-muted-foreground">Total de Itens</p>
              <p className="text-3xl font-bold">{allItems.length}</p>
            </div>
            <div className="card-neua-elevated p-4">
              <p className="text-sm text-muted-foreground">Concluídos</p>
              <p className="text-3xl font-bold text-green-500">
                {allItems.filter(i => i.status).length}
              </p>
            </div>
            <div className="card-neua-elevated p-4">
              <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
              <p className="text-3xl font-bold">
                {allItems.length > 0 
                  ? Math.round((allItems.filter(i => i.status).length / allItems.length) * 100)
                  : 0}%
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Status</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead>Realizado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(item.id, item.status, item._tipo)}
                        className="p-0 h-8 w-8"
                      >
                        {item.status ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item._tipo === 'meta' ? 'default' : 'secondary'}>
                        {item._tipo === 'meta' ? 'Meta' : 'Super Meta'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>{item.setores?.nome || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(item.prioridade)}>
                        {item.prioridade}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.valor_meta}</TableCell>
                    <TableCell>{item.valor_realizado || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingItem({ item, tipo: item._tipo })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id, item._tipo)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>
        {editingItem && (
          <EditMetaDialog
            meta={editingItem.item}
            tipo={editingItem.tipo}
            setores={setores}
            metas={allMetas}
            open={!!editingItem}
            onOpenChange={(open) => {
              if (!open) setEditingItem(null);
            }}
            onSuccess={() => {
              onUpdate();
              setEditingItem(null);
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      {renderTable(metas, 'meta', 'Metas')}
      {renderTable(superMetas, 'super_meta', 'Super Metas')}
      {editingItem && (
        <EditMetaDialog
          meta={editingItem.item}
          tipo={editingItem.tipo}
          setores={setores}
          metas={allMetas}
          open={!!editingItem}
          onOpenChange={(open) => {
            if (!open) setEditingItem(null);
          }}
          onSuccess={() => {
            onUpdate();
            setEditingItem(null);
          }}
        />
      )}
    </>
  );
}
