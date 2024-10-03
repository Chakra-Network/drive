import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { z } from 'zod';

const TipPayloadSchema = z.object({
  amount: z.number().positive(),
  publicShareId: z.string().nonempty(),
  tipperPublicKey: z.string().nonempty(),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ transaction: string }>>> {
  try {
    const payload = await request.json();
    console.log('Received tip payload:', payload);
    const { amount, publicShareId, tipperPublicKey } = TipPayloadSchema.parse(payload);

    const file = await prisma.fileEntry.findUnique({
      where: { publicShareId },
      include: { owner: { select: { publicKey: true } } },
    });

    if (!file) {
      console.error('File not found for publicShareId:', publicShareId);
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    if (!file.isPubliclyShared) {
      console.error('File is not publicly shared:', file.id);
      return NextResponse.json(
        { success: false, error: 'File is not publicly shared' },
        { status: 403 }
      );
    }

    const recipientPublicKey = new PublicKey(file.owner.publicKey);
    const senderPublicKey = new PublicKey(tipperPublicKey);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderPublicKey,
        toPubkey: recipientPublicKey,
        lamports: amount * 1e9, // Convert SOL to lamports
      })
    );

    // Serialize the transaction
    const serializedTransaction = transaction
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    console.log('Generated transaction for tip');

    return NextResponse.json({
      success: true,
      data: { transaction: serializedTransaction },
    });
  } catch (error) {
    console.error('Error creating tip transaction:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input data',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create tip transaction',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
