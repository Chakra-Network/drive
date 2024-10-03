'use client';

import { useParams } from 'next/navigation';
import AllFiles from '@/app/components/AllFiles';

export default function FolderPage() {
  const params = useParams();

  // Extract the path from params
  const path = params.path as string[];

  return <AllFiles path={path} />;
}
