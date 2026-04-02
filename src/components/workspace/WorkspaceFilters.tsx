import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WorkspaceFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  responsibleFilter: string;
  onResponsibleChange: (value: string) => void;
  tagFilter: string;
  onTagChange: (value: string) => void;
  dateFilter: string;
  onDateChange: (value: string) => void;
  availableResponsibles: string[];
  availableTags: string[];
  showCompleted: boolean;
  onShowCompletedChange: (value: boolean) => void;
  completedCount: number;
}

export function WorkspaceFilters({
  searchQuery,
  onSearchChange,
  responsibleFilter,
  onResponsibleChange,
  tagFilter,
  onTagChange,
  dateFilter,
  onDateChange,
  availableResponsibles,
  availableTags,
  showCompleted,
  onShowCompletedChange,
  completedCount,
}: WorkspaceFiltersProps) {
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (responsibleFilter !== 'todos') count++;
    if (tagFilter !== 'todas') count++;
    if (dateFilter !== 'todas') count++;
    return count;
  }, [responsibleFilter, tagFilter, dateFilter]);

  const clearAllFilters = () => {
    onResponsibleChange('todos');
    onTagChange('todas');
    onDateChange('todas');
    onSearchChange('');
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Filter className="h-4 w-4" />
          </div>

          {/* Responsible Filter */}
          <Select value={responsibleFilter} onValueChange={onResponsibleChange}>
            <SelectTrigger className="w-[140px] sm:w-[160px]">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              <SelectItem value="todos">Todos</SelectItem>
              {availableResponsibles.map((resp) => (
                <SelectItem key={resp} value={resp}>
                  {resp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tag Filter */}
          <Select value={tagFilter} onValueChange={onTagChange}>
            <SelectTrigger className="w-[140px] sm:w-[160px]">
              <SelectValue placeholder="Tags" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              <SelectItem value="todas">Todas Tags</SelectItem>
              {availableTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Select value={dateFilter} onValueChange={onDateChange}>
            <SelectTrigger className="w-[140px] sm:w-[160px]">
              <SelectValue placeholder="Data" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              <SelectItem value="todas">Todas Datas</SelectItem>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
              <SelectItem value="atrasadas">Atrasadas</SelectItem>
              <SelectItem value="sem-data">Sem Data</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="gap-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Limpar ({activeFiltersCount})
            </Button>
          )}

          {/* Toggle Completed */}
          <button
            onClick={() => onShowCompletedChange(!showCompleted)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              showCompleted
                ? "bg-primary/20 text-primary border-primary/40"
                : "bg-transparent text-muted-foreground border-border/40 hover:border-border hover:text-foreground"
            )}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {showCompleted ? "Ocultar concluídas" : "Ver concluídas"}
            {completedCount > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px]",
                showCompleted ? "bg-primary/30" : "bg-muted"
              )}>
                {completedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
