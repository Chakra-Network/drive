import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ApiResponse, FileEntryResponse, PublicFileViewResponse } from '@/types';
import { nanoid } from 'nanoid';

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
  };
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<FileEntryResponse>>> {
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { fileId } = await request.json();
    if (!fileId) {
      return NextResponse.json({ success: false, error: 'File ID is required' }, { status: 400 });
    }

    const file = await prisma.fileEntry.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    if (file.ownerPK !== tokenPayload.wallet) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to share this file' },
        { status: 403 }
      );
    }

    if (file.type === 'folder') {
      return NextResponse.json(
        { success: false, error: 'Folders cannot be shared publicly' },
        { status: 400 }
      );
    }

    if (file.isPrivate) {
      return NextResponse.json(
        { success: false, error: 'Private files cannot be shared publicly' },
        { status: 400 }
      );
    }

    const publicShareId = nanoid(10);
    const updatedFile = await prisma.fileEntry.update({
      where: { id: fileId },
      data: {
        isPubliclyShared: true,
        publicShareId,
      },
    });

    const response = createFileEntryResponse(updatedFile);
    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error sharing file publicly:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to share file publicly' },
      { status: 500 }
    );
  }
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
