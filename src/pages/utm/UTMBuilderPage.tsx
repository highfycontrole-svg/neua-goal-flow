import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { buildUTMUrl } from '@/types/utm';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Copy, Trash2, Edit, Link2, Download, ClipboardCopy, CopyPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';

const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function UTMBuilderPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [linkSearch, setLinkSearch] = useState('');
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [editingLink, setEditingLink] = useState<any>(null);

  // Campaign form
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignColor, setCampaignColor] = useState('#3b82f6');

  // Link form
  const [linkLabel, setLinkLabel] = useState('');
  const [linkBaseUrl, setLinkBaseUrl] = useState('');
  const [linkUtmCampaign, setLinkUtmCampaign] = useState('');
  const [linkUtmSource, setLinkUtmSource] = useState('');
  const [linkUtmMedium, setLinkUtmMedium] = useState('');
  const [linkUtmTerm, setLinkUtmTerm] = useState('');
  const [linkUtmContent, setLinkUtmContent] = useState('');

  // Queries
  const { data: campaigns = [] } = useQuery({
    queryKey: ['utm-campaigns', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('utm_campaigns')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: links = [] } = useQuery({
    queryKey: ['utm-links', selectedCampaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('utm_links')
        .select('*')
        .eq('campaign_id', selectedCampaignId!)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCampaignId && !!user?.id,
  });

  // Link counts per campaign
  const { data: linkCounts = {} } = useQuery({
    queryKey: ['utm-link-counts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('utm_links')
        .select('campaign_id')
        .eq('user_id', user?.id);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach(l => { counts[l.campaign_id] = (counts[l.campaign_id] || 0) + 1; });
      return counts;
    },
    enabled: !!user?.id,
  });

  // Mutations
  const saveCampaign = useMutation({
    mutationFn: async () => {
      if (editingCampaign) {
        const { error } = await supabase.from('utm_campaigns').update({
          name: campaignName, description: campaignDescription, color: campaignColor,
        }).eq('id', editingCampaign.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('utm_campaigns').insert({
          user_id: user?.id, name: campaignName, description: campaignDescription, color: campaignColor,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utm-campaigns'] });
      setIsCampaignDialogOpen(false);
      resetCampaignForm();
      toast.success(editingCampaign ? 'Campanha atualizada!' : 'Campanha criada!');
    },
    onError: () => toast.error('Erro ao salvar campanha'),
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('utm_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utm-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['utm-link-counts'] });
      if (selectedCampaignId) setSelectedCampaignId(null);
      toast.success('Campanha excluída!');
    },
  });

  const saveLink = useMutation({
    mutationFn: async () => {
      const payload = {
        campaign_id: selectedCampaignId!, user_id: user?.id!,
        label: linkLabel || null, base_url: linkBaseUrl, utm_campaign: linkUtmCampaign,
        utm_source: linkUtmSource, utm_medium: linkUtmMedium,
        utm_term: linkUtmTerm || null, utm_content: linkUtmContent || null,
      };
      if (editingLink) {
        const { error } = await supabase.from('utm_links').update(payload).eq('id', editingLink.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('utm_links').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utm-links'] });
      queryClient.invalidateQueries({ queryKey: ['utm-link-counts'] });
      setIsLinkDialogOpen(false);
      resetLinkForm();
      toast.success(editingLink ? 'Link atualizado!' : 'Link criado!');
    },
    onError: () => toast.error('Erro ao salvar link'),
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('utm_links').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utm-links'] });
      queryClient.invalidateQueries({ queryKey: ['utm-link-counts'] });
      toast.success('Link excluído!');
    },
  });

  const duplicateLink = useMutation({
    mutationFn: async (link: any) => {
      const { error } = await supabase.from('utm_links').insert({
        campaign_id: link.campaign_id, user_id: user?.id!,
        label: (link.label || '') + ' (cópia)', base_url: link.base_url,
        utm_campaign: link.utm_campaign, utm_source: link.utm_source,
        utm_medium: link.utm_medium, utm_term: link.utm_term, utm_content: link.utm_content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utm-links'] });
      queryClient.invalidateQueries({ queryKey: ['utm-link-counts'] });
      toast.success('Link duplicado!');
    },
  });

  // Helpers
  const resetCampaignForm = () => { setCampaignName(''); setCampaignDescription(''); setCampaignColor('#3b82f6'); setEditingCampaign(null); };
  const resetLinkForm = () => { setLinkLabel(''); setLinkBaseUrl(''); setLinkUtmCampaign(''); setLinkUtmSource(''); setLinkUtmMedium(''); setLinkUtmTerm(''); setLinkUtmContent(''); setEditingLink(null); };

  const openEditCampaign = (c: any) => {
    setEditingCampaign(c); setCampaignName(c.name); setCampaignDescription(c.description || ''); setCampaignColor(c.color); setIsCampaignDialogOpen(true);
  };

  const openNewLink = () => {
    resetLinkForm();
    const camp = campaigns.find(c => c.id === selectedCampaignId);
    if (camp) setLinkUtmCampaign(camp.name.toLowerCase().replace(/\s+/g, '_'));
    setIsLinkDialogOpen(true);
  };

  const openEditLink = (l: any) => {
    setEditingLink(l); setLinkLabel(l.label || ''); setLinkBaseUrl(l.base_url); setLinkUtmCampaign(l.utm_campaign); setLinkUtmSource(l.utm_source); setLinkUtmMedium(l.utm_medium); setLinkUtmTerm(l.utm_term || ''); setLinkUtmContent(l.utm_content || ''); setIsLinkDialogOpen(true);
  };

  const previewUrl = useMemo(() => {
    if (!linkBaseUrl || !linkUtmCampaign || !linkUtmSource || !linkUtmMedium) return '';
    return buildUTMUrl({ base_url: linkBaseUrl, utm_campaign: linkUtmCampaign, utm_source: linkUtmSource, utm_medium: linkUtmMedium, utm_term: linkUtmTerm || undefined, utm_content: linkUtmContent || undefined });
  }, [linkBaseUrl, linkUtmCampaign, linkUtmSource, linkUtmMedium, linkUtmTerm, linkUtmContent]);

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success('URL copiada!'); };

  const copyAllLinks = () => {
    const urls = filteredLinks.map(l => buildUTMUrl(l)).join('\n');
    navigator.clipboard.writeText(urls);
    toast.success(`${filteredLinks.length} URLs copiadas!`);
  };

  const exportCSV = () => {
    const headers = 'Label,URL Base,utm_campaign,utm_source,utm_medium,utm_term,utm_content,URL Completa';
    const rows = filteredLinks.map(l => `"${l.label || ''}","${l.base_url}","${l.utm_campaign}","${l.utm_source}","${l.utm_medium}","${l.utm_term || ''}","${l.utm_content || ''}","${buildUTMUrl(l)}"`);
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `utm-links-${selectedCampaign?.name || 'export'}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado!');
  };

  const filteredCampaigns = campaigns.filter(c => c.name.toLowerCase().includes(campaignSearch.toLowerCase()));
  const filteredLinks = links.filter(l => (l.label || '').toLowerCase().includes(linkSearch.toLowerCase()) || l.base_url.toLowerCase().includes(linkSearch.toLowerCase()) || l.utm_source.toLowerCase().includes(linkSearch.toLowerCase()));
  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="UTM Builder" description="Crie e gerencie seus links UTM por campanha" icon={Link2} />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Campaign Panel */}
        <div className="bg-background rounded-xl border border-border/30 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold">Campanhas</h2>
            <Button size="sm" onClick={() => { resetCampaignForm(); setIsCampaignDialogOpen(true); }} className="gap-1.5">
              <Plus className="h-4 w-4" /> Nova
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={campaignSearch} onChange={e => setCampaignSearch(e.target.value)} className="pl-9 bg-background" />
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            <AnimatePresence>
              {filteredCampaigns.map((c, i) => (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedCampaignId(c.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${selectedCampaignId === c.id ? 'border-primary/50 bg-primary/5 shadow-sm shadow-primary/20' : 'border-border/30 hover:border-border/60'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="font-medium text-sm truncate flex-1">{c.name}</span>
                    <Badge variant="secondary" className="text-[10px]">{linkCounts[c.id] || 0}</Badge>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
            {filteredCampaigns.length === 0 && (
              <div className="text-center py-8">
                <Link2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Crie sua primeira campanha UTM</p>
              </div>
            )}
          </div>
        </div>

        {/* Links Panel */}
        <div className="bg-card rounded-xl border border-border/30 p-4 space-y-4">
          {!selectedCampaign ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Link2 className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">Selecione uma campanha</p>
              <p className="text-sm">Escolha uma campanha para ver e gerenciar seus links UTM</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedCampaign.color }} />
                  <h2 className="font-display font-semibold text-lg">{selectedCampaign.name}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={openNewLink} className="gap-1.5"><Plus className="h-4 w-4" /> Novo Link</Button>
                  <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1.5"><Download className="h-4 w-4" /> CSV</Button>
                  <Button size="sm" variant="outline" onClick={copyAllLinks} className="gap-1.5"><ClipboardCopy className="h-4 w-4" /> Copiar Todos</Button>
                  <Button size="sm" variant="ghost" onClick={() => openEditCampaign(selectedCampaign)}><Edit className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
                        <AlertDialogDescription>Todos os links desta campanha serão excluídos permanentemente.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteCampaign.mutate(selectedCampaign.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar links..." value={linkSearch} onChange={e => setLinkSearch(e.target.value)} className="pl-9" />
              </div>

              {filteredLinks.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Label</TableHead>
                        <TableHead>URL Base</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Medium</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>URL Gerada</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredLinks.map((l, i) => {
                          const fullUrl = buildUTMUrl(l);
                          return (
                            <motion.tr
                              key={l.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.02 }}
                              className="border-b border-border/20 hover:bg-primary/5 transition-colors"
                            >
                              <TableCell className="font-medium text-sm">{l.label || '-'}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{l.base_url}</TableCell>
                              <TableCell className="text-xs">{l.utm_source}</TableCell>
                              <TableCell className="text-xs">{l.utm_medium}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{l.utm_term || '-'}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{l.utm_content || '-'}</TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="font-mono text-xs text-primary bg-primary/10 rounded px-2 py-1 truncate max-w-[200px] inline-block cursor-pointer" onClick={() => copyToClipboard(fullUrl)}>
                                      {fullUrl}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm break-all">{fullUrl}</TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-1">
                                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(fullUrl)}><Copy className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Copiar URL</TooltipContent></Tooltip>
                                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateLink.mutate(l)}><CopyPlus className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Duplicar</TooltipContent></Tooltip>
                                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditLink(l)}><Edit className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
                                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteLink.mutate(l.id)}><Trash2 className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Excluir</TooltipContent></Tooltip>
                                </div>
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Link2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum link nesta campanha</p>
                  <Button size="sm" onClick={openNewLink} className="mt-3 gap-1.5"><Plus className="h-4 w-4" /> Criar primeiro link</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Campaign Dialog */}
      <Dialog open={isCampaignDialogOpen} onOpenChange={(o) => { setIsCampaignDialogOpen(o); if (!o) resetCampaignForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Ex: Instagram Abril 2026" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={campaignDescription} onChange={e => setCampaignDescription(e.target.value)} placeholder="Descrição opcional..." />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 mt-2">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => setCampaignColor(c)} className={`w-8 h-8 rounded-full transition-all ${campaignColor === c ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCampaignDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveCampaign.mutate()} disabled={!campaignName.trim() || saveCampaign.isPending}>
              {saveCampaign.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={(o) => { setIsLinkDialogOpen(o); if (!o) resetLinkForm(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLink ? 'Editar Link UTM' : 'Novo Link UTM'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Label</Label>
              <Input value={linkLabel} onChange={e => setLinkLabel(e.target.value)} placeholder="Ex: Story - Link Bio" />
            </div>
            <div>
              <Label>URL Base *</Label>
              <Input value={linkBaseUrl} onChange={e => setLinkBaseUrl(e.target.value)} placeholder="https://loja.neua.com.br/produto" />
            </div>
            <div>
              <Label>utm_campaign *</Label>
              <Input value={linkUtmCampaign} onChange={e => setLinkUtmCampaign(e.target.value)} placeholder="nome_campanha" />
            </div>
            <div>
              <Label>utm_source *</Label>
              <Input value={linkUtmSource} onChange={e => setLinkUtmSource(e.target.value)} placeholder="instagram, email, google..." />
            </div>
            <div>
              <Label>utm_medium *</Label>
              <Input value={linkUtmMedium} onChange={e => setLinkUtmMedium(e.target.value)} placeholder="stories, feed, cpc..." />
            </div>
            <div>
              <Label>utm_term</Label>
              <Input value={linkUtmTerm} onChange={e => setLinkUtmTerm(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="sm:col-span-2">
              <Label>utm_content</Label>
              <Input value={linkUtmContent} onChange={e => setLinkUtmContent(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          {previewUrl && (
            <div className="mt-4 p-3 rounded-lg bg-background border border-border/30">
              <Label className="text-xs text-muted-foreground mb-1 block">Preview da URL</Label>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs text-primary break-all flex-1">{previewUrl}</p>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(previewUrl)}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {previewUrl && <Button variant="outline" onClick={() => copyToClipboard(previewUrl)} className="gap-1.5"><Copy className="h-4 w-4" /> Copiar URL</Button>}
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveLink.mutate()} disabled={!linkBaseUrl || !linkUtmCampaign || !linkUtmSource || !linkUtmMedium || saveLink.isPending}>
              {saveLink.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
