import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { ApiResponse, FileEntryResponse, FileEntryBase } from '@/types';
import { JsonValue } from '@prisma/client/runtime/library';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<FileEntryResponse>>> {
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const fileId = params.id;

  try {
    const file = await prisma.fileEntry.findFirst({
      where: { id: fileId, ownerPK: tokenPayload.wallet, deleted: true },
    });

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found or already restored' },
        { status: 404 }
      );
    }

    const restoredFile = await prisma.fileEntry.update({
      where: { id: fileId },
      data: { deleted: false },
    });

    const isFolder = restoredFile.type === 'folder';

    const baseResponse: Omit<FileEntryBase, 'createdAt' | 'updatedAt'> & {
      createdAt: string;
      updatedAt: string;
      isPubliclyShared: boolean;
      publicShareId: string | null;
    } = {
      id: restoredFile.id,
      name: restoredFile.name,
      ownerPK: restoredFile.ownerPK,
      folderId: restoredFile.folderId,
      deleted: restoredFile.deleted,
      encryptionKey: restoredFile.encryptionKey,
      metadata: restoredFile.metadata as JsonValue | null,
      createdAt: restoredFile.createdAt.toISOString(),
      updatedAt: restoredFile.updatedAt.toISOString(),
      isPubliclyShared: restoredFile.isPubliclyShared,
      publicShareId: restoredFile.publicShareId,
      uploadedSize: restoredFile.uploadedSize,
      isPrivate: restoredFile.isPrivate,
    };

    const response: FileEntryResponse = isFolder
      ? {
          ...baseResponse,
          type: 'folder' as const,
          mimeType: 'application/vnd.chakradrive.folder' as const,
        }
      : {
          ...baseResponse,
          type: 'file' as const,
          size: restoredFile.size!,
          mimeType: restoredFile.mimeType!,
          url: restoredFile.url!,
          privateVersion: restoredFile.privateVersion,
        };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error restoring file:', error);
    return NextResponse.json({ success: false, error: 'Failed to restore file' }, { status: 500 });
  }
}
