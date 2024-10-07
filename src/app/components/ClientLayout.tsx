'use client';

import { usePathname } from 'next/navigation';
import AppWithSidebarAndWallet from '@/app/components/AppWithSidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicShareRoute = pathname.startsWith('/share/');

  if (isPublicShareRoute) {
    return children;
  }

  return <AppWithSidebarAndWallet>{children}</AppWithSidebarAndWallet>;
}
