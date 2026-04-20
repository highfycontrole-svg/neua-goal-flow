import { useContextMenu } from '@/contexts/ContextMenuContext';
import { motion, AnimatePresence } from 'framer-motion';

export function GlobalContextMenu() {
  const { menu, hideMenu } = useContextMenu();

  return (
    <AnimatePresence>
      {menu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.12, ease: [0.4, 0, 0.2, 1] }}
          className="fixed z-[9999] min-w-[200px] max-w-[280px] rounded-xl border border-border/40 bg-surface-2 shadow-2xl shadow-black/50 py-1.5 overflow-hidden"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {menu.items.map((item, i) => {
            if (item.separator) {
              return (
                <div key={`sep-${i}`} className="my-1 mx-3 border-t border-border/30" />
              );
            }
            return (
              <button
                key={i}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors text-left
                  ${item.destructive 
                    ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
                    : 'text-foreground/90 hover:bg-primary/10 hover:text-foreground'}
                  ${item.disabled ? 'opacity-40 pointer-events-none' : ''}
                `}
                onClick={() => {
                  hideMenu();
                  item.action();
                }}
                disabled={item.disabled}
              >
                {item.icon && (
                  <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center opacity-70">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
