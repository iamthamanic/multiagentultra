'use client';

import React from 'react';
import { ConfigProvider } from 'antd';
import { ReduxProvider } from '@/store/provider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from '@/components/ui/sonner';

interface ProvidersProps {
  children: React.ReactNode;
  fontFamily?: string;
}

export function Providers({ children, fontFamily }: ProvidersProps) {
  return (
    <ReduxProvider>
      <QueryProvider>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#3b82f6', // Blue-500 for MultiAgent branding
              borderRadius: 8,
              colorBgContainer: '#ffffff',
              colorText: '#1f2937',
              colorTextSecondary: '#6b7280',
              fontFamily: fontFamily,
            },
            components: {
              Card: {
                boxShadowTertiary: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
              },
              Button: {
                boxShadow: 'none',
              },
            },
          }}
        >
          <Toaster />
          {children}
        </ConfigProvider>
      </QueryProvider>
    </ReduxProvider>
  );
}