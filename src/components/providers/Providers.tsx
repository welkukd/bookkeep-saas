'use client';

import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="bottom-right"
          theme="system"
          className="glass-card-elevated"
          toastOptions={{
            className: 'glass-card-elevated',
            style: { background: 'var(--color-surface)', color: 'var(--color-text-primary)' },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}