import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ChatWidget } from '@/components/chat/ChatWidget';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
