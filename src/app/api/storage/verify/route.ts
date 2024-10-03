import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
  }

  try {
    const payload = await verifyToken(request);
    if (payload) {
      return NextResponse.json({
        success: true,
        data: {
          verified: true,
          publicKey: payload.wallet, // Assuming payload.wallet contains the public key
        },
      });
    }
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Token verification failed' },
      { status: 401 }
    );
  }
}
