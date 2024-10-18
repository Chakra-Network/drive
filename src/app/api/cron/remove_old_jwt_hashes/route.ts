import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 0;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('Authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    await prisma.jwtHash.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago. We give extra buffer here to make sure we don't accidentally delete any hashes that were recently signed
        },
      },
    });

    return NextResponse.json({ message: 'Removed old JWT hashes' });
  } catch (error) {
    console.error('Error generating nonce:', error);
    return NextResponse.json(
      { error: 'Error generating nonce' },
      {
        status: 500,
      }
    );
  }
}
