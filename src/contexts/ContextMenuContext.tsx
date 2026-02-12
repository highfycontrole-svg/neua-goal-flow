import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  destructive?: boolean;
  separator?: boolean;
  disabled?: boolean;
}

export interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

interface ContextMenuContextType {
  menu: ContextMenuState | null;
  showMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
  hideMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export function useContextMenu() {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) throw new Error('useContextMenu must be inside ContextMenuProvider');
  return ctx;
}

export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  const showMenu = useCallback((x: number, y: number, items: ContextMenuItem[]) => {
    // Clamp position to viewport
    const menuW = 220;
    const menuH = items.length * 40 + 16;
    const clampedX = Math.min(x, window.innerWidth - menuW - 8);
    const clampedY = Math.min(y, window.innerHeight - menuH - 8);
    setMenu({ x: Math.max(8, clampedX), y: Math.max(8, clampedY), items });
  }, []);

  const hideMenu = useCallback(() => setMenu(null), []);

  // Close on click outside, ESC, scroll
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('click', close);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
    };
  }, [menu]);

  return (
    <ContextMenuContext.Provider value={{ menu, showMenu, hideMenu }}>
      {children}
    </ContextMenuContext.Provider>
  );
}
