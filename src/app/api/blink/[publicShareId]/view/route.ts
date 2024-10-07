import { ACTIONS_CORS_HEADERS, ActionPostResponse } from '@solana/actions';
import prisma from '@/lib/prisma';
import { createBlinkResponse } from '@/lib/blink-utils';
import { getBaseUrl } from '@/lib/utils';

export const POST = async (req: Request) => {
  try {
    const url = new URL(req.url);
    const publicShareId = url.pathname.split('/').slice(-2)[0];
    console.log('Received POST request for view file, publicShareId:', publicShareId);

    const file = await prisma.fileEntry.findUnique({
      where: { publicShareId },
    });

    if (!file) {
      return createBlinkResponse(
        { error: 'File not found' },
        {
          status: 404,
          headers: ACTIONS_CORS_HEADERS,
        }
      );
    }

    const baseUrl = getBaseUrl();
    const viewFileUrl = `${baseUrl}/share/${publicShareId}`;

    const payload: ActionPostResponse = {
      type: 'external-link',
      externalLink: viewFileUrl,
    };

    console.log('Returning view file payload:', payload);

    return createBlinkResponse(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (error) {
    console.error('Error in POST request for view file:', error);
    return createBlinkResponse(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: ACTIONS_CORS_HEADERS,
      }
    );
  }
};

export const OPTIONS = async () => {
  return createBlinkResponse(null, { headers: ACTIONS_CORS_HEADERS });
};
