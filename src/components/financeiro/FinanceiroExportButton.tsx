import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, Image, Copy } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface FinanceiroExportButtonProps {
  containerRef: React.RefObject<HTMLDivElement>;
  sectionName: string;
  textReport: string;
}

export function FinanceiroExportButton({ containerRef, sectionName, textReport }: FinanceiroExportButtonProps) {
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
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
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
        <DropdownMenuItem onClick={copyTextReport} className="gap-2">
          <Copy className="h-4 w-4" />
          Copiar Texto
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
