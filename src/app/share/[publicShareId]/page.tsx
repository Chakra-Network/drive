import { Metadata } from 'next';
import { publicFileApi } from '@/lib/api-client';
import { getBaseUrl } from '@/lib/utils';
import { FileEntryResponse } from '@/types';
import ShareContent from './ClientShareContent';

type Props = {
  params: { publicShareId: string };
};

function getFileTypeInfo(file: FileEntryResponse): {
  type: string;
  icon: string;
  description: string;
} {
  if (file.type === 'folder') {
    return {
      type: 'Folder',
      icon: 'folder.png',
      description: `Explore this shared folder "${file.name}" on Chakra Drive.`,
    };
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.mimeType?.toLowerCase() || '';

  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'svg'].includes(extension || '')) {
    return {
      type: 'Image',
      icon: file.url || (extension === 'svg' ? 'svg.png' : 'png.png'),
      description: `View this image "${file.name}" shared on Chakra Drive.`,
    };
  }

  if (mimeType.startsWith('video/') || ['mp4', 'mov'].includes(extension || '')) {
    return {
      type: 'Video',
      icon: extension === 'mp4' ? 'mp4.png' : 'mov.png',
      description: `Watch this video "${file.name}" shared on Chakra Drive.`,
    };
  }

  if (mimeType.startsWith('audio/') || extension === 'wav') {
    return {
      type: 'Audio',
      icon: 'wav.png',
      description: `Listen to this audio file "${file.name}" shared on Chakra Drive.`,
    };
  }

  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return {
      type: 'PDF',
      icon: 'pdf.png',
      description: `Read this PDF "${file.name}" shared on Chakra Drive.`,
    };
  }

  if (extension === 'doc' || extension === 'docx') {
    return {
      type: 'Document',
      icon: 'doc.png',
      description: `View this document "${file.name}" shared on Chakra Drive.`,
    };
  }

  // Default case for other file types
  return {
    type: 'File',
    icon: 'file.png',
    description: `Access this file "${file.name}" shared on Chakra Drive.`,
  };
}

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

    const { type, icon, description } = getFileTypeInfo(file);

    const imageUrl = icon.startsWith('http') ? icon : `${baseUrl}/file-icons/${icon}`;

    const title = `Chakra Drive: ${type} - ${file.name}`;

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
            alt: `${type} icon for ${file.name}`,
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
      },
      twitter: {
        card: 'summary',
        title: 'Chakra Drive - Shared Content',
        description: 'View or download shared content on Chakra Drive.',
        site: '@chakra_ai',
      },
    };
  }
}

export default function PublicFilePage({ params }: Props) {
  return <ShareContent publicShareId={params.publicShareId} />;
}
