import React, { useState, useCallback } from 'react';
import Popup from '@/app/components/common/Popup';
import { Button } from '@/app/components/ui/button';
import { useNotification } from '@/context/notification';
import apiClient from '@/lib/api-client';
import { FileEntryResponse } from '@/types';
import { X } from 'lucide-react';

interface CreateFolderProps {
  onClose: () => void;
  setUploadedFiles: React.Dispatch<React.SetStateAction<FileEntryResponse[]>>;
  currentPath: string[];
}

export default function CreateFolder({
  onClose,
  setUploadedFiles,
  currentPath,
}: CreateFolderProps) {
  const { setNotification } = useNotification();
  const [folderName, setFolderName] = useState('');

  const handleCreateFolder = useCallback(async () => {
    if (!folderName.trim()) {
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Folder name cannot be empty',
      });
      return;
    }

    try {
      const folderId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null;
      console.log('Creating new folder:', folderName, 'in folder:', folderId);

      const response = await apiClient.fileentry.create({
        name: folderName.trim(),
        type: 'folder',
        folderId,
      });

      if (response.data.success) {
        console.log('Folder created successfully');
        setUploadedFiles(prevFiles => [...prevFiles, response.data.data]);
        setNotification({
          type: 'success',
          title: 'Success',
          message: 'Folder created successfully',
        });
        onClose();
      } else {
        throw new Error(response.data.error || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating new folder:', error);
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to create new folder',
      });
    }
  }, [folderName, currentPath, setUploadedFiles, setNotification, onClose]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFolderName(e.target.value);
  }, []);

  return (
    <Popup zIndex={50} onClose={onClose} alignItems="center">
      <div className="z-[51] flex flex-col bg-white rounded-lg p-6 min-w-[400px]">
        <div className="flex items-center justify-between w-full">
          <h2 className="text-lg font-semibold text-primary">Create Folder</h2>
          <button onClick={onClose} type="button">
            <X size={24} />
          </button>
        </div>
        <input
          type="text"
          value={folderName}
          onChange={handleInputChange}
          placeholder="Folder Name"
          className="w-full mt-4 p-2 border border-primary rounded-md text-black"
          spellCheck="false"
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              handleCreateFolder();
            }
          }}
        />
        <Button
          onClick={handleCreateFolder}
          disabled={!folderName.trim()}
          className="mt-4 w-full btn-primary"
        >
          Create Folder
        </Button>
      </div>
    </Popup>
  );
}
