'use client';

import { usePathname } from 'next/navigation';
import AppWithSidebarAndWallet from '@/app/components/AppWithSidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicFileRoute = /^\/share\/[A-Za-z0-9]{10}$/.test(pathname);

  if (isPublicFileRoute) {
    return children;
  }

  return <AppWithSidebarAndWallet>{children}</AppWithSidebarAndWallet>;
}
