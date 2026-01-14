import { useState, useEffect } from 'react';
import { CalendarDays, Lightbulb, PenLine, Bot, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const SUB_PAGES = [
  { id: 'calendario', label: 'Calendário', icon: CalendarDays, path: '/planner/calendario' },
  { id: 'ideias', label: 'Ideias', icon: Lightbulb, path: '/planner/ideias' },
  { id: 'manual', label: 'Planner Manual', icon: PenLine, path: '/planner/manual' },
  { id: 'ia', label: 'Planner IA', icon: Bot, path: '/planner/ia' },
];

export default function Planner2026Page() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active sub-page from URL
  const getActiveSubPage = () => {
    const path = location.pathname;
    if (path.includes('/calendario')) return 'calendario';
    if (path.includes('/ideias')) return 'ideias';
    if (path.includes('/manual')) return 'manual';
    if (path.includes('/ia')) return 'ia';
    return 'calendario'; // default
  };
  
  const activeSubPage = getActiveSubPage();

  // Redirect to default sub-page if on /planner
  useEffect(() => {
    if (location.pathname === '/planner') {
      navigate('/planner/calendario', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Sub-page Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 mb-4"
      >
        <div className="flex items-center gap-1 bg-[#1a1a1a] p-1 rounded-xl border border-border/30 w-fit overflow-x-auto">
          {SUB_PAGES.map((page) => {
            const Icon = page.icon;
            const isActive = activeSubPage === page.id;
            
            return (
              <button
                key={page.id}
                onClick={() => navigate(page.path)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{page.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Sub-page Content */}
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
    </div>
  );
}
