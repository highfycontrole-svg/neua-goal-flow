import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { motion } from 'framer-motion';

interface AppLayoutProps {
  children: ReactNode;
}

function MainContent({ children }: { children: ReactNode }) {
  const { open, isMobile } = useSidebar();
  
  return (
    <div 
      className="flex-1 flex flex-col min-h-screen transition-all duration-300"
      style={{
        marginLeft: isMobile ? 0 : (open ? '380px' : '100px'),
        marginRight: isMobile ? 0 : '30px',
        marginTop: isMobile ? 0 : '30px',
        marginBottom: isMobile ? 0 : '30px',
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
          ${isMobile 
            ? 'bg-card' 
            : 'floating-content rounded-[18px]'
          }
          overflow-hidden
        `}
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
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
