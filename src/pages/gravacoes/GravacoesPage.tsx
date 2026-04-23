import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Video, ExternalLink, Trash2, Pencil, Link2, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';

interface Gravacao {
  id: string;
  titulo: string;
  descricao: string | null;
  link_arquivo: string | null;
  tags: string[] | null;
  origem: string;
  origem_id: string | null;
  status: string;
  created_at: string;
}

const ORIGEM_LABEL: Record<string, string> = {
  manual: 'Manual',
  workspace: 'Workspace',
  adlab: 'AdLab',
};

const ORIGEM_COLOR: Record<string, string> = {
  manual: 'bg-slate-500/20 text-slate-300',
  workspace: 'bg-blue-500/20 text-blue-400',
  adlab: 'bg-violet-500/20 text-violet-400',
};

export default function GravacoesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Gravacao | null>(null);
  const [linkEditing, setLinkEditing] = useState<string | null>(null);
  const [linkDraft, setLinkDraft] = useState('');
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    link_arquivo: '',
    status: 'pendente',
    tagsInput: '',
    tags: [] as string[],
  });

  const { data: gravacoes = [], isLoading } = useQuery({
    queryKey: ['gravacoes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gravacoes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Gravacao[];
    },
    enabled: !!user?.id,
  });

  // Resolve titles for origem references
  const adlabIds = useMemo(
    () => gravacoes.filter(g => g.origem === 'adlab' && g.origem_id).map(g => g.origem_id!),
    [gravacoes],
  );
  const workspaceIds = useMemo(
    () => gravacoes.filter(g => g.origem === 'workspace' && g.origem_id).map(g => g.origem_id!),
    [gravacoes],
  );

  const { data: anuncios = [] } = useQuery({
    queryKey: ['gravacoes-anuncios', adlabIds],
    queryFn: async () => {
      if (adlabIds.length === 0) return [];
      const { data, error } = await supabase
        .from('ad_anuncios')
        .select('id, titulo, pack_id')
        .in('id', adlabIds);
      if (error) throw error;
      return data;
    },
    enabled: adlabIds.length > 0,
  });

  const { data: tarefas = [] } = useQuery({
    queryKey: ['gravacoes-tarefas', workspaceIds],
    queryFn: async () => {
      if (workspaceIds.length === 0) return [];
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, title, workspace_id')
        .in('id', workspaceIds);
      if (error) throw error;
      return data;
    },
    enabled: workspaceIds.length > 0,
  });

  const filtered = useMemo(() => {
    return gravacoes.filter(g => {
      if (filter === 'todos') return true;
      if (['pendente', 'gravado'].includes(filter)) return g.status === filter;
      return g.origem === filter;
    });
  }, [gravacoes, filter]);

  const resetForm = () => {
    setForm({ titulo: '', descricao: '', link_arquivo: '', status: 'pendente', tagsInput: '', tags: [] });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (g: Gravacao) => {
    setEditing(g);
    setForm({
      titulo: g.titulo,
      descricao: g.descricao || '',
      link_arquivo: g.link_arquivo || '',
      status: g.status,
      tagsInput: '',
      tags: g.tags || [],
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        titulo: form.titulo,
        descricao: form.descricao || null,
        link_arquivo: form.link_arquivo || null,
        tags: form.tags,
        status: form.status,
      };
      if (editing) {
        const { error } = await supabase.from('gravacoes').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('gravacoes').insert({ ...payload, origem: 'manual' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gravacoes'] });
      toast.success(editing ? 'Gravação atualizada' : 'Gravação criada');
      setDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error('Erro ao salvar gravação'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gravacoes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gravacoes'] });
      toast.success('Gravação excluída');
    },
  });

  const updateLinkMutation = useMutation({
    mutationFn: async ({ id, link }: { id: string; link: string }) => {
      const { error } = await supabase
        .from('gravacoes')
        .update({ link_arquivo: link || null, status: link ? 'gravado' : 'pendente' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gravacoes'] });
      setLinkEditing(null);
      setLinkDraft('');
      toast.success('Link atualizado');
    },
  });

  const addTag = () => {
    const t = form.tagsInput.trim();
    if (!t) return;
    if (!form.tags.includes(t)) {
      setForm({ ...form, tags: [...form.tags, t], tagsInput: '' });
    } else {
      setForm({ ...form, tagsInput: '' });
    }
  };

  const removeTag = (t: string) => {
    setForm({ ...form, tags: form.tags.filter(x => x !== t) });
  };

  const renderOrigemLink = (g: Gravacao) => {
    if (g.origem === 'adlab' && g.origem_id) {
      const anuncio = anuncios.find(a => a.id === g.origem_id);
      if (!anuncio) return null;
      return (
        <button
          onClick={() => navigate(`/adlab`)}
          className="text-xs text-violet-400 hover:underline truncate max-w-full"
        >
          📺 {anuncio.titulo}
        </button>
      );
    }
    if (g.origem === 'workspace' && g.origem_id) {
      const tarefa = tarefas.find(t => t.id === g.origem_id);
      if (!tarefa) return null;
      return (
        <button
          onClick={() => navigate(`/workspace/${tarefa.workspace_id}`)}
          className="text-xs text-blue-400 hover:underline truncate max-w-full"
        >
          ✅ {tarefa.title}
        </button>
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-card min-h-full space-y-6">
      <PageHeader
        title="Gravações"
        description="Centralize suas gravações pendentes e prontas"
        actions={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Gravação
          </Button>
        }
      />

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="gravado">Gravados</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="adlab">AdLab</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="md" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border">
          <EmptyState
            icon={Video}
            title="Nenhuma gravação"
            description="Crie sua primeira gravação manual ou marque tarefas/anúncios como 'precisa gravar'"
            action={{ label: 'Nova Gravação', onClick: openCreate }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g, idx) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-card rounded-xl border border-border p-5 hover:border-primary/50 transition-all flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <Badge className={g.status === 'gravado' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}>
                    {g.status === 'gravado' ? 'Gravado' : 'Pendente'}
                  </Badge>
                  <Badge className={ORIGEM_COLOR[g.origem] || ORIGEM_COLOR.manual}>
                    {ORIGEM_LABEL[g.origem] || g.origem}
                  </Badge>
                </div>
                {g.link_arquivo && (
                  <a
                    href={g.link_arquivo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                    title="Abrir link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-foreground line-clamp-2">{g.titulo}</h3>
                {g.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{g.descricao}</p>
                )}
              </div>

              {g.tags && g.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {g.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">{tag}</span>
                  ))}
                </div>
              )}

              {(g.origem === 'adlab' || g.origem === 'workspace') && (
                <div className="text-xs text-muted-foreground">
                  Origem: {renderOrigemLink(g) || <span className="italic">Item removido</span>}
                </div>
              )}

              {linkEditing === g.id ? (
                <div className="flex gap-2">
                  <Input
                    value={linkDraft}
                    onChange={(e) => setLinkDraft(e.target.value)}
                    placeholder="https://..."
                    autoFocus
                  />
                  <Button size="sm" onClick={() => updateLinkMutation.mutate({ id: g.id, link: linkDraft })}>
                    Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setLinkEditing(null); setLinkDraft(''); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => { setLinkEditing(g.id); setLinkDraft(g.link_arquivo || ''); }}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    {g.link_arquivo ? 'Editar link' : 'Adicionar link'}
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => openEdit(g)}>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" /> Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir gravação?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(g.id)} className="bg-destructive">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Gravação' : 'Nova Gravação'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); if (!form.titulo.trim()) { toast.error('Título obrigatório'); return; } saveMutation.mutate(); }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Link do Arquivo</Label>
              <Input
                placeholder="https://drive.google.com/..."
                value={form.link_arquivo}
                onChange={(e) => setForm({ ...form, link_arquivo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar tag e Enter"
                  value={form.tagsInput}
                  onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                />
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                      {t}
                      <button type="button" onClick={() => removeTag(t)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="gravado">Gravado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}