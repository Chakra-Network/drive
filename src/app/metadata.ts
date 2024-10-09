import { Metadata } from 'next';
import { getBaseUrl } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Chakra Drive',
  description: 'Your Files, Your Keys',
  metadataBase: new URL(getBaseUrl()),
  openGraph: {
    title: 'Chakra Drive',
    description: 'Your Files, Your Keys',
    url: '/',
    siteName: 'Chakra Drive',
    images: [
      {
        url: '/chakra_preview.png',
        width: 1200,
        height: 630,
        alt: 'Chakra Drive Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chakra Drive',
    description: 'Your Files, Your Keys',
    images: ['/chakra_preview.png'],
    creator: '@chakra_ai',
  },
};
