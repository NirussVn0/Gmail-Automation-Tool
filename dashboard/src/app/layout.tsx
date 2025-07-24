import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gmail Automation Tool - Dashboard',
  description: 'Modern dashboard for managing Gmail account creation and automation',
  keywords: ['gmail', 'automation', 'dashboard', 'account creation'],
  authors: [{ name: 'Gmail Automation Tool' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex h-screen bg-background">
            <Sidebar className="hidden md:flex" />
            
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              
              <main className="flex-1 overflow-y-auto p-6">
                <div className="max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
          
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
