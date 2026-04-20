import { useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Grid, List, ChevronRight, Layers, PlayCircle, Library, Building2, Megaphone, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { AdLabDashboard } from '@/components/adlab/AdLabDashboard';
import { PageHeader } from '@/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateCampaignDialog } from '@/components/adlab/CreateCampaignDialog';
import { EditCampaignDialog } from '@/components/adlab/EditCampaignDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Produto {
  id: string;
  nome: string;
  categoria: string | null;
  status: string;
  foto_url: string | null;
}

interface PackCount {
  produto_id: string;
  total: number;
  validados: number;
}

interface AnuncioCount {
  produto_id: string;
  total: number;
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
}

// Virtual catalog ID for institutional ads
const CATALOG_ID = 'catalogo';
const CAMPAIGN_PREFIX = 'campanha-';

const campaignStatusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-yellow-500/20 text-yellow-500' },
  active: { label: 'Ativa', color: 'bg-green-500/20 text-green-500' },
  paused: { label: 'Pausada', color: 'bg-orange-500/20 text-orange-500' },
};

export default function AdLabPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Fetch products from catalog
  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos-adlab', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, categoria, status, foto_url')
        .order('nome', { ascending: true });

      if (error) throw error;
      return data as Produto[];
    },
    enabled: !!user?.id,
  });

  // Fetch pack counts per product (including catalog)
  const { data: packCounts = [] } = useQuery({
    queryKey: ['pack-counts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_packs')
        .select('produto_id, campaign_id, status');

      if (error) throw error;

      const counts: Record<string, PackCount> = {};
      (data || []).forEach((pack: { produto_id: string | null; campaign_id: string | null; status: string }) => {
        // Skip campaign packs from product/catalog counts
        if (pack.campaign_id) return;
        const prodId = pack.produto_id || CATALOG_ID;
        if (!counts[prodId]) {
          counts[prodId] = { produto_id: prodId, total: 0, validados: 0 };
        }
        counts[prodId].total++;
        if (pack.status === 'validado') {
          counts[prodId].validados++;
        }
      });

      return Object.values(counts);
    },
    enabled: !!user?.id,
  });

  // Fetch anuncio counts per product (through packs)
  const { data: anuncioCounts = [] } = useQuery({
    queryKey: ['anuncio-counts', user?.id],
    queryFn: async () => {
      const { data: packs, error: packsError } = await supabase
        .from('ad_packs')
        .select('id, produto_id');

      if (packsError) throw packsError;

      const { data: anuncios, error: anunciosError } = await supabase
        .from('ad_anuncios')
        .select('pack_id');

      if (anunciosError) throw anunciosError;

      const packToProduct: Record<string, string> = {};
      (packs || []).forEach((pack: { id: string; produto_id: string | null }) => {
        packToProduct[pack.id] = pack.produto_id || CATALOG_ID;
      });

      const counts: Record<string, number> = {};
      (anuncios || []).forEach((anuncio: { pack_id: string }) => {
        const produtoId = packToProduct[anuncio.pack_id];
        if (produtoId) {
          counts[produtoId] = (counts[produtoId] || 0) + 1;
        }
      });

      return Object.entries(counts).map(([produto_id, total]) => ({ produto_id, total }));
    },
    enabled: !!user?.id,
  });

  // Fetch campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!user?.id,
  });

  // Fetch pack counts per campaign
  const { data: campaignPackCounts = {} } = useQuery({
    queryKey: ['campaign-pack-counts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_packs')
        .select('campaign_id, status')
        .not('campaign_id', 'is', null);
      if (error) throw error;
      const counts: Record<string, { total: number; validados: number }> = {};
      (data || []).forEach((pack: any) => {
        if (!pack.campaign_id) return;
        if (!counts[pack.campaign_id]) counts[pack.campaign_id] = { total: 0, validados: 0 };
        counts[pack.campaign_id].total++;
        if (pack.status === 'validado') counts[pack.campaign_id].validados++;
      });
      return counts;
    },
    enabled: !!user?.id,
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha deletada!');
    },
    onError: () => toast.error('Erro ao deletar campanha'),
  });

  const filteredProdutos = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (produto.categoria?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const filteredCampaigns = campaigns.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPackCount = (produtoId: string) => {
    const count = packCounts.find((c) => c.produto_id === produtoId);
    return count || { total: 0, validados: 0 };
  };

  const getAnuncioCount = (produtoId: string) => {
    const count = anuncioCounts.find((c) => c.produto_id === produtoId);
    return count?.total || 0;
  };

  const catalogPackCount = getPackCount(CATALOG_ID);
  const catalogAnuncioCount = getAnuncioCount(CATALOG_ID);

  const renderProductCard = (produto: Produto, index: number) => {
    const packCount = getPackCount(produto.id);
    const anuncioCount = getAnuncioCount(produto.id);

    return (
      <motion.div
        key={produto.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => navigate(`/adlab/${produto.id}`)}
        className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group"
      >
        {/* Product Image */}
        <div className="aspect-square rounded-lg bg-secondary mb-3 overflow-hidden">
          {produto.foto_url ? (
            <img
              src={produto.foto_url}
              alt={produto.nome}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground line-clamp-1">{produto.nome}</h3>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </div>

          {produto.categoria && (
            <p className="text-xs text-muted-foreground">{produto.categoria}</p>
          )}

          <div className="flex items-center gap-2">
            <Badge variant={produto.status === 'ativo' ? 'default' : 'secondary'}>
              {produto.status}
            </Badge>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 pt-2 border-t border-border mt-2">
            <div className="flex items-center gap-1.5 text-xs">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">
                {packCount.total} packs
                {packCount.validados > 0 && (
                  <span className="text-green-500 ml-1">({packCount.validados} ✓)</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <PlayCircle className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">{anuncioCount} anúncios</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderProductListItem = (produto: Produto, index: number) => {
    const packCount = getPackCount(produto.id);
    const anuncioCount = getAnuncioCount(produto.id);

    return (
      <motion.div
        key={produto.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        onClick={() => navigate(`/adlab/${produto.id}`)}
        className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:border-primary/50 transition-all flex items-center gap-4 group"
      >
        {/* Product Image */}
        <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
          {produto.foto_url ? (
            <img
              src={produto.foto_url}
              alt={produto.nome}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{produto.nome}</h3>
          <div className="flex items-center gap-3 mt-1">
            {produto.categoria && (
              <span className="text-xs text-muted-foreground">{produto.categoria}</span>
            )}
            <Badge variant={produto.status === 'ativo' ? 'default' : 'secondary'} className="text-xs">
              {produto.status}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{packCount.total}</div>
            <div className="text-xs text-muted-foreground">Packs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-500">{packCount.validados}</div>
            <div className="text-xs text-muted-foreground">Validados</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{anuncioCount}</div>
            <div className="text-xs text-muted-foreground">Anúncios</div>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="AD Lab"
        description="Laboratório de criação e gestão de anúncios por produto"
        icon={PlayCircle}
        actions={
          <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          </div>
        }
      />

      {/* Dashboard */}
      <AdLabDashboard />

      {/* Catalog Card - Always at Top */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => navigate('/adlab/catalogo')}
        className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/30 p-6 cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              Catálogo Institucional
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Anúncios de branding, coleções e campanhas institucionais
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{catalogPackCount.total}</div>
              <div className="text-xs text-muted-foreground">Packs</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-500">{catalogPackCount.validados}</div>
              <div className="text-xs text-muted-foreground">Validados</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{catalogAnuncioCount}</div>
              <div className="text-xs text-muted-foreground">Anúncios</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Campaigns Section */}
      {filteredCampaigns.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Campanhas
            </h2>
            <Button size="sm" variant="outline" onClick={() => setCreateCampaignOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nova Campanha
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCampaigns.map((campaign, index) => {
              const statusCfg = campaignStatusConfig[campaign.status] || campaignStatusConfig.draft;
              const cPackCount = campaignPackCounts[campaign.id] || { total: 0, validados: 0 };

              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl border border-border p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingCampaign(campaign)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm('Deletar esta campanha e todos os packs vinculados?')) {
                              deleteCampaignMutation.mutate(campaign.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/adlab/campanha-${campaign.id}`)}
                  >
                    <h3 className="font-semibold text-foreground text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {campaign.name}
                    </h3>
                    {campaign.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{campaign.description}</p>
                    )}

                    {(campaign.start_date || campaign.end_date) && (
                      <p className="text-xs text-muted-foreground mb-3">
                        {campaign.start_date && new Date(campaign.start_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        {campaign.start_date && campaign.end_date && ' → '}
                        {campaign.end_date && new Date(campaign.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Layers className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">{cPackCount.total} packs</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Campaign Button (when no campaigns exist) */}
      {campaigns.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setCreateCampaignOpen(true)}
          className="bg-card rounded-xl border border-dashed border-border p-6 cursor-pointer hover:border-primary/50 transition-all text-center"
        >
          <Megaphone className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <h3 className="font-semibold text-foreground">Criar Campanha</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Crie campanhas para organizar anúncios de branding, lançamentos e promoções
          </p>
        </motion.div>
      )}

      {/* Products Grid/List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Produtos
        </h2>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="sm" />
          </div>
        ) : filteredProdutos.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum produto encontrado"
            description="Adicione produtos no Catálogo para começar a criar anúncios"
            action={{ label: 'Ir para Catálogo', onClick: () => navigate('/pricing') }}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProdutos.map((produto, index) => renderProductCard(produto, index))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProdutos.map((produto, index) => renderProductListItem(produto, index))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateCampaignDialog open={createCampaignOpen} onOpenChange={setCreateCampaignOpen} />
      {editingCampaign && (
        <EditCampaignDialog
          open={!!editingCampaign}
          onOpenChange={(open) => !open && setEditingCampaign(null)}
          campaign={editingCampaign}
        />
      )}
    </div>
  );
}
