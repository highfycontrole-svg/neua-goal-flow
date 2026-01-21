import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';

interface AdLabFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusProducao: string;
  onStatusProducaoChange: (value: string) => void;
  statusPerformance: string;
  onStatusPerformanceChange: (value: string) => void;
  formato: string;
  onFormatoChange: (value: string) => void;
}

export function AdLabFilters({
  searchTerm,
  onSearchChange,
  statusProducao,
  onStatusProducaoChange,
  statusPerformance,
  onStatusPerformanceChange,
  formato,
  onFormatoChange,
}: AdLabFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Filtros:</span>
      </div>

      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar anúncio..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={statusProducao} onValueChange={onStatusProducaoChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Produção" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos Status</SelectItem>
          <SelectItem value="ideia">💡 Ideia</SelectItem>
          <SelectItem value="para_fazer">📋 Para fazer</SelectItem>
          <SelectItem value="em_producao">🎬 Em produção</SelectItem>
          <SelectItem value="pronto">✅ Pronto</SelectItem>
          <SelectItem value="rodando">🚀 Rodando</SelectItem>
          <SelectItem value="pausado">⏸️ Pausado</SelectItem>
          <SelectItem value="finalizado">🏁 Finalizado</SelectItem>
        </SelectContent>
      </Select>

      <Select value={statusPerformance} onValueChange={onStatusPerformanceChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Performance" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas Perf.</SelectItem>
          <SelectItem value="otima">🏆 Ótima</SelectItem>
          <SelectItem value="boa">👍 Boa</SelectItem>
          <SelectItem value="media">😐 Média</SelectItem>
          <SelectItem value="ruim">👎 Ruim</SelectItem>
        </SelectContent>
      </Select>

      <Select value={formato} onValueChange={onFormatoChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Formato" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="video_ugc">Vídeo UGC</SelectItem>
          <SelectItem value="reels">Reels</SelectItem>
          <SelectItem value="story">Story</SelectItem>
          <SelectItem value="imagem">Imagem</SelectItem>
          <SelectItem value="carrossel">Carrossel</SelectItem>
          <SelectItem value="outro">Outro</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
