import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, Image, FileJson } from 'lucide-react';
import { toast } from 'sonner';

interface PedidosMetricasExportProps {
  containerRef: React.RefObject<HTMLDivElement>;
  data: {
    totalPedidos: number;
    entregues: number;
    emTransito: number;
    taxaEntrega: string;
    tempoMedioEntrega: string | null;
    qualidadeData: { name: string; value: number; percent: string }[];
    statusData: { name: string; value: number }[];
    transportadoraData: { name: string; value: number }[];
  };
}

export function PedidosMetricasExport({ containerRef, data }: PedidosMetricasExportProps) {
  const exportToPNG = async () => {
    if (!containerRef.current) return;

    try {
      toast.loading('Gerando imagem...');
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `metricas-pedidos-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.dismiss();
      toast.success('Imagem exportada com sucesso!');
    } catch (error) {
      toast.dismiss();
      toast.error('Erro ao exportar imagem');
    }
  };

  const exportToPDF = async () => {
    if (!containerRef.current) return;

    try {
      toast.loading('Gerando PDF...');
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`metricas-pedidos-${new Date().toISOString().split('T')[0]}.pdf`);

      toast.dismiss();
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      toast.dismiss();
      toast.error('Erro ao exportar PDF');
    }
  };

  const exportToText = () => {
    const dateStr = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    let text = `📦 RELATÓRIO DE MÉTRICAS DE PEDIDOS\n`;
    text += `📅 Data: ${dateStr}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    text += `📊 KPIs PRINCIPAIS\n`;
    text += `• Total de Pedidos: ${data.totalPedidos}\n`;
    text += `• Entregues: ${data.entregues}\n`;
    text += `• Em Trânsito: ${data.emTransito}\n`;
    text += `• Taxa de Entrega: ${data.taxaEntrega}%\n`;
    if (data.tempoMedioEntrega) {
      text += `• Tempo Médio de Entrega: ${data.tempoMedioEntrega} dias\n`;
    }
    text += `\n`;

    if (data.qualidadeData.length > 0) {
      text += `⭐ QUALIDADE LOGÍSTICA\n`;
      data.qualidadeData.forEach((item) => {
        text += `• ${item.name}: ${item.percent}% (${item.value} pedidos)\n`;
      });
      text += `\n`;
    }

    if (data.statusData.length > 0) {
      text += `📋 DISTRIBUIÇÃO POR STATUS\n`;
      data.statusData.forEach((item) => {
        text += `• ${item.name}: ${item.value} pedidos\n`;
      });
      text += `\n`;
    }

    if (data.transportadoraData.length > 0) {
      text += `🚚 PEDIDOS POR TRANSPORTADORA\n`;
      data.transportadoraData.forEach((item) => {
        text += `• ${item.name}: ${item.value} pedidos\n`;
      });
      text += `\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✅ Relatório gerado pelo App Neua`;

    navigator.clipboard.writeText(text);
    toast.success('Relatório copiado para a área de transferência!');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToPDF} className="gap-2">
          <FileText className="h-4 w-4" />
          Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPNG} className="gap-2">
          <Image className="h-4 w-4" />
          Exportar PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToText} className="gap-2">
          <FileJson className="h-4 w-4" />
          Copiar Texto
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
