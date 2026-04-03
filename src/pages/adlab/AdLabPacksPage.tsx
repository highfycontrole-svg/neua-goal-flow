import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Layers, 
  PlayCircle, 
  ChevronRight, 
  MoreVertical,
  Pencil,
  Trash2,
  Lightbulb,
  FlaskConical,
  CheckCircle2,
  Archive,
  Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { CreatePackDialog } from '@/components/adlab/CreatePackDialog';
import { EditPackDialog } from '@/components/adlab/EditPackDialog';

interface Pack {
  id: string;
  nome: string;
  insight_central: string | null;
  promessa_principal: string | null;
  status: string;
  created_at: string;
}

interface Produto {
  id: string;
  nome: string;
  categoria: string | null;
  foto_url: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  ideia: { label: 'Ideia', color: 'bg-yellow-500/20 text-yellow-500', icon: Lightbulb },
  em_teste: { label: 'Em Teste', color: 'bg-blue-500/20 text-blue-500', icon: FlaskConical },
  validado: { label: 'Validado', color: 'bg-green-500/20 text-green-500', icon: CheckCircle2 },
  arquivado: { label: 'Arquivado', color: 'bg-muted text-muted-foreground', icon: Archive },
};

const CATALOG_ID = 'catalogo';
const CAMPAIGN_PREFIX = 'campanha-';

export default function AdLabPacksPage() {
  const { produtoId } = useParams<{ produtoId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<Pack | null>(null);

  const isCatalog = produtoId === CATALOG_ID;
  const isCampaign = produtoId?.startsWith(CAMPAIGN_PREFIX) || false;
  const campaignId = isCampaign ? produtoId!.replace(CAMPAIGN_PREFIX, '') : null;

  // Fetch product details (only for real products)
  const { data: produto } = useQuery({
    queryKey: ['produto', produtoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, categoria, foto_url')
        .eq('id', produtoId)
        .single();

      if (error) throw error;
      return data as Produto;
    },
    enabled: !!produtoId && !isCatalog && !isCampaign,
  });

  // Fetch campaign details
  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
      if (error) throw error;
      return data as { id: string; name: string; description: string | null; status: string };
    },
    enabled: !!campaignId,
  });

  // Fetch packs
  const { data: packs = [], isLoading } = useQuery({
    queryKey: ['packs', isCatalog ? 'catalogo' : isCampaign ? `campaign-${campaignId}` : produtoId],
    queryFn: async () => {
      let query = supabase
        .from('ad_packs')
        .select('*')
        .order('created_at', { ascending: false });

      if (isCatalog) {
        query = query.is('produto_id', null).is('campaign_id', null);
      } else if (isCampaign) {
        query = query.eq('campaign_id', campaignId!);
      } else {
        query = query.eq('produto_id', produtoId!);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Pack[];
    },
    enabled: !!produtoId,
  });

  // Fetch anuncio counts per pack
  const { data: anuncioCounts = {} } = useQuery({
    queryKey: ['anuncio-counts-by-pack', produtoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_anuncios')
        .select('pack_id');

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach((anuncio: { pack_id: string }) => {
        counts[anuncio.pack_id] = (counts[anuncio.pack_id] || 0) + 1;
      });

      return counts;
    },
    enabled: !!produtoId,
  });

  // Delete pack mutation
  const deleteMutation = useMutation({
    mutationFn: async (packId: string) => {
      const { error } = await supabase.from('ad_packs').delete().eq('id', packId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packs', isCatalog ? 'catalogo' : isCampaign ? `campaign-${campaignId}` : produtoId] });
      queryClient.invalidateQueries({ queryKey: ['pack-counts'] });
      toast.success('Pack deletado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao deletar pack');
    },
  });

  const handleDeletePack = (packId: string) => {
    if (confirm('Tem certeza que deseja deletar este pack? Todos os anúncios vinculados serão removidos.')) {
      deleteMutation.mutate(packId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/adlab" onClick={(e) => { e.preventDefault(); navigate('/adlab'); }}>
              AD Lab
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {isCampaign ? (campaign?.name || 'Campanha') : isCatalog ? 'Catálogo Institucional' : (produto?.nome || 'Produto')}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/adlab')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            {isCampaign ? (
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Megaphone className="h-6 w-6 text-primary" />
              </div>
            ) : isCatalog ? (
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Layers className="h-6 w-6 text-primary" />
              </div>
            ) : produto?.foto_url ? (
              <img
                src={produto.foto_url}
                alt={produto.nome}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : null}
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isCampaign ? campaign?.name : isCatalog ? 'Catálogo Institucional' : produto?.nome}
              </h1>
              {isCampaign ? (
                <p className="text-sm text-muted-foreground">Campanha · Packs de anúncios</p>
              ) : isCatalog ? (
                <p className="text-sm text-muted-foreground">Anúncios de branding, coleção e institucionais</p>
              ) : produto?.categoria ? (
                <p className="text-sm text-muted-foreground">{produto.categoria}</p>
              ) : null}
            </div>
          </div>
        </div>

        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Pack
        </Button>
      </div>

      {/* Packs Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : packs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center bg-card rounded-xl border border-border">
          <Layers className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">Nenhum pack criado</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Crie packs (narrativas/ângulos criativos) para organizar seus anúncios
          </p>
          <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Pack
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packs.map((pack, index) => {
            const status = statusConfig[pack.status] || statusConfig.ideia;
            const StatusIcon = status.icon;
            const anuncioCount = anuncioCounts[pack.id] || 0;

            return (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl border border-border p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-4 w-4" style={{ color: status.color.includes('yellow') ? '#eab308' : status.color.includes('blue') ? '#3b82f6' : status.color.includes('green') ? '#22c55e' : '#6b7280' }} />
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingPack(pack)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeletePack(pack.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Content - Clickable */}
                <div 
                  className="cursor-pointer"
                  onClick={() => navigate(`/adlab/${isCatalog ? 'catalogo' : produtoId}/pack/${pack.id}`)}
                >
                  <h3 className="font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
                    {pack.nome}
                  </h3>

                  {pack.insight_central && (
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Insight</p>
                      <p className="text-sm text-foreground line-clamp-2">{pack.insight_central}</p>
                    </div>
                  )}

                  {pack.promessa_principal && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Promessa</p>
                      <p className="text-sm text-foreground line-clamp-2">{pack.promessa_principal}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-sm">
                      <PlayCircle className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">{anuncioCount} anúncios</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <CreatePackDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        produtoId={isCampaign ? null : isCatalog ? null : produtoId!}
        isCatalog={isCatalog}
        campaignId={campaignId}
      />

      {editingPack && (
        <EditPackDialog
          open={!!editingPack}
          onOpenChange={(open) => !open && setEditingPack(null)}
          pack={editingPack}
        />
      )}
    </div>
  );
}
