import { FileEntryResponse } from '@/types';
import { saveAs } from 'file-saver';
import { NotificationParams } from '@/context/notification';
import prisma from '@/lib/prisma';

export function isFileType(
  file: FileEntryResponse
): file is FileEntryResponse & { type: 'file'; size: number } {
  return file.type === 'file' && 'size' in file;
}

export const handleDownloadClicked = async (
  file: FileEntryResponse,
  setNotification: (params: NotificationParams) => void
) => {
  if (isFileType(file) && file.url) {
    try {
      const response = await fetch(file.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      saveAs(blob, file.name || 'download');
    } catch (error) {
      console.error('Error downloading file:', error);
      setNotification({
        type: 'error',
        title: 'Download Error',
        message: 'Failed to download file',
      });
    }
  } else {
    setNotification({
      type: 'error',
      title: 'Download Error',
      message: 'File URL not available',
    });
    throw new Error('File URL not available');
  }
};

export async function removeAllShares(fileEntryId: string): Promise<void> {
  try {
    // Remove all private shares
    await prisma.fileShare.deleteMany({
      where: { fileEntryId },
    });

    // Remove public sharing
    await prisma.fileEntry.update({
      where: { id: fileEntryId },
      data: { isPubliclyShared: false, publicShareId: null },
    });
  } catch (error) {
    console.error('Error removing all shares:', error);
    throw new Error('Failed to remove all shares');
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createFileEntryResponse(file: any): FileEntryResponse {
  const baseResponse = {
    id: file.id,
    name: file.name,
    type: file.type,
    ownerPK: file.ownerPK,
    folderId: file.folderId,
    deleted: file.deleted,
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
    encryptionKey: file.encryptionKey,
    metadata: file.metadata,
    isPrivate: file.isPrivate,
    isPubliclyShared: file.isPubliclyShared,
    publicShareId: file.publicShareId,
    uploadedSize: file.uploadedSize,
  };

  if (file.type === 'folder') {
    return {
      ...baseResponse,
      type: 'folder' as const,
      mimeType: 'application/vnd.chakradrive.folder' as const,
    };
  }
  return {
    ...baseResponse,
    type: 'file' as const,
    size: file.size ?? 0,
    mimeType: file.mimeType ?? 'application/octet-stream',
    url: file.url ?? '',
  };
}
