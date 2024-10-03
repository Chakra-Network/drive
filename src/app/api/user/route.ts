// src/app/api/user/route.ts

import { generateToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { verifySignature } from '@/lib/solana';
import { ApiResponse, SolanaAuthPayload, User } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ token: string; user: User }>>> {
  const { publicKey, signature, message }: SolanaAuthPayload = await request.json();

  if (!publicKey || !signature || !message) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { publicKey } });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User already exists' }, { status: 409 });
    }

    const isValidSignature = await verifySignature(publicKey, signature, message);
    if (!isValidSignature) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    const newUser = await prisma.user.create({
      data: {
        publicKey,
        storageBytesAvailable: 100 * 1024 * 1024, // 100 MB initial storage
        verified: true, // Auto-verify users who prove ownership of their Solana wallet
      },
    });

    const token = generateToken(publicKey);
    return NextResponse.json(
      {
        success: true,
        data: {
          token,
          user: {
            publicKey: newUser.publicKey,
            storageBytesAvailable: newUser.storageBytesAvailable,
            storageUsed: newUser.storageUsed,
            verified: newUser.verified,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
  }
}
