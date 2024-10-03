'use client';

import FileDialog from '@/app/components/files/FileDialog';
import FileGridView from '@/app/components/files/FileGridView';
import FileListView from '@/app/components/files/FileListView';
import ViewToggle from '@/app/components/ViewToggle';
import { useGlobalState } from '@/app/hooks/useGlobalState';
import { useAuth } from '@/context/auth';
import { useDevice } from '@/context/device';
import { useNotification } from '@/context/notification';
import apiClient from '@/lib/api-client';
import { FileEntryResponse } from '@/types';
import { Loader2, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function SharedWithMe() {
  const [sharedFiles, setSharedFiles] = useState<FileEntryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileEntryResponse | undefined>(undefined);

  const { status } = useAuth();
  const { setNotification } = useNotification();

  const totalFiles = sharedFiles.length;
  const { setTotalFiles, getSearchInput, getIsGridView, setIsGridView } = useGlobalState();
  const isListView = !getIsGridView();
  const searchInput = getSearchInput() || '';
  const { isMobile } = useDevice();

  useEffect(() => {
    setTotalFiles(totalFiles);
  }, [totalFiles, setTotalFiles]);

  const fetchSharedFiles = useCallback(
    async (page: number = 1) => {
      if (status !== 'authenticated') return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.fileentry.getSharedWithMe({ page, pageSize: 20 });
        if (response.data.success) {
          setSharedFiles(response.data.data.items);
        } else {
          throw new Error(response.data.error || 'Failed to fetch shared files');
        }
      } catch (err) {
        console.error('Error fetching shared files:', err);
        setError('An error occurred while fetching shared files');
        setNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load shared files',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [status, setNotification]
  );

  useEffect(() => {
    fetchSharedFiles();
  }, [fetchSharedFiles]);

  const renderContent = useMemo(() => {
    if (status === 'unauthenticated') {
      return <div className="text-center mt-8">Please log in to view shared files.</div>;
    }

    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (error) {
      return <div className="text-center text-red-500">{error}</div>;
    }

    if (sharedFiles.length === 0) {
      return (
        <div className="flex justify-center items-center h-[60%]">
          <p className="text-primary text-lg font-semibold text-center">
            No files have been shared with you yet
          </p>
        </div>
      );
    }

    return isListView && !isMobile ? (
      <FileListView
        files={sharedFiles}
        setSelectedFile={setSelectedFile}
        setVisibleFiles={setSharedFiles}
        searchInput={searchInput}
      />
    ) : (
      <FileGridView
        files={sharedFiles}
        setSelectedFile={setSelectedFile}
        setVisibleFiles={setSharedFiles}
        searchInput={searchInput}
      />
    );
  }, [isLoading, error, sharedFiles, isListView, searchInput, status]);

  return (
    <div className="pt-4 md:pt-8 w-full h-[85%]">
      {isMobile ? (
        <div className="flex flex-row items-center gap-1 text-black">
          <Users className="h-4 w-4 -mt-[2px]" />
          <p>Shared</p>
        </div>
      ) : (
        <div className="flex flex-row justify-end  h-[42px]">
          <ViewToggle isListView={isListView} onViewChange={() => setIsGridView(!isListView)} />
        </div>
      )}
      {renderContent}

      {selectedFile && (
        <FileDialog
          file={selectedFile}
          onClose={() => setSelectedFile(undefined)}
          setVisibleFiles={setSharedFiles}
          isNotOwner
          currentPath={[]} // Pass an empty array as there's no folder hierarchy in shared files
        />
      )}
    </div>
  );
}
