'use client';

import ViewToggle from '@/app/components/ViewToggle';
import FileDialog from '@/app/components/files/FileDialog';
import FileGridView from '@/app/components/files/FileGridView';
import FileListView from '@/app/components/files/FileListView';
import { useGlobalState } from '@/app/hooks/useGlobalState';
import { useAuth } from '@/context/auth';
import { useDevice } from '@/context/device';
import { useNotification } from '@/context/notification';
import apiClient from '@/lib/api-client';
import { FileEntryResponse } from '@/types';
import { Loader2, Trash2 as TrashIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export default function Trash() {
  const [deletedFiles, setDeletedFiles] = useState<FileEntryResponse[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileEntryResponse | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const { status } = useAuth();
  const { setNotification } = useNotification();
  const { isMobile } = useDevice();

  const totalFiles = deletedFiles.length;
  const { setTotalFiles, getSearchInput, getIsGridView, setIsGridView } = useGlobalState();
  const isListView = !getIsGridView();

  useEffect(() => {
    setTotalFiles(totalFiles);
  }, [totalFiles, setTotalFiles]);

  const searchInput = getSearchInput() || '';

  const fetchDeletedFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.fileentry.getDeleted();
      if (response.data.success) {
        setDeletedFiles(response.data.data.items);
      } else {
        console.error('Failed to fetch deleted files:', response.data.error);
      }
    } catch (error) {
      console.error('Error fetching deleted files:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDeletedFiles();
    }
  }, [status, fetchDeletedFiles]);

  useEffect(() => {
    if (selectedFile && selectedFile.type === 'folder') {
      setNotification({
        type: 'error',
        title: 'Folder Error',
        message: 'Folders cannot be viewed in trash',
      });
    }
  }, [selectedFile]);

  const handleViewChange = () => setIsGridView(isListView);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-4 md:pt-8 w-full h-[85%]">
      {isMobile ? (
        <div className="flex flex-row items-center gap-1 text-black">
          <TrashIcon className="h-4 w-4 -mt-[2px]" />
          <p>Trash</p>
        </div>
      ) : (
        <div className="flex flex-row justify-end  h-[42px]">
          <ViewToggle isListView={isListView} onViewChange={handleViewChange} />
        </div>
      )}

      {totalFiles === 0 ? (
        <div className="flex justify-center items-center h-[60%]">
          <p className="text-primary text-lg font-semibold">No files in trash</p>
        </div>
      ) : (
        <>
          {isListView && totalFiles && !isMobile && (
            <FileListView
              files={deletedFiles}
              setSelectedFile={setSelectedFile}
              setVisibleFiles={setDeletedFiles}
              searchInput={searchInput}
            />
          )}
          {(!isListView || isMobile) && totalFiles && (
            <FileGridView
              files={deletedFiles}
              setSelectedFile={setSelectedFile}
              setVisibleFiles={setDeletedFiles}
              searchInput={searchInput}
            />
          )}
          {selectedFile && selectedFile.type === 'file' && (
            <FileDialog
              file={selectedFile}
              onClose={() => setSelectedFile(undefined)}
              setVisibleFiles={setDeletedFiles}
              currentPath={[]} // Add this line to pass an empty array for currentPath
            />
          )}
        </>
      )}
    </div>
  );
}
