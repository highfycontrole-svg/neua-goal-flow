import { useCallback } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface EdgeContextMenuProps {
  x: number;
  y: number;
  edgeId: string;
  onClose: () => void;
  onChangeType: (edgeId: string, type: string) => void;
}

export function EdgeContextMenu({ x, y, edgeId, onClose, onChangeType }: EdgeContextMenuProps) {
  return (
    <div
      className="fixed z-[100]"
      style={{ top: y, left: x }}
    >
      <div className="bg-surface-3 border border-border/30 rounded-lg shadow-xl p-1 min-w-[160px]">
        <button
          className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-md transition-colors"
          onClick={() => { onChangeType(edgeId, 'straight'); onClose(); }}
        >
          Linha Reta
        </button>
        <button
          className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-md transition-colors"
          onClick={() => { onChangeType(edgeId, 'default'); onClose(); }}
        >
          Linha Curva
        </button>
      </div>
    </div>
  );
}
