import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, Image } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonsProps {
  metas: any[];
  superMetas: any[];
  dashboardRef?: React.RefObject<HTMLDivElement>;
}

export function ExportButtons({ metas, superMetas, dashboardRef }: ExportButtonsProps) {
  const exportToPDF = async () => {
    try {
      const [{ default: jsPDF }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const autoTable = autoTableModule.default;

      const doc = new jsPDF('p', 'mm', 'a4');

      // Logo (best-effort)
      try {
        const logoImg = document.createElement('img');
        logoImg.src = '/src/assets/logo.png';
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          setTimeout(reject, 2000);
        });
        doc.addImage(logoImg, 'PNG', 14, 10, 20, 20);
      } catch (e) {
        console.log('Logo não carregada');
      }

      doc.setFontSize(20);
      doc.setTextColor(55, 96, 216);
      doc.text('Painel de Metas - Neua', 40, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 40, 27);

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Resumo Geral', 14, 40);

      const totalMetas = metas.length + superMetas.length;
      const totalConcluidas = metas.filter(m => m.status).length + superMetas.filter(m => m.status).length;
      const percentual = totalMetas > 0 ? Math.round((totalConcluidas / totalMetas) * 100) : 0;

      doc.setFontSize(10);
      doc.text(`Total de Metas: ${metas.length}`, 14, 47);
      doc.text(`Total de Super Metas: ${superMetas.length}`, 14, 52);
      doc.text(`Conclusão Geral: ${percentual}%`, 14, 57);

      if (metas.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(55, 96, 216);
        doc.text('Metas', 14, 67);

        autoTable(doc, {
          startY: 72,
          head: [['Nome', 'Setor', 'Tipo', 'Meta', 'Realizado', 'Status', 'Prioridade']],
          body: metas.map(m => [
            m.nome,
            m.setores?.nome || '-',
            m.tipo,
            m.valor_meta,
            m.valor_realizado || '-',
            m.status ? 'Concluída' : 'Pendente',
            m.prioridade,
          ]),
          theme: 'striped',
          headStyles: { fillColor: [55, 96, 216], textColor: [255, 255, 255], fontSize: 10 },
          bodyStyles: { fontSize: 9 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });
      }

      if (superMetas.length > 0) {
        const finalY = (doc as any).lastAutoTable?.finalY || 80;
        const renderTable = (startY: number) => {
          autoTable(doc, {
            startY,
            head: [['Nome', 'Setor', 'Tipo', 'Meta', 'Realizado', 'Status', 'Prioridade']],
            body: superMetas.map(sm => [
              sm.nome,
              sm.setores?.nome || '-',
              sm.tipo,
              sm.valor_meta,
              sm.valor_realizado || '-',
              sm.status ? 'Concluída' : 'Pendente',
              sm.prioridade,
            ]),
            theme: 'striped',
            headStyles: { fillColor: [55, 96, 216], textColor: [255, 255, 255], fontSize: 10 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
          });
        };

        if (finalY > 250) {
          doc.addPage();
          doc.setFontSize(14);
          doc.setTextColor(55, 96, 216);
          doc.text('Super Metas', 14, 20);
          renderTable(25);
        } else {
          doc.setFontSize(14);
          doc.setTextColor(55, 96, 216);
          doc.text('Super Metas', 14, finalY + 15);
          renderTable(finalY + 20);
        }
      }

      doc.save(`relatorio-metas-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exportado com sucesso');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const metasData = metas.map(m => ({
        Nome: m.nome,
        Setor: m.setores?.nome || '-',
        Tipo: m.tipo,
        Meta: m.valor_meta,
        Realizado: m.valor_realizado || '-',
        Status: m.status ? 'Concluída' : 'Pendente',
        Prioridade: m.prioridade,
        Ano: m.ano,
        Mês: m.mes,
      }));
      const wsM = XLSX.utils.json_to_sheet(metasData);
      XLSX.utils.book_append_sheet(wb, wsM, 'Metas');

      const superMetasData = superMetas.map(sm => ({
        Nome: sm.nome,
        Setor: sm.setores?.nome || '-',
        Tipo: sm.tipo,
        Meta: sm.valor_meta,
        Realizado: sm.valor_realizado || '-',
        Status: sm.status ? 'Concluída' : 'Pendente',
        Prioridade: sm.prioridade,
        Ano: sm.ano,
        Mês: sm.mes,
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

  const exportDashboardAsPNG = async () => {
    if (!dashboardRef?.current) {
      toast.error('Dashboard não encontrado');
      return;
    }

    try {
      toast.info('Gerando imagem do painel...');
      const { default: html2canvas } = await import('html2canvas');

      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: '#161616',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `painel-metas-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('Painel exportado como PNG');
    } catch (error) {
      console.error('Erro ao exportar painel:', error);
      toast.error('Erro ao exportar painel');
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={exportToPDF} className="gap-2">
        <FileText className="h-4 w-4" />
        PDF
      </Button>
      <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-2">
        <FileSpreadsheet className="h-4 w-4" />
        Excel
      </Button>
      {dashboardRef && (
        <Button variant="outline" size="sm" onClick={exportDashboardAsPNG} className="gap-2">
          <Image className="h-4 w-4" />
          PNG
        </Button>
      )}
    </div>
  );
}
