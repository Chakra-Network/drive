import { NextRequest, NextResponse } from 'next/server';
import { verifySignature } from '@/lib/solana';
import { generateToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { publicKey, signature, message } = body;

  console.log('Received login request:', {
    publicKey,
    signature,
    message,
  });

  if (!publicKey || !signature || !message) {
    console.error('Missing required fields');
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const isValidSignature = await verifySignature(publicKey, signature, message);
    if (!isValidSignature) {
      console.error('Invalid signature');
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    let user = await prisma.user.findUnique({ where: { publicKey } });
    let isNewUser = false;

    if (!user) {
      console.log('Creating new user');
      user = await prisma.user.create({
        data: {
          publicKey,
          storageBytesAvailable: 100 * 1024 * 1024, // 100 MB
          verified: true,
        },
      });
      isNewUser = true;
    } else if (!user.verified) {
      console.log('Updating unverified user');
      user = await prisma.user.update({
        where: { publicKey },
        data: {
          verified: true,
          storageBytesAvailable: 100 * 1024 * 1024, // 100 MB
        },
      });
    }

    const pendingShares = await prisma.fileShare.findMany({
      where: { sharedWithPK: publicKey },
      include: { fileEntry: true },
    });

    const token = generateToken(publicKey);

    console.log('Login successful');
    return NextResponse.json(
      {
        success: true,
        data: {
          token,
          user: {
            publicKey: user.publicKey,
            storageBytesAvailable: user.storageBytesAvailable,
            storageUsed: user.storageUsed,
            verified: user.verified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          isNewUser,
          pendingShares: pendingShares.map(share => ({
            id: share.id,
            fileId: share.fileEntryId,
            fileName: share.fileEntry.name,
            sharedBy: share.ownerPK,
            permission: share.permission,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
