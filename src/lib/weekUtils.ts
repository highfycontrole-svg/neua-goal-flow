import { startOfWeek, format, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function getWeekStart(date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekOptions(count = 8): Array<{ label: string; value: string }> {
  return Array.from({ length: count }, (_, i) => {
    const weekStart = getWeekStart(subWeeks(new Date(), i));
    return {
      label: i === 0
        ? `Semana atual (${format(weekStart, 'dd/MM', { locale: ptBR })})`
        : `Semana de ${format(weekStart, 'dd/MM', { locale: ptBR })}`,
      value: format(weekStart, 'yyyy-MM-dd'),
    };
  });
}
