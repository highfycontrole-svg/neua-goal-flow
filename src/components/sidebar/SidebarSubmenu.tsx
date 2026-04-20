import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import type { SubmenuEntry } from '@/config/sidebarMenu';

interface SidebarSubmenuProps {
  open: boolean;
  items: SubmenuEntry[];
  onNavigate: (path: string) => void;
  /** Optional empty-state message when items is empty. */
  emptyMessage?: string;
}

/**
 * Standardized expandable submenu used inside the AppSidebar.
 * Replaces 4 inlined copies of the same markup.
 */
export function SidebarSubmenu({ open, items, onNavigate, emptyMessage }: SidebarSubmenuProps) {
  const location = useLocation();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="ml-4 mt-1 space-y-1 overflow-hidden"
        >
          {items.map((sub) => {
            const active = location.pathname === sub.path;
            return (
              <motion.button
                key={sub.path}
                onClick={() => onNavigate(sub.path)}
                className={`w-full h-9 rounded-lg flex items-center gap-2 px-3 text-sm transition-all ${
                  active
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
                whileHover={{ x: 4 }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                <span className="truncate">{sub.label}</span>
              </motion.button>
            );
          })}
          {items.length === 0 && emptyMessage && (
            <div className="px-3 py-2 text-xs text-muted-foreground italic">{emptyMessage}</div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}