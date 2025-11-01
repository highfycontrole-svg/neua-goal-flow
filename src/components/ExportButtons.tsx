import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, Image } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

interface ExportButtonsProps {
  metas: any[];
  superMetas: any[];
  chartRef?: React.RefObject<HTMLDivElement>;
}

export function ExportButtons({ metas, superMetas, chartRef }: ExportButtonsProps) {
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Relatório de Metas', 14, 20);
      
      doc.setFontSize(11);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

      // Tabela de Metas
      if (metas.length > 0) {
        doc.setFontSize(14);
        doc.text('Metas', 14, 45);
        
        autoTable(doc, {
          startY: 50,
          head: [['Nome', 'Setor', 'Tipo', 'Meta', 'Realizado', 'Status', 'Prioridade']],
          body: metas.map(m => [
            m.nome,
            m.setores?.nome || '-',
            m.tipo,
            m.valor_meta,
            m.valor_realizado || '-',
            m.status ? 'Concluída' : 'Pendente',
            m.prioridade
          ]),
          theme: 'grid',
          headStyles: { fillColor: [55, 96, 216] }
        });
      }

      // Tabela de Super Metas
      if (superMetas.length > 0) {
        const finalY = (doc as any).lastAutoTable?.finalY || 60;
        doc.setFontSize(14);
        doc.text('Super Metas', 14, finalY + 15);
        
        autoTable(doc, {
          startY: finalY + 20,
          head: [['Nome', 'Setor', 'Tipo', 'Meta', 'Realizado', 'Status', 'Prioridade']],
          body: superMetas.map(sm => [
            sm.nome,
            sm.setores?.nome || '-',
            sm.tipo,
            sm.valor_meta,
            sm.valor_realizado || '-',
            sm.status ? 'Concluída' : 'Pendente',
            sm.prioridade
          ]),
          theme: 'grid',
          headStyles: { fillColor: [55, 96, 216] }
        });
      }

      doc.save(`relatorio-metas-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exportado com sucesso');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Planilha de Metas
      const metasData = metas.map(m => ({
        'Nome': m.nome,
        'Setor': m.setores?.nome || '-',
        'Tipo': m.tipo,
        'Meta': m.valor_meta,
        'Realizado': m.valor_realizado || '-',
        'Status': m.status ? 'Concluída' : 'Pendente',
        'Prioridade': m.prioridade,
        'Ano': m.ano,
        'Mês': m.mes
      }));
      
      const wsM = XLSX.utils.json_to_sheet(metasData);
      XLSX.utils.book_append_sheet(wb, wsM, 'Metas');

      // Planilha de Super Metas
      const superMetasData = superMetas.map(sm => ({
        'Nome': sm.nome,
        'Setor': sm.setores?.nome || '-',
        'Tipo': sm.tipo,
        'Meta': sm.valor_meta,
        'Realizado': sm.valor_realizado || '-',
        'Status': sm.status ? 'Concluída' : 'Pendente',
        'Prioridade': sm.prioridade,
        'Ano': sm.ano,
        'Mês': sm.mes
      }));
      
      const wsSM = XLSX.utils.json_to_sheet(superMetasData);
      XLSX.utils.book_append_sheet(wb, wsSM, 'Super Metas');

      XLSX.writeFile(wb, `relatorio-metas-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel exportado com sucesso');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar Excel');
    }
  };

  const exportChartAsPNG = async () => {
    if (!chartRef?.current) {
      toast.error('Gráfico não encontrado');
      return;
    }

    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#17212b',
        scale: 2
      });
      
      const link = document.createElement('a');
      link.download = `grafico-metas-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success('Gráfico exportado como PNG');
    } catch (error) {
      console.error('Erro ao exportar gráfico:', error);
      toast.error('Erro ao exportar gráfico');
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={exportToPDF}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportToExcel}
        className="gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Excel
      </Button>
      {chartRef && (
        <Button
          variant="outline"
          size="sm"
          onClick={exportChartAsPNG}
          className="gap-2"
        >
          <Image className="h-4 w-4" />
          PNG
        </Button>
      )}
    </div>
  );
}
