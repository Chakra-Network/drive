import { verifyToken } from '@/lib/auth';
import { CURRENT_PRIVATE_VERSION } from '@/lib/consts';
import prisma from '@/lib/prisma';
import { getIrysGatewayUrl } from '@/lib/web_irys';
import { ApiResponse, FileEntryBase, FileEntryResponse, PaginatedResponse } from '@/types';
import { JsonValue } from '@prisma/client/runtime/library';
import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<FileEntryResponse>>> {
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const { wallet: walletAddress } = tokenPayload;

  try {
    const { name, type, folderId, size, mimeType, irysFileId, isPrivate } = await request.json();

    const user = await prisma.user.findUnique({
      where: { publicKey: walletAddress },
      select: { publicKey: true, storageBytesAvailable: true, storageUsed: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (type === 'file' && user.storageUsed + size > user.storageBytesAvailable) {
      return NextResponse.json({ success: false, error: 'Insufficient storage' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileData: any = {
      name,
      type,
      ownerPK: user.publicKey,
      folderId: folderId || null,
      deleted: false,
      isPrivate: !!isPrivate,
      isPubliclyShared: false,
      publicShareId: null,
      privateVersion: CURRENT_PRIVATE_VERSION,
    };

    if (type === 'file') {
      fileData.size = size;
      fileData.mimeType = mimeType;
      fileData.url = getIrysGatewayUrl(irysFileId);
    } else {
      fileData.mimeType = 'application/vnd.chakradrive.folder';
    }

    let file;
    if (type === 'file') {
      [file] = await prisma.$transaction([
        prisma.fileEntry.create({
          data: fileData,
        }),
        prisma.user.update({
          where: { publicKey: user.publicKey },
          data: { storageUsed: { increment: size } },
        }),
      ]);
    } else {
      file = await prisma.fileEntry.create({
        data: fileData,
      });
    }

    const baseResponse: Omit<FileEntryBase, 'createdAt' | 'updatedAt'> & {
      createdAt: string;
      updatedAt: string;
    } = {
      id: file.id,
      name: file.name,
      ownerPK: file.ownerPK,
      folderId: file.folderId,
      deleted: file.deleted,
      encryptionKey: file.encryptionKey,
      metadata: file.metadata as JsonValue | null,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      isPrivate: file.isPrivate,
      isPubliclyShared: file.isPubliclyShared,
      publicShareId: file.publicShareId,
      uploadedSize: file.size ?? 0,
    };

    const response: FileEntryResponse =
      file.type === 'file'
        ? {
            ...baseResponse,
            type: 'file',
            size: file.size!,
            mimeType: file.mimeType!,
            url: file.url!,
            privateVersion: file.privateVersion,
          }
        : {
            ...baseResponse,
            type: 'folder',
            mimeType: 'application/vnd.chakradrive.folder',
          };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error creating file entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create file entry' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<FileEntryResponse>>>> {
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const { wallet: walletAddress } = tokenPayload;

  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get('folderId') || null;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  // Pagination unsupported in the frontend

  try {
    const [files, totalCount] = await prisma.$transaction([
      prisma.fileEntry.findMany({
        where: {
          ownerPK: walletAddress,
          folderId,
          deleted: false,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.fileEntry.count({
        where: {
          ownerPK: walletAddress,
          folderId,
          deleted: false,
        },
      }),
    ]);

    const response: PaginatedResponse<FileEntryResponse> = {
      items: files.map((file): FileEntryResponse => {
        const baseEntry: Omit<FileEntryBase, 'createdAt' | 'updatedAt'> & {
          createdAt: string;
          updatedAt: string;
        } = {
          id: file.id,
          name: file.name,
          ownerPK: file.ownerPK,
          folderId: file.folderId,
          deleted: file.deleted,
          encryptionKey: file.encryptionKey,
          metadata: file.metadata as JsonValue | null,
          createdAt: file.createdAt.toISOString(),
          updatedAt: file.updatedAt.toISOString(),
          isPrivate: file.isPrivate,
          isPubliclyShared: file.isPubliclyShared,
          publicShareId: file.publicShareId,
          uploadedSize: file.size ?? 0,
        };

        if (file.type === 'file') {
          return {
            ...baseEntry,
            type: 'file',
            size: file.size!,
            mimeType: file.mimeType!,
            url: file.url!,
            privateVersion: file.privateVersion,
          };
        }
        return {
          ...baseEntry,
          type: 'folder',
          mimeType: 'application/vnd.chakradrive.folder',
        };
      }),
      totalCount,
      pageSize,
      currentPage: page,
      totalPages: Math.ceil(totalCount / pageSize),
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching file entries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch file entries' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest
): Promise<NextResponse<ApiResponse<FileEntryResponse>>> {
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, isPubliclyShared, name, folderId } = await request.json();

    const file = await prisma.fileEntry.findUnique({
      where: { id },
    });

    if (!file || file.ownerPK !== tokenPayload.wallet) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updateData.name = name;
    }

    if (folderId !== undefined) {
      updateData.folderId = folderId;
    }

    if (isPubliclyShared !== undefined) {
      if (file.type === 'folder') {
        return NextResponse.json(
          { success: false, error: 'Folders cannot be shared publicly' },
          { status: 400 }
        );
      }
      updateData.isPubliclyShared = isPubliclyShared;
      updateData.publicShareId = isPubliclyShared ? nanoid(10) : null;
    }

    const updatedFile = await prisma.fileEntry.update({
      where: { id },
      data: updateData,
    });

    const baseResponse: Omit<FileEntryBase, 'createdAt' | 'updatedAt'> & {
      createdAt: string;
      updatedAt: string;
    } = {
      id: updatedFile.id,
      name: updatedFile.name,
      ownerPK: updatedFile.ownerPK,
      folderId: updatedFile.folderId,
      deleted: updatedFile.deleted,
      createdAt: updatedFile.createdAt.toISOString(),
      updatedAt: updatedFile.updatedAt.toISOString(),
      encryptionKey: updatedFile.encryptionKey,
      metadata: updatedFile.metadata as JsonValue,
      isPrivate: updatedFile.isPrivate,
      isPubliclyShared: updatedFile.isPubliclyShared,
      publicShareId: updatedFile.publicShareId,
      uploadedSize: updatedFile.size ?? 0,
    };

    const response: FileEntryResponse =
      updatedFile.type === 'file'
        ? {
            ...baseResponse,
            type: 'file',
            size: updatedFile.size!,
            mimeType: updatedFile.mimeType!,
            url: updatedFile.url!,
            privateVersion: updatedFile.privateVersion,
          }
        : {
            ...baseResponse,
            type: 'folder',
            mimeType: 'application/vnd.chakradrive.folder',
          };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error updating file entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update file entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    const file = await prisma.fileEntry.findUnique({
      where: { id },
    });

    if (!file || file.ownerPK !== tokenPayload.wallet) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    if (file.type === 'folder') {
      return NextResponse.json(
        { success: false, error: 'Deleting folders is not supported' },
        { status: 400 }
      );
    }

    await prisma.fileEntry.update({
      where: { id },
      data: { deleted: true },
    });

    await prisma.user.update({
      where: { publicKey: tokenPayload.wallet },
      data: { storageUsed: { decrement: file.size ?? 0 } },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'File entry deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting file entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file entry' },
      { status: 500 }
    );
  }
}
