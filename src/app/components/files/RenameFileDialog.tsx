import Popup from '@/app/components/common/Popup';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useNotification } from '@/context/notification';
import apiClient from '@/lib/api-client';
import { FileEntryResponse } from '@/types';
import { X } from 'lucide-react';
import React, { useState } from 'react';

interface RenameFileDialogProps {
  file: FileEntryResponse;
  onClose: () => void;
  setVisibleFiles: React.Dispatch<React.SetStateAction<FileEntryResponse[]>>;
}

export default function RenameFileDialog({
  file,
  onClose,
  setVisibleFiles,
}: RenameFileDialogProps) {
  let name: string;
  let ext: string;
  if (file.type !== 'folder') {
    name = file.name.split('.').slice(0, -1).join('.');
    [ext] = file.name.split('.').slice(-1);
  } else {
    name = file.name;
    ext = '';
  }
  const [newName, setNewName] = useState(name);
  const { setNotification } = useNotification();

  const handleRename = async () => {
    try {
      const response = await apiClient.fileentry.update(file.id, {
        name: ext ? `${newName}.${ext}` : newName,
      });
      if (response.data.success) {
        setVisibleFiles(prevFiles =>
          prevFiles.map(f =>
            f.id === file.id ? { ...f, name: ext ? `${newName}.${ext}` : newName } : f
          )
        );
        setNotification({
          type: 'success',
          title: 'Renamed Successfully',
          message: `${file.type === 'file' ? 'File' : 'Folder'} renamed to ${newName}`,
        });
        onClose();
      } else {
        throw new Error(response.data.error || 'Failed to rename');
      }
    } catch (error) {
      console.error('Error renaming:', error);
      setNotification({
        type: 'error',
        title: 'Rename Failed',
        message: `Failed to rename ${file.type}. Please try again.`,
      });
    }
  };

  return (
    <Popup zIndex={60} alignItems="center" onClose={onClose}>
      <div className="bg-white rounded-lg w-fit max-w-md p-4">
        <div className="flex flex-row justify-between items-center mb-4">
          <p className="text-primary text-lg font-semibold">Rename {file.type}</p>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <Input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="mb-4 text-black"
          placeholder={`Enter new ${file.type} name`}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              handleRename();
            }
          }}
        />
        <div className="flex flex-row items-center justify-end gap-4">
          <Button onClick={onClose} variant="outline" className="text-black">
            Cancel
          </Button>
          <Button onClick={handleRename} disabled={!newName || newName === file.name}>
            Rename
          </Button>
        </div>
      </div>
    </Popup>
  );
}
