'use client';

import { Providers } from '@/components/providers/Providers';
import { ReactNode } from 'react';

export function ClientLayout({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}