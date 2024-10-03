import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ApiResponse, ActionGetResponse } from '@/types';
import { nanoid } from 'nanoid';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<ActionGetResponse>>> {
  const { id } = params;
  const response: ActionGetResponse = {
    type: 'action',
    icon: `${process.env.NEXT_PUBLIC_APP_URL}/chakra_icon.png`,
    title: 'Share File Publicly',
    description: `Make the file (ID: ${id}) accessible to anyone with the link.`,
    label: 'Share Publicly',
    links: {
      actions: [
        {
          label: 'Confirm Public Sharing',
          href: request.url,
        },
      ],
    },
  };
  return NextResponse.json({ success: true, data: response });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<{ publicShareId: string; publicShareUrl: string }>>> {
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const { id: fileId } = params;
  try {
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
    const publicShareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${publicShareId}`;

    await prisma.fileEntry.update({
      where: { id: fileId },
      data: {
        isPubliclyShared: true,
        publicShareId,
      },
    });

    return NextResponse.json({
      success: true,
      data: { publicShareId, publicShareUrl },
    });
  } catch (error) {
    console.error('Error sharing file publicly:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to share file publicly' },
      { status: 500 }
    );
  }
}
