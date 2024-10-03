// src/app/api/storage/purchase/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { ApiResponse, Purchase } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Purchase>>> {
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { storageBytes, transactionId } = await request.json();

  if (!storageBytes || !transactionId) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const purchase = await prisma.purchase.create({
      data: {
        userPK: tokenPayload.wallet,
        storageBytes,
        status: 'pending',
        transactionId,
      },
    });

    return NextResponse.json({ success: true, data: purchase }, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create purchase' },
      { status: 500 }
    );
  }
}
