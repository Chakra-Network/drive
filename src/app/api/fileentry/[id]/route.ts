import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ApiResponse, FileEntryResponse } from '@/types';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { removeAllShares, createFileEntryResponse } from '@/lib/fileUtils';

const UpdateFileEntrySchema = z.object({
  name: z.string().min(1).optional(),
  folderId: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
  mimeType: z.string().optional(),
  encryptionKey: z.string().nullable().optional(),
  deleted: z.boolean().optional(),
  isPubliclyShared: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<FileEntryResponse>>> {
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const file = await prisma.fileEntry.findUnique({
      where: { id: params.id },
    });

    if (!file || file.ownerPK !== tokenPayload.wallet) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    const response = createFileEntryResponse(file);
    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching file entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch file entry' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<FileEntryResponse>>> {
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const file = await prisma.fileEntry.findUnique({
      where: { id: params.id },
    });

    if (!file || file.ownerPK !== tokenPayload.wallet) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = UpdateFileEntrySchema.parse(body);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };

    if (validatedData.isPubliclyShared !== undefined) {
      if (file.type === 'folder') {
        return NextResponse.json(
          { success: false, error: 'Folders cannot be shared publicly' },
          { status: 400 }
        );
      }
      updateData.isPubliclyShared = validatedData.isPubliclyShared;
      updateData.publicShareId = validatedData.isPubliclyShared ? nanoid(10) : null;
    }

    const updatedFile = await prisma.fileEntry.update({
      where: { id: params.id },
      data: updateData,
    });

    const response = createFileEntryResponse(updatedFile);
    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error updating file entry:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update file entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const fileEntry = await prisma.fileEntry.findUnique({
      where: { id: params.id },
    });

    if (!fileEntry || fileEntry.ownerPK !== tokenPayload.wallet) {
      return NextResponse.json(
        { success: false, error: 'File or folder not found' },
        { status: 404 }
      );
    }

    // Unshare the file or folder
    await removeAllShares(fileEntry.id);

    if (fileEntry.type === 'folder') {
      // Recursive function to unshare and delete folder contents
      const deleteFolderContents = async (folderId: string) => {
        const childEntries = await prisma.fileEntry.findMany({
          where: { folderId },
        });

        await Promise.all(
          childEntries.map(async childEntry => {
            await removeAllShares(childEntry.id);

            if (childEntry.type === 'folder') {
              await deleteFolderContents(childEntry.id);
            }
            await prisma.fileEntry.delete({ where: { id: childEntry.id } });
          })
        );
      };

      // Unshare and delete folder contents
      await deleteFolderContents(fileEntry.id);
    }

    // Delete the file or folder entry
    await prisma.fileEntry.delete({
      where: { id: params.id },
    });

    // Note: We're not updating the user's storage usage here, as the storage
    // on the decentralized platform is permanent and can't be reclaimed.

    return NextResponse.json({
      success: true,
      data: {
        message: `${fileEntry.type === 'file' ? 'File' : 'Folder'} entry unshared and deleted successfully`,
      },
    });
  } catch (error) {
    console.error('Error unsharing and deleting file or folder entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unshare and delete file or folder entry' },
      { status: 500 }
    );
  }
}
