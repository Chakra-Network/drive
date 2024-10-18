import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET(request: NextRequest): Promise<NextResponse> {
  // get the hash from the request url
  const hash = request.nextUrl.searchParams.get('hash');
  const publicKey = request.nextUrl.searchParams.get('public_key');
  if (!hash) {
    return NextResponse.json(
      { error: 'Hash not provided' },
      {
        status: 400,
      }
    );
  }
  if (!publicKey) {
    return NextResponse.json(
      { error: 'Public key not provided' },
      {
        status: 400,
      }
    );
  }
  try {
    console.log('Verifying hash');
    const foundHash = await prisma.jwtHash.findFirst({
      where: {
        hash,
        publicKey,
      },
    });

    if (!foundHash) {
      return NextResponse.json(
        { success: false },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false },
      {
        status: 500,
      }
    );
  }
}
