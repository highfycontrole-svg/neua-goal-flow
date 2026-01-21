import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Grid, List, ChevronRight, Layers, PlayCircle, Library, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { AdLabDashboard } from '@/components/adlab/AdLabDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

// Virtual catalog ID for institutional ads
const CATALOG_ID = 'catalogo-institucional';

export default function AdLabPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
        .select('produto_id, status');

      if (error) throw error;

      const counts: Record<string, PackCount> = {};
      (data || []).forEach((pack: { produto_id: string | null; status: string }) => {
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

  const filteredProdutos = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (produto.categoria?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <PlayCircle className="h-7 w-7 text-primary" />
            AD Lab
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Laboratório de criação e gestão de anúncios por produto
          </p>
        </div>

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
      </div>

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

      {/* Products Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredProdutos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">Nenhum produto encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Adicione produtos no Catálogo para começar a criar anúncios
          </p>
          <Button className="mt-4" onClick={() => navigate('/pricing')}>
            Ir para Catálogo
          </Button>
        </div>
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
  );
}
