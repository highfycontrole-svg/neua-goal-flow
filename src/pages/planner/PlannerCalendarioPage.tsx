import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfYear, endOfYear, eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { CreateEventoDialog } from '@/components/planner/calendario/CreateEventoDialog';
import { EditEventoDialog } from '@/components/planner/calendario/EditEventoDialog';

export interface PlannerEvento {
  id: string;
  user_id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  status: string;
  observacoes: string | null;
  hora_inicio: string | null;
  duracao_minutos: number | null;
  created_at: string;
  updated_at: string;
}

const TIPO_COLORS: Record<string, string> = {
  'campanha': 'bg-blue-500/30 border-blue-500/50 text-blue-300',
  'reuniao': 'bg-purple-500/30 border-purple-500/50 text-purple-300',
  'marco': 'bg-green-500/30 border-green-500/50 text-green-300',
  'estrategica': 'bg-orange-500/30 border-orange-500/50 text-orange-300',
  'outro': 'bg-gray-500/30 border-gray-500/50 text-gray-300',
};

const STATUS_COLORS: Record<string, string> = {
  'planejado': 'bg-yellow-500/20 text-yellow-400',
  'em_andamento': 'bg-blue-500/20 text-blue-400',
  'concluido': 'bg-green-500/20 text-green-400',
};

type ViewMode = 'anual' | 'mensal';

export default function PlannerCalendarioPage() {
  const { user } = useAuth();
  const [eventos, setEventos] = useState<PlannerEvento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [viewMode, setViewMode] = useState<ViewMode>('anual');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvento, setSelectedEvento] = useState<PlannerEvento | null>(null);

  useEffect(() => {
    if (user) {
      fetchEventos();
    }
  }, [user, currentYear]);

  const fetchEventos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('planner_eventos')
      .select('*')
      .order('data_inicio', { ascending: true });

    if (error) {
      console.error('Error fetching eventos:', error);
      toast.error('Erro ao carregar eventos');
    } else {
      setEventos(data || []);
    }
    setIsLoading(false);
  };

  const getEventosForDate = (date: Date) => {
    return eventos.filter(evento => {
      const eventoDate = new Date(evento.data_inicio);
      return isSameDay(eventoDate, date);
    });
  };

  const getEventosForMonth = (monthIndex: number) => {
    const monthStart = startOfMonth(new Date(currentYear, monthIndex));
    const monthEnd = endOfMonth(new Date(currentYear, monthIndex));
    return eventos.filter(evento => {
      const eventoDate = new Date(evento.data_inicio);
      return eventoDate >= monthStart && eventoDate <= monthEnd;
    });
  };

  const months = eachMonthOfInterval({
    start: startOfYear(new Date(currentYear, 0)),
    end: endOfYear(new Date(currentYear, 0)),
  });

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsCreateDialogOpen(true);
  };

  const handleEventoClick = (evento: PlannerEvento, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvento(evento);
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(new Date(currentYear, currentMonth));
    const monthEnd = endOfMonth(new Date(currentYear, currentMonth));
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = monthStart.getDay();

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[#1a1a1a] rounded-2xl border border-border/30 overflow-hidden"
      >
        <div className="grid grid-cols-7 border-b border-border/30">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="p-3 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-border/10 bg-[#161616]" />
          ))}
          {days.map(day => {
            const dayEventos = getEventosForDate(day);
            const isCurrentDay = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={`min-h-[100px] border-b border-r border-border/10 p-1 cursor-pointer hover:bg-primary/5 transition-colors ${
                  isCurrentDay ? 'bg-primary/10' : ''
                }`}
              >
                <div className={`text-xs font-medium p-1 ${isCurrentDay ? 'text-primary' : 'text-foreground'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEventos.slice(0, 3).map(evento => (
                    <div
                      key={evento.id}
                      onClick={(e) => handleEventoClick(evento, e)}
                      className={`text-[10px] px-1.5 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 ${TIPO_COLORS[evento.tipo] || TIPO_COLORS.outro}`}
                    >
                      {evento.titulo}
                    </div>
                  ))}
                  {dayEventos.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{dayEventos.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderAnnualView = () => {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {months.map((month, index) => {
          const monthEventos = getEventosForMonth(index);
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
          const startDayOfWeek = monthStart.getDay();

          return (
            <motion.div
              key={month.toISOString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#1a1a1a] rounded-xl border border-border/30 overflow-hidden"
            >
              <div 
                className="p-3 border-b border-border/30 flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => {
                  setCurrentMonth(index);
                  setViewMode('mensal');
                }}
              >
                <h3 className="font-semibold text-sm capitalize">
                  {format(month, 'MMMM', { locale: ptBR })}
                </h3>
                {monthEventos.length > 0 && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    {monthEventos.length} evento{monthEventos.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="p-2">
                <div className="grid grid-cols-7 gap-px text-[10px] text-muted-foreground mb-1">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                    <div key={i} className="text-center">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-px">
                  {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-6" />
                  ))}
                  {days.map(day => {
                    const hasEventos = getEventosForDate(day).length > 0;
                    const isCurrentDay = isToday(day);
                    
                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => handleDayClick(day)}
                        className={`h-6 flex items-center justify-center text-[10px] rounded cursor-pointer transition-colors ${
                          isCurrentDay 
                            ? 'bg-primary text-primary-foreground' 
                            : hasEventos 
                              ? 'bg-blue-500/30 text-blue-300 hover:bg-blue-500/40' 
                              : 'hover:bg-secondary'
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => viewMode === 'anual' ? setCurrentYear(prev => prev - 1) : setCurrentMonth(prev => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg sm:text-xl font-bold min-w-[120px] text-center">
                {viewMode === 'anual' 
                  ? currentYear 
                  : format(new Date(currentYear, currentMonth), "MMMM yyyy", { locale: ptBR })}
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={() => viewMode === 'anual' ? setCurrentYear(prev => prev + 1) : setCurrentMonth(prev => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1 bg-[#1a1a1a] p-1 rounded-lg border border-border/30">
              <Button
                variant={viewMode === 'anual' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('anual')}
                className="text-xs"
              >
                Anual
              </Button>
              <Button
                variant={viewMode === 'mensal' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('mensal')}
                className="text-xs"
              >
                Mensal
              </Button>
            </div>
          </div>
          <Button onClick={() => { setSelectedDate(new Date()); setIsCreateDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Evento
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'anual' ? renderAnnualView() : renderMonthView()}
          </AnimatePresence>
        )}
      </div>

      <CreateEventoDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        selectedDate={selectedDate}
        onSuccess={() => {
          fetchEventos();
          setIsCreateDialogOpen(false);
        }}
      />

      {selectedEvento && (
        <EditEventoDialog
          open={!!selectedEvento}
          onOpenChange={(open) => !open && setSelectedEvento(null)}
          evento={selectedEvento}
          onSuccess={() => {
            fetchEventos();
            setSelectedEvento(null);
          }}
        />
      )}
    </div>
  );
}
