import DeleteFile from '@/app/components/common/DeleteFile';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { useNotification } from '@/context/notification';
import apiClient from '@/lib/api-client';
import { FileEntryResponse } from '@/types';
import { ArchiveRestore, EllipsisVertical, Trash } from 'lucide-react';
import React, { useState } from 'react';

interface TrashFileActionsMenuProps {
  file: FileEntryResponse;
  setVisibleFiles: React.Dispatch<React.SetStateAction<FileEntryResponse[]>>;
}

export default function TrashFileActionsMenu({ file, setVisibleFiles }: TrashFileActionsMenuProps) {
  const [deletedClicked, setDeletedClicked] = useState(false);
  const { setNotification } = useNotification();

  const handleRestore = async () => {
    try {
      const response = await apiClient.fileentry.restore(file.id);
      if (response.data.success) {
        setNotification({
          type: 'success',
          title: 'File Restored',
          message: 'The file has been successfully restored',
        });
        setVisibleFiles(prevFiles => prevFiles.filter(f => f.id !== file.id));
      } else {
        throw new Error(response.data.error || 'Failed to restore file');
      }
    } catch (error) {
      console.error('Error restoring file:', error);
      setNotification({
        type: 'error',
        title: 'Restore Failed',
        message: `An error occurred while restoring the file. ${
          error instanceof Error ? error.message : ''
        }`,
      });
    }
  };

  const handleDeleteClicked = () => {
    setDeletedClicked(true);
  };

  const handleFileDeleted = () => {
    setDeletedClicked(false);
    setVisibleFiles(prevFiles => prevFiles.filter(f => f.id !== file.id));
  };

  return (
    <>
      {deletedClicked && (
        <DeleteFile
          file={file}
          isSoftDelete={false}
          onClose={() => setDeletedClicked(false)}
          onDelete={handleFileDeleted}
        />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <EllipsisVertical className="h-5 w-6 text-[#707D75]" />
            <span className="sr-only">Open file actions menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleRestore} className="cursor-pointer">
            <ArchiveRestore className="mr-2 h-4 w-4" />
            <span>Restore</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDeleteClicked} className="cursor-pointer">
            <Trash className="mr-2 h-4 w-4" />
            <span>Permanently Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
