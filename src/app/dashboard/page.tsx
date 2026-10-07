'use client';

import { ClientLayout } from '@/app/client-layout';
import DashboardContent from '@/app/dashboard-content';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <ClientLayout>
      <DashboardContent />
    </ClientLayout>
  );
}