import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import React from 'react';

// Ant Design
import { AntdRegistry } from '@ant-design/nextjs-registry';

// Styles
import '@/styles/globals.css';
import '@/styles/nprogress.css';

// Client Providers
import { Providers } from '@/components/providers/Providers';

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MultiAgent Ultra',
  description: 'CrewAI-powered Multi-Agent System Dashboard',
};

// We'll create QueryClient in a client component to avoid SSR issues

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased`}>
        <AntdRegistry>
          <Providers fontFamily={geist.style.fontFamily}>
            {children}
          </Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}