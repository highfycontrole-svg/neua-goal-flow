import { HistoricoInteracoes } from '@/components/arquitetos/HistoricoInteracoes';

export default function CreatorsInteracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold mb-2">Histórico de Interações</h1>
        <p className="text-muted-foreground">Registro de comunicações com Creators</p>
      </div>
      <HistoricoInteracoes selectedArquitetoId={null} />
    </div>
  );
}
