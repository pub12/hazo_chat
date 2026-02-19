/**
 * Root Layout for test-app
 * 
 * Provides the base HTML structure, fonts, and global providers.
 * Uses Inter font (shadcn standard alternative).
 */

export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

// Inter - shadcn standard font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// JetBrains Mono - for code/monospace
const jetbrains_mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'hazo_chat Test App',
  description: 'Testing environment for the hazo_chat component library',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains_mono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
