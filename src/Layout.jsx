import React, { useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

export default function Layout({ children, currentPageName }) {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed top-0 right-6 z-50 pt-2">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}