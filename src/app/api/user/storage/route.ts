import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { ApiResponse, UserStorageStatus } from '@/types';

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<UserStorageStatus>>> {
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { publicKey: tokenPayload.wallet },
      select: { storageBytesAvailable: true, storageUsed: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const storageStatus: UserStorageStatus = {
      storageBytesAvailable: user.storageBytesAvailable,
      storageUsed: user.storageUsed,
      storageRemaining: user.storageBytesAvailable - user.storageUsed,
    };

    return NextResponse.json({ success: true, data: storageStatus });
  } catch (error) {
    console.error('Error fetching user storage info:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
