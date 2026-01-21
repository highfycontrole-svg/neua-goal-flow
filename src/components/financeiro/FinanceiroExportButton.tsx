import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, Image, Copy, FileSpreadsheet } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  sheetName?: string;
}

interface FinanceiroExportButtonProps {
  containerRef: React.RefObject<HTMLDivElement>;
  sectionName: string;
  textReport: string;
  xlsData?: ExportData;
}

export function FinanceiroExportButton({ containerRef, sectionName, textReport, xlsData }: FinanceiroExportButtonProps) {
  const exportToPNG = async () => {
    if (!containerRef.current) return;

    try {
      toast.loading('Gerando imagem...');
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `financeiro-${sectionName}-${new Date().toISOString().split('T')[0]}.png`;
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
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      
      // Add header with date
      const dateStr = new Date().toLocaleDateString('pt-BR');
      pdf.setFontSize(12);
      pdf.setTextColor(150);
      pdf.text(`Neua - Relatório Financeiro | ${sectionName} | ${dateStr}`, 20, 20);
      
      pdf.addImage(imgData, 'PNG', 0, 30, canvas.width, canvas.height);
      pdf.save(`financeiro-${sectionName}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.dismiss();
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      toast.dismiss();
      toast.error('Erro ao exportar PDF');
    }
  };

  const copyTextReport = () => {
    navigator.clipboard.writeText(textReport);
    toast.success('Relatório copiado para a área de transferência!');
  };

  const exportToXLS = () => {
    if (!xlsData) {
      toast.error('Dados para exportação não disponíveis');
      return;
    }

    try {
      const ws = XLSX.utils.aoa_to_sheet([xlsData.headers, ...xlsData.rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, xlsData.sheetName || sectionName);
      XLSX.writeFile(wb, `financeiro-${sectionName}-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Planilha exportada com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar planilha');
    }
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
        <DropdownMenuItem onClick={copyTextReport} className="gap-2">
          <Copy className="h-4 w-4" />
          Copiar Texto Formatado
        </DropdownMenuItem>
        {xlsData && (
          <DropdownMenuItem onClick={exportToXLS} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Exportar XLS
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={exportToPNG} className="gap-2">
          <Image className="h-4 w-4" />
          Exportar PNG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
