import FileIcon from '@/app/components/common/FileIcon';
import Popup from '@/app/components/common/Popup';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useNotification } from '@/context/notification';
import apiClient from '@/lib/api-client';
import { FileEntryResponse, FileShare } from '@/types';
import { useWallet } from '@solana/wallet-adapter-react';
import { Copy, Globe, Link as LinkIcon, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ShareFileProps {
  file: FileEntryResponse;
  zIndex: number;
  onClose: () => void;
}

export default function ShareFile({ file, zIndex, onClose }: ShareFileProps) {
  const [currentFile, setCurrentFile] = useState<FileEntryResponse>(file);
  const [domain, setDomain] = useState('');
  const [shares, setShares] = useState<FileShare[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { setNotification } = useNotification();
  const { publicKey } = useWallet();

  const fetchShares = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.fileentry.getShares(currentFile.id);
      if (response.data.success) {
        setShares(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to fetch shares');
      }
    } catch (error) {
      console.error('Error fetching shares:', error);
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch shares. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentFile.id, setNotification]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const handleShare = async () => {
    if (!domain) {
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Please enter a valid domain or public key.',
      });
      return;
    }

    setIsSharing(true);
    try {
      const response = await apiClient.fileentry.share({
        fileId: currentFile.id,
        sharedWithPK: domain,
        permission: 'read',
      });
      if (response.data.success) {
        setNotification({
          type: 'success',
          title: 'Shared',
          message: `File shared with ${domain}`,
        });
        fetchShares();
        setDomain('');
      } else {
        throw new Error(response.data.error || 'Failed to share file');
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to share file. Please try again.',
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      const response = await apiClient.fileentry.removeShare(shareId);
      if (response.data.success) {
        setNotification({
          type: 'success',
          title: 'Removed',
          message: 'Share removed successfully',
        });
        fetchShares();
      } else {
        throw new Error(response.data.error || 'Failed to remove share');
      }
    } catch (error) {
      console.error('Error removing share:', error);
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to remove share. Please try again.',
      });
    }
  };

  const handleTogglePublicShare = async () => {
    if (currentFile.type === 'folder') {
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Folders cannot be shared publicly',
      });
      return;
    }

    if (!publicKey) {
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Wallet not connected',
      });
      return;
    }

    try {
      const response = await apiClient.fileentry.update(currentFile.id, {
        isPubliclyShared: !currentFile.isPubliclyShared,
      });
      if (response.data.success) {
        const updatedFile = {
          ...currentFile,
          isPubliclyShared: !currentFile.isPubliclyShared,
          publicShareId: response.data.data.publicShareId,
        };
        setCurrentFile(updatedFile);
        setNotification({
          type: 'success',
          title: updatedFile.isPubliclyShared ? 'Shared Publicly' : 'Unshared Publicly',
          message: updatedFile.isPubliclyShared
            ? 'File is now publicly shared'
            : 'File is no longer publicly shared',
        });
      } else {
        throw new Error(response.data.error || 'Failed to update public sharing status');
      }
    } catch (error) {
      console.error('Error toggling public share:', error);
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update public sharing status. Please try again.',
      });
    }
  };

  const handleCopyPublicLink = () => {
    if (currentFile.type === 'file' && currentFile.publicShareId) {
      const publicLink = `${window.location.origin}/share/${currentFile.publicShareId}`;
      navigator.clipboard.writeText(publicLink);
      setNotification({
        type: 'success',
        title: 'Copied',
        message: 'Public link copied to clipboard',
      });
    }
  };

  return (
    <Popup zIndex={zIndex} onClose={onClose} alignItems="center">
      <div className="bg-white rounded-lg w-[95vw] md:w-[60vw] h-[60vh] overflow-y-auto">
        <div className="px-2 md:px-4 pt-4 flex flex-row justify-between pb-2 border-b border-b-gray-200">
          <div className="flex flex-row gap-2">
            <FileIcon file={currentFile} className="h-8 w-8" />
            <h2 className="text-primary text-xl font-semibold mb-2">{currentFile.name}</h2>
          </div>
          <button type="button" onClick={onClose}>
            <X size={24} color="gray" />
          </button>
        </div>
        <div className="p-3 md:p-8">
          {currentFile.type === 'file' && (
            <div className="mb-8">
              <h3 className="text-primary text-lg font-semibold mb-4">Public Sharing</h3>
              {currentFile.isPubliclyShared ? (
                <div className="rounded-lg">
                  <div className="flex items-center justify-between">
                    <Input
                      value={`${window.location.origin}/share/${currentFile.publicShareId}`}
                      readOnly
                      className="flex-grow p-2 border rounded mr-2 text-gray-500"
                    />
                    <Button onClick={handleCopyPublicLink} className="whitespace-nowrap mr-2">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      onClick={handleTogglePublicShare}
                      variant="destructive"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Unshare
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={handleTogglePublicShare} className="w-full">
                  <Globe className="mr-2 h-4 w-4" />
                  Share Publicly
                </Button>
              )}
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-primary text-lg font-semibold mb-4">Private Sharing</h3>
            <div className="flex gap-2 items-center">
              <Input
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="Solana public key"
                className="flex-grow text-black"
                spellCheck="false"
              />
              <Button onClick={handleShare} disabled={isSharing}>
                {isSharing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LinkIcon className="mr-2 h-4 w-4" />
                )}
                Share
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-primary font-semibold mb-4">Shared With</h3>
            {isLoading && (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {!isLoading && shares.length === 0 && (
              <p className="text-gray-500">No private shares yet.</p>
            )}
            {!isLoading && shares.length > 0 && (
              <div className="space-y-2">
                {shares.map(share => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-2 bg-gray-100 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Globe color="gray" className="w-5 h-5" />
                      <p className="text-primary">{share.sharedWithPK}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveShare(share.id)}
                    >
                      Unshare
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Popup>
  );
}
