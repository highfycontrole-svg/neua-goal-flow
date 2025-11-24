import { LogisticaConteudo } from '@/components/arquitetos/LogisticaConteudo';

export default function CreatorsLogistica() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold mb-2">Logística & Conteúdo</h1>
        <p className="text-muted-foreground">Controle de envios e obrigações de conteúdo</p>
      </div>
      <LogisticaConteudo selectedArquitetoId={null} />
    </div>
  );
}
