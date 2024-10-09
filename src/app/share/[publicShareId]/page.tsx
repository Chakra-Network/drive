import { Metadata } from 'next';
import { publicFileApi } from '@/lib/api-client';
import { getBaseUrl } from '@/lib/utils';
import ShareContent from './ClientShareContent';

type Props = {
  params: { publicShareId: string };
};

const baseUrl = getBaseUrl();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicShareId } = params;

  try {
    const response = await publicFileApi.getPublic(publicShareId);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch file data');
    }

    const { file } = response.data.data;
    const fileUrl = `${baseUrl}/share/${publicShareId}`;

    let imageUrl = `${baseUrl}/chakra_preview.png`;
    let description = `Access this file "${file.name}" shared on Chakra Drive.`;

    // Use actual image URL for image files
    if (file.mimeType.startsWith('image/')) {
      imageUrl = file.url;
      description = `View this image "${file.name}" shared on Chakra Drive.`;
    }

    const title = `Chakra Drive: ${file.name}`;

    const metadata: Metadata = {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: fileUrl,
        siteName: 'Chakra Drive',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `Preview for ${file.name}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
        site: '@chakra_ai',
      },
    };

    return metadata;
  } catch (error) {
    console.error('Error in generateMetadata:', error);
    // Return default metadata in case of error
    return {
      title: 'Chakra Drive - Shared Content',
      description: 'View or download shared content on Chakra Drive.',
      openGraph: {
        title: 'Chakra Drive - Shared Content',
        description: 'View or download shared content on Chakra Drive.',
        type: 'website',
        url: `${baseUrl}/share/${publicShareId}`,
        siteName: 'Chakra Drive',
        images: [
          {
            url: `${baseUrl}/chakra_preview.png`,
            width: 1200,
            height: 630,
            alt: 'Chakra Drive Preview',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Chakra Drive - Shared Content',
        description: 'View or download shared content on Chakra Drive.',
        images: [`${baseUrl}/chakra_preview.png`],
        site: '@chakra_ai',
      },
    };
  }
}

export default function PublicFilePage({ params }: Props) {
  return <ShareContent publicShareId={params.publicShareId} />;
}
