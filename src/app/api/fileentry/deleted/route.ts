import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ApiResponse, FileEntryResponse, PaginatedResponse } from '@/types';
import { FileEntry as PrismaFileEntry } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<FileEntryResponse>>>> {
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  // Pagination unsupported in the frontend

  try {
    const [deletedFiles, totalCount] = await prisma.$transaction([
      prisma.fileEntry.findMany({
        where: { ownerPK: tokenPayload.wallet, deleted: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.fileEntry.count({
        where: { ownerPK: tokenPayload.wallet, deleted: true },
      }),
    ]);

    const fileEntryResponses: FileEntryResponse[] = deletedFiles.map((file: PrismaFileEntry) => {
      const baseEntry: Omit<FileEntryResponse, 'type' | 'mimeType' | 'size' | 'url'> = {
        id: file.id,
        name: file.name,
        isPrivate: file.isPrivate,
        isPubliclyShared: file.isPubliclyShared,
        publicShareId: file.publicShareId,
        ownerPK: file.ownerPK,
        folderId: file.folderId,
        deleted: file.deleted,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
        encryptionKey: file.encryptionKey,
        metadata: file.metadata,
        uploadedSize: file.uploadedSize!,
      };

      if (file.type === 'folder') {
        return {
          ...baseEntry,
          type: 'folder' as const,
          mimeType: 'application/vnd.chakradrive.folder',
        };
      }
      return {
        ...baseEntry,
        type: 'file' as const,
        size: file.size!,
        mimeType: file.mimeType!,
        url: file.url!,
      };
    });

    const response: PaginatedResponse<FileEntryResponse> = {
      items: fileEntryResponses,
      totalCount,
      pageSize,
      currentPage: page,
      totalPages: Math.ceil(totalCount / pageSize),
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching deleted files:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deleted files' },
      { status: 500 }
    );
  }
}
