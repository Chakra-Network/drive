import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { ApiResponse, FileShare } from '@/types';
import { z } from 'zod';
import { PublicKey } from '@solana/web3.js';

const ShareSchema = z.object({
  fileId: z.string(),
  sharedWithPK: z.string(),
  permission: z.enum(['read', 'write']),
});

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<FileShare>>> {
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fileId, sharedWithPK, permission } = ShareSchema.parse(body);

    if (!PublicKey.isOnCurve(sharedWithPK)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Solana address' },
        { status: 400 }
      );
    }

    const file = await prisma.fileEntry.findFirst({
      where: { id: fileId, ownerPK: tokenPayload.wallet, deleted: false },
    });

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found or access denied' },
        { status: 404 }
      );
    }

    // Check if the user exists, if not, create a placeholder user
    let sharedWithUser = await prisma.user.findUnique({
      where: { publicKey: sharedWithPK },
    });

    if (!sharedWithUser) {
      sharedWithUser = await prisma.user.create({
        data: {
          publicKey: sharedWithPK,
          storageBytesAvailable: 0, // Set a default value
          verified: false,
        },
      });
    }

    // Create the share
    const fileShare = await prisma.fileShare.create({
      data: {
        fileEntryId: fileId,
        ownerPK: tokenPayload.wallet,
        sharedWithPK,
        permission,
      },
    });

    return NextResponse.json({ success: true, data: fileShare });
  } catch (error) {
    console.error('Error sharing file:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: 'Failed to share file' }, { status: 500 });
  }
}

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
    const { permission } = z.object({ permission: z.enum(['read', 'write']) }).parse(body);

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
