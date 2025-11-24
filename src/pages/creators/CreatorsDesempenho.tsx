import { DesempenhoFinanceiro } from '@/components/arquitetos/DesempenhoFinanceiro';

export default function CreatorsDesempenho() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold mb-2">Desempenho & Financeiro</h1>
        <p className="text-muted-foreground">Acompanhamento de vendas e comissões dos Creators</p>
      </div>
      <DesempenhoFinanceiro selectedArquitetoId={null} />
    </div>
  );
}
