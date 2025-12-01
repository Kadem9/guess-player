'use client';

import { ReactNode } from 'react';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="u-min-h-screen">
      <Header />
      <main>
        {children}
      </main>
    </div>
  );
}
