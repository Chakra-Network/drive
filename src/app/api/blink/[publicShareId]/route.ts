import { addBlinkHeaders } from '@/lib/blink-utils';
import prisma from '@/lib/prisma';
import { getBaseUrl } from '@/lib/utils';
import { ACTIONS_CORS_HEADERS, ActionGetResponse } from '@solana/actions';

const isSupportedBlinkImageFormat = (url: string | null, fileName: string) => {
  if (!url || !fileName) return false;
  const extension = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension || '');
};

export const GET = async (req: Request) => {
  try {
    const url = new URL(req.url);
    const publicShareId = url.pathname.split('/').pop();

    const file = await prisma.fileEntry.findUnique({
      where: { publicShareId },
      include: { owner: { select: { publicKey: true } } },
    });

    if (!file) {
      return addBlinkHeaders(
        Response.json(
          { error: 'File not found' },
          {
            status: 404,
            headers: ACTIONS_CORS_HEADERS,
          }
        )
      );
    }

    const appUrl = getBaseUrl();

    const payload: ActionGetResponse = {
      type: 'action',
      icon: isSupportedBlinkImageFormat(file.url, file.name)
        ? file.url || `${appUrl}/blink_placeholder.png`
        : `${appUrl}/blink_placeholder.png`,
      title: `Chakra Drive: ${file.name}`,
      description: `Click to view file at Chakra Drive or send a tip to the creator.`,
      label: 'View or Tip File',
      links: {
        actions: [
          {
            type: 'post',
            href: `${appUrl}/api/blink/${publicShareId}/tip?amount=0.1`,
            label: 'Tip 0.1 SOL',
          },
          {
            type: 'post',
            href: `${appUrl}/api/blink/${publicShareId}/tip?amount=0.5`,
            label: 'Tip 0.5 SOL',
          },
          {
            type: 'post',
            href: `${appUrl}/api/blink/${publicShareId}/tip?amount={amount}`,
            label: 'Custom Tip',
            parameters: [
              {
                name: 'amount',
                label: 'Enter SOL amount',
                type: 'number',
                required: true,
                min: 0.0001,
              },
            ],
          },
          // {
          //   type: 'external-link',
          //   href: `${appUrl}/api/blink/${publicShareId}/view`,
          //   label: 'View File',
          // },
        ],
      },
    };

    return addBlinkHeaders(
      Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
      })
    );
  } catch (error) {
    return addBlinkHeaders(
      Response.json(
        { error: 'Internal server error' },
        {
          status: 500,
          headers: ACTIONS_CORS_HEADERS,
        }
      )
    );
  }
};

export const OPTIONS = async () => {
  return addBlinkHeaders(new Response(null, { headers: ACTIONS_CORS_HEADERS }));
};
