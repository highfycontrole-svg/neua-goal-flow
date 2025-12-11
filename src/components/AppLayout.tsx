import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { motion } from 'framer-motion';

interface AppLayoutProps {
  children: ReactNode;
}

function MainContent({ children }: { children: ReactNode }) {
  const { open, isMobile } = useSidebar();
  
  // Dynamic spacing: sidebar width + 30px left margin of sidebar + 30px gap
  // Open: 320px sidebar + 30px margin + 30px gap = 380px
  // Collapsed: 80px sidebar + 30px margin + 30px gap = 140px
  const leftMargin = open ? 380 : 140;
  
  return (
    <div 
      className="flex-1 flex flex-col transition-all duration-300 ease-out"
      style={{
        marginLeft: isMobile ? 0 : `${leftMargin}px`,
        marginRight: isMobile ? 0 : '30px',
        marginTop: isMobile ? 0 : '30px',
        marginBottom: isMobile ? 0 : '30px',
        minHeight: isMobile ? '100vh' : 'calc(100vh - 60px)',
      }}
    >
      {/* Mobile Header */}
      {isMobile && (
        <header className="sticky top-0 z-40 bg-card border-b border-border/30 px-4 h-14 flex items-center">
          <SidebarTrigger className="text-foreground" />
          <span className="ml-3 font-display font-semibold text-foreground">Neua</span>
        </header>
      )}

      {/* Floating Content Block */}
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className={`
          flex-1 
          ${isMobile ? '' : 'rounded-[18px]'}
          overflow-hidden
        `}
        style={{
          backgroundColor: '#242424',
          boxShadow: isMobile ? 'none' : '0 8px 32px -8px hsl(0 0% 0% / 0.4)',
        }}
      >
        <div className="h-full overflow-auto content-spacing">
          {children}
        </div>
      </motion.main>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full" style={{ backgroundColor: '#161616' }}>
        <AppSidebar />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
