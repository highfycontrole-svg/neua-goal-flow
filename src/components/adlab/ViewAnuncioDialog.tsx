import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  Pencil, 
  Video, 
  Image, 
  Layers, 
  FileText,
  ExternalLink,
  Copy,
  CheckCircle2,
  XCircle,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';

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
}

interface ViewAnuncioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anuncio: Anuncio;
  produtoNome: string;
  packNome: string;
  onEdit: () => void;
}

const statusProducaoConfig: Record<string, { label: string; color: string }> = {
  ideia: { label: 'Ideia', color: 'bg-gray-500/20 text-gray-400' },
  para_fazer: { label: 'Para Fazer', color: 'bg-yellow-500/20 text-yellow-500' },
  em_producao: { label: 'Em Produção', color: 'bg-blue-500/20 text-blue-500' },
  pronto: { label: 'Pronto', color: 'bg-purple-500/20 text-purple-500' },
  rodando: { label: 'Rodando', color: 'bg-green-500/20 text-green-500' },
  pausado: { label: 'Pausado', color: 'bg-orange-500/20 text-orange-500' },
  finalizado: { label: 'Finalizado', color: 'bg-muted text-muted-foreground' },
};

const statusPerformanceConfig: Record<string, { label: string; color: string }> = {
  otima: { label: 'Ótima Performance', color: 'bg-green-500/20 text-green-500' },
  boa: { label: 'Boa Performance', color: 'bg-blue-500/20 text-blue-500' },
  media: { label: 'Média Performance', color: 'bg-yellow-500/20 text-yellow-500' },
  ruim: { label: 'Ruim Performance', color: 'bg-red-500/20 text-red-500' },
};

const formatoConfig: Record<string, { label: string; icon: any }> = {
  video_ugc: { label: 'Vídeo UGC', icon: Video },
  reels: { label: 'Reels', icon: Video },
  story: { label: 'Story', icon: Video },
  imagem_estatica: { label: 'Imagem Estática', icon: Image },
  carrossel: { label: 'Carrossel', icon: Layers },
  outro: { label: 'Outro', icon: FileText },
};

export function ViewAnuncioDialog({ 
  open, 
  onOpenChange, 
  anuncio,
  produtoNome, 
  packNome,
  onEdit
}: ViewAnuncioDialogProps) {
  const statusProd = statusProducaoConfig[anuncio.status_producao] || statusProducaoConfig.ideia;
  const statusPerf = anuncio.status_performance ? statusPerformanceConfig[anuncio.status_performance] : null;
  const formato = formatoConfig[anuncio.formato] || formatoConfig.outro;
  const FormatoIcon = formato.icon;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const roteiro = anuncio.roteiro_visual || { cenas: [], cta_final: '' };
  const cenas = roteiro.cenas || [];
  const ctaFinal = roteiro.cta_final || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Detalhes do Anúncio
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Header Info */}
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{anuncio.titulo}</h2>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span>{produtoNome}</span>
                    <span>→</span>
                    <span>{packNome}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FormatoIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{formato.label}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={statusProd.color}>{statusProd.label}</Badge>
                {statusPerf && (
                  <Badge className={statusPerf.color}>{statusPerf.label}</Badge>
                )}
              </div>
            </div>

            {/* Insight & Gancho */}
            {(anuncio.insight_especifico || anuncio.gancho_principal) && (
              <div className="space-y-3">
                {anuncio.insight_especifico && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Insight Específico</h3>
                    <p className="text-foreground">{anuncio.insight_especifico}</p>
                  </div>
                )}
                {anuncio.gancho_principal && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Gancho Principal</h3>
                    <p className="text-foreground">{anuncio.gancho_principal}</p>
                  </div>
                )}
              </div>
            )}

            {/* Roteiro Visual */}
            {(cenas.length > 0 || ctaFinal) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Roteiro Visual</h3>
                  <div className="space-y-2">
                    {cenas.map((cena: { numero: number; descricao: string }, index: number) => (
                      <div key={index} className="flex gap-3 bg-secondary/30 rounded-lg p-3">
                        <div className="flex-shrink-0 w-16 text-sm font-medium text-primary">
                          Cena {cena.numero}
                        </div>
                        <p className="text-foreground text-sm">{cena.descricao}</p>
                      </div>
                    ))}
                    {ctaFinal && (
                      <div className="flex gap-3 bg-primary/10 rounded-lg p-3 border border-primary/20">
                        <div className="flex-shrink-0 w-16 text-sm font-medium text-primary">
                          CTA
                        </div>
                        <p className="text-foreground text-sm">{ctaFinal}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Copy */}
            {anuncio.copy_anuncio && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Copy do Anúncio</h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(anuncio.copy_anuncio!)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                      {anuncio.copy_anuncio}
                    </pre>
                  </div>
                </div>
              </>
            )}

            {/* Referência */}
            {anuncio.link_referencia && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Link de Referência</h3>
                  <a 
                    href={anuncio.link_referencia} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {anuncio.link_referencia}
                  </a>
                </div>
              </>
            )}

            {/* Observações */}
            {anuncio.observacoes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Observações</h3>
                  <p className="text-foreground text-sm">{anuncio.observacoes}</p>
                </div>
              </>
            )}

            {/* Aprendizados */}
            {(anuncio.aprendizado_funcionou || anuncio.aprendizado_nao_funcionou || anuncio.aprendizado_recomendacoes) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Aprendizados
                  </h3>
                  
                  {anuncio.aprendizado_funcionou && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-500">O que funcionou</span>
                      </div>
                      <p className="text-sm text-foreground">{anuncio.aprendizado_funcionou}</p>
                    </div>
                  )}

                  {anuncio.aprendizado_nao_funcionou && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-500">O que não funcionou</span>
                      </div>
                      <p className="text-sm text-foreground">{anuncio.aprendizado_nao_funcionou}</p>
                    </div>
                  )}

                  {anuncio.aprendizado_recomendacoes && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Recomendações Futuras</span>
                      </div>
                      <p className="text-sm text-foreground">{anuncio.aprendizado_recomendacoes}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
