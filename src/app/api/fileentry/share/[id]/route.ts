import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { ApiResponse, FileShare } from '@/types';
import { z } from 'zod';

const UpdateShareSchema = z.object({
  permission: z.enum(['read', 'write']),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<FileShare>>> {
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { permission } = UpdateShareSchema.parse(body);

    const updatedShare = await prisma.fileShare.updateMany({
      where: { id: params.id, ownerPK: tokenPayload.wallet },
      data: { permission },
    });

    if (updatedShare.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Share not found or access denied' },
        { status: 404 }
      );
    }

    const fileShare = await prisma.fileShare.findUnique({
      where: { id: params.id },
      include: {
        sharedWith: {
          select: {
            publicKey: true,
          },
        },
      },
    });

    if (!fileShare) {
      return NextResponse.json({ success: false, error: 'Share not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: fileShare });
  } catch (error) {
    console.error('Error updating share permission:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update share permission' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<FileShare[]>>> {
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const fileId = params.id;
    const shares = await prisma.fileShare.findMany({
      where: {
        fileEntryId: fileId,
        OR: [{ ownerPK: tokenPayload.wallet }, { sharedWithPK: tokenPayload.wallet }],
      },
      include: {
        sharedWith: {
          select: {
            publicKey: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: shares });
  } catch (error) {
    console.error('Error fetching file shares:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch file shares' },
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
    const deletedShare = await prisma.fileShare.deleteMany({
      where: { id: params.id, ownerPK: tokenPayload.wallet },
    });

    if (deletedShare.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Share not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'File share removed successfully' },
    });
  } catch (error) {
    console.error('Error removing file share:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove file share' },
      { status: 500 }
    );
  }
}
