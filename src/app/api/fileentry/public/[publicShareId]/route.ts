import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse, PublicFileViewResponse, FileEntryResponse } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createFileEntryResponse(file: any): FileEntryResponse {
  const baseResponse = {
    id: file.id,
    name: file.name,
    ownerPK: file.ownerPK,
    folderId: file.folderId,
    deleted: file.deleted,
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
    encryptionKey: file.encryptionKey,
    metadata: file.metadata,
    isPrivate: file.isPrivate,
    isPubliclyShared: file.isPubliclyShared,
    publicShareId: file.publicShareId,
    uploadedSize: file.uploadedSize,
  };

  if (file.type === 'folder') {
    return {
      ...baseResponse,
      type: 'folder' as const,
      mimeType: 'application/vnd.chakradrive.folder' as const,
    };
  }
  return {
    ...baseResponse,
    type: 'file' as const,
    size: file.size ?? 0,
    mimeType: file.mimeType ?? 'application/octet-stream',
    url: file.url ?? '',
    privateVersion: file.privateVersion,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { publicShareId: string } }
): Promise<NextResponse<ApiResponse<PublicFileViewResponse>>> {
  const { publicShareId } = params;
  if (!publicShareId) {
    return NextResponse.json(
      { success: false, error: 'Public share ID is required' },
      { status: 400 }
    );
  }

  try {
    const file = await prisma.fileEntry.findUnique({
      where: { publicShareId },
      include: { owner: { select: { publicKey: true } } },
    });

    if (!file) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    if (!file.isPubliclyShared || file.isPrivate) {
      return NextResponse.json(
        { success: false, error: 'File is not publicly shared' },
        { status: 403 }
      );
    }

    const response: PublicFileViewResponse = {
      file: createFileEntryResponse(file),
      ownerPublicKey: file.owner.publicKey,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching public file entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch file entry' },
      { status: 500 }
    );
  }
}
