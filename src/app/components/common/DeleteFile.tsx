import React from 'react';
import Popup from '@/app/components/common/Popup';
import { FileEntryResponse } from '@/types';
import { X } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useNotification } from '@/context/notification';

interface DeleteFileProps {
  file: FileEntryResponse;
  isSoftDelete: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export default function DeleteFile({ file, isSoftDelete, onClose, onDelete }: DeleteFileProps) {
  const { setNotification } = useNotification();

  const moveToTrash = async () => {
    console.log(`Moving ${file.type} to trash:`, file);
    try {
      const response = await apiClient.fileentry.update(file.id, { deleted: true });
      if (response.data.success) {
        setNotification({
          type: 'success',
          title: `${file.type === 'file' ? 'File' : 'Folder'} moved to trash`,
          message: `The ${file.type} has been successfully moved to trash`,
        });
        onDelete();
      } else {
        throw new Error(response.data.error || `Failed to move ${file.type} to trash`);
      }
    } catch (error) {
      console.error(`Error moving ${file.type} to trash:`, error);
      setNotification({
        type: 'error',
        title: `Failed to move ${file.type} to trash`,
        message: `An error occurred while moving the ${file.type} to trash. ${
          error instanceof Error ? error.message : ''
        }`,
      });
    }
  };

  const permanentlyDelete = async () => {
    console.log(`Permanently deleting ${file.type}:`, file);
    try {
      const response = await apiClient.fileentry.delete(file.id);
      if (response.data.success) {
        setNotification({
          type: 'success',
          title: `${file.type === 'file' ? 'File' : 'Folder'} deleted`,
          message: `The ${file.type} has been permanently deleted`,
        });
        onDelete();
      } else {
        throw new Error(response.data.error || `Failed to delete ${file.type}`);
      }
    } catch (error) {
      console.error(`Error deleting ${file.type}:`, error);
      setNotification({
        type: 'error',
        title: `Failed to delete ${file.type}`,
        message: `An error occurred while deleting the ${file.type}. ${
          error instanceof Error ? error.message : ''
        }`,
      });
    }
  };

  const getConfirmationMessage = () => {
    if (isSoftDelete) {
      return `Are you sure you want to move this ${file.type} to trash?`;
    }
    return `Are you sure you want to permanently delete this ${file.type}? This action cannot be undone.`;
  };

  const getActionButtonText = () => {
    if (isSoftDelete) {
      return 'Move to Trash';
    }
    return 'Delete Permanently';
  };

  return (
    <Popup zIndex={60} alignItems="center" onClose={onClose}>
      <div className="bg-white rounded-lg w-fit max-w-md p-4" style={{ zIndex: 61 }}>
        <div className="flex flex-row justify-between items-center mb-4">
          <p className="text-primary text-lg font-semibold">
            {isSoftDelete ? `Move ${file.type} to trash?` : `Delete ${file.type}?`}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-gray-600 mb-6">{getConfirmationMessage()}</p>
        <div className="flex flex-row items-center justify-end gap-4">
          <button type="button" onClick={onClose} className="text-primary hover:underline">
            Cancel
          </button>
          <button
            type="button"
            onClick={isSoftDelete ? moveToTrash : permanentlyDelete}
            className="btn-tertiary"
          >
            {getActionButtonText()}
          </button>
        </div>
      </div>
    </Popup>
  );
}
