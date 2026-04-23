import { EmptyState } from '@/components/EmptyState';
import { useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  PlayCircle, 
  MoreVertical,
  Pencil,
  Trash2,
  Video,
  Image,
  Layers,
  FileText,
  Eye
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
import { CreateAnuncioDialog } from '@/components/adlab/CreateAnuncioDialog';
import { EditAnuncioDialog } from '@/components/adlab/EditAnuncioDialog';
import { ViewAnuncioDialog } from '@/components/adlab/ViewAnuncioDialog';

interface Anuncio {
  id: string;
  titulo: string;
  insight_especifico: string | null;
  gancho_principal: string | null;
  formato: string;
  roteiro_visual: any;
  copy_anuncio: string | null;
  link_referencia: string | null;
  observacoes: string | null;
  status_producao: string;
  status_performance: string | null;
  aprendizado_funcionou: string | null;
  aprendizado_nao_funcionou: string | null;
  aprendizado_recomendacoes: string | null;
  created_at: string;
}

interface Pack {
  id: string;
  nome: string;
  produto_id: string;
}

interface Produto {
  id: string;
  nome: string;
}

const statusProducaoConfig: Record<string, { label: string; color: string }> = {
  ideia: { label: 'Ideia', color: 'bg-gray-500/20 text-gray-400' },
  para_fazer: { label: 'Para Fazer', color: 'bg-yellow-500/20 text-yellow-500' },
  gravacao: { label: 'Gravação', color: 'bg-violet-500/20 text-violet-400' },
  em_producao: { label: 'Em Produção', color: 'bg-blue-500/20 text-blue-500' },
  pronto: { label: 'Pronto', color: 'bg-purple-500/20 text-purple-500' },
  rodando: { label: 'Rodando', color: 'bg-green-500/20 text-green-500' },
  pausado: { label: 'Pausado', color: 'bg-orange-500/20 text-orange-500' },
  finalizado: { label: 'Finalizado', color: 'bg-muted text-muted-foreground' },
};

const statusPerformanceConfig: Record<string, { label: string; color: string }> = {
  otima: { label: 'Ótima', color: 'bg-green-500/20 text-green-500' },
  boa: { label: 'Boa', color: 'bg-blue-500/20 text-blue-500' },
  media: { label: 'Média', color: 'bg-yellow-500/20 text-yellow-500' },
  ruim: { label: 'Ruim', color: 'bg-red-500/20 text-red-500' },
};

const formatoConfig: Record<string, { label: string; icon: any }> = {
  video_ugc: { label: 'Vídeo UGC', icon: Video },
  reels: { label: 'Reels', icon: Video },
  story: { label: 'Story', icon: Video },
  imagem_estatica: { label: 'Imagem Estática', icon: Image },
  carrossel: { label: 'Carrossel', icon: Layers },
  outro: { label: 'Outro', icon: FileText },
};

const CATALOG_ID = 'catalogo';

export default function AdLabAnunciosPage() {
  const { produtoId, packId } = useParams<{ produtoId: string; packId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingAnuncio, setEditingAnuncio] = useState<Anuncio | null>(null);
  const [viewingAnuncio, setViewingAnuncio] = useState<Anuncio | null>(null);

  const isCatalog = produtoId === CATALOG_ID;

  // Fetch pack details
  const { data: pack } = useQuery({
    queryKey: ['pack', packId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_packs')
        .select('id, nome, produto_id')
        .eq('id', packId)
        .single();

      if (error) throw error;
      return data as Pack;
    },
    enabled: !!packId,
  });

  // Fetch product details (only for real products, not catalog)
  const { data: produto } = useQuery({
    queryKey: ['produto', produtoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome')
        .eq('id', produtoId)
        .single();

      if (error) throw error;
      return data as Produto;
    },
    enabled: !!produtoId && !isCatalog,
  });

  // Fetch anuncios for this pack
  const { data: anuncios = [], isLoading } = useQuery({
    queryKey: ['anuncios', packId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_anuncios')
        .select('*')
        .eq('pack_id', packId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Anuncio[];
    },
    enabled: !!packId,
  });

  // Delete anuncio mutation
  const deleteMutation = useMutation({
    mutationFn: async (anuncioId: string) => {
      const { error } = await supabase.from('ad_anuncios').delete().eq('id', anuncioId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anuncios', packId] });
      toast.success('Anúncio deletado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao deletar anúncio');
    },
  });

  const handleDeleteAnuncio = (anuncioId: string) => {
    if (confirm('Tem certeza que deseja deletar este anúncio?')) {
      deleteMutation.mutate(anuncioId);
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
            <BreadcrumbLink 
              href={`/adlab/${produtoId}`} 
              onClick={(e) => { e.preventDefault(); navigate(`/adlab/${produtoId}`); }}
            >
              {isCatalog ? 'Catálogo Institucional' : (produto?.nome || 'Produto')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pack?.nome || 'Pack'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/adlab/${produtoId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <PlayCircle className="h-6 w-6 text-primary" />
              {pack?.nome}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isCatalog ? 'Catálogo Institucional' : produto?.nome}
            </p>
          </div>
        </div>

        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Anúncio
        </Button>
      </div>

      {/* Anuncios Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="sm" />
        </div>
      ) : anuncios.length === 0 ? (
        <div className="bg-card rounded-xl border border-border">
          <EmptyState
            icon={PlayCircle}
            title="Nenhum anúncio criado"
            description="Crie anúncios para este pack e acompanhe sua performance"
            action={{ label: 'Criar Primeiro Anúncio', onClick: () => setCreateDialogOpen(true) }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {anuncios.map((anuncio, index) => {
            const statusProd = statusProducaoConfig[anuncio.status_producao] || statusProducaoConfig.ideia;
            const statusPerf = anuncio.status_performance ? statusPerformanceConfig[anuncio.status_performance] : null;
            const formato = formatoConfig[anuncio.formato] || formatoConfig.outro;
            const FormatoIcon = formato.icon;

            return (
              <motion.div
                key={anuncio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl border border-border p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FormatoIcon className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{formato.label}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewingAnuncio(anuncio)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingAnuncio(anuncio)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeleteAnuncio(anuncio.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Content */}
                <div 
                  className="cursor-pointer"
                  onClick={() => setViewingAnuncio(anuncio)}
                >
                  <h3 className="font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {anuncio.titulo}
                  </h3>

                  {anuncio.gancho_principal && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {anuncio.gancho_principal}
                    </p>
                  )}

                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge className={statusProd.color}>{statusProd.label}</Badge>
                    {statusPerf && (
                      <Badge className={statusPerf.color}>{statusPerf.label}</Badge>
                    )}
                  </div>

                  {/* Learning indicator for finalized */}
                  {anuncio.status_producao === 'finalizado' && (
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Aprendizado registrado
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <CreateAnuncioDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        packId={packId!}
        produtoNome={isCatalog ? 'Catálogo Institucional' : (produto?.nome || '')}
        packNome={pack?.nome || ''}
      />

      {editingAnuncio && (
        <EditAnuncioDialog
          open={!!editingAnuncio}
          onOpenChange={(open) => !open && setEditingAnuncio(null)}
          anuncio={editingAnuncio}
          produtoNome={isCatalog ? 'Catálogo Institucional' : (produto?.nome || '')}
          packNome={pack?.nome || ''}
        />
      )}

      {viewingAnuncio && (
        <ViewAnuncioDialog
          open={!!viewingAnuncio}
          onOpenChange={(open) => !open && setViewingAnuncio(null)}
          anuncio={viewingAnuncio}
          produtoNome={isCatalog ? 'Catálogo Institucional' : (produto?.nome || '')}
          packNome={pack?.nome || ''}
          onEdit={() => {
            setEditingAnuncio(viewingAnuncio);
            setViewingAnuncio(null);
          }}
        />
      )}
    </div>
  );
}
