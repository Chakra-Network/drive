// src/app/api/fileentry/names/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fileEntryIds = searchParams.get('ids')?.split(',') || [];

  try {
    const fileEntries = await prisma.fileEntry.findMany({
      where: {
        id: { in: fileEntryIds },
        ownerPK: tokenPayload.wallet,
        type: 'folder', // We're still focusing on folders for breadcrumbs
      },
      select: {
        id: true,
        name: true,
      },
    });

    const fileEntryMap = fileEntries.reduce(
      (acc, entry) => {
        acc[entry.id] = entry.name;
        return acc;
      },
      {} as Record<string, string>
    );

    return NextResponse.json({ success: true, data: fileEntryMap });
  } catch (error) {
    console.error('Error fetching file entry names:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch file entry names' },
      { status: 500 }
    );
  }
}
