import React from 'react';
import AllFileActionsMenu from '@/app/components/files/FileActions/AllFileActionsMenu';
import SharedFileActionsMenu from '@/app/components/files/FileActions/SharedFileActionsMenu';
import TrashFileActionsMenu from '@/app/components/files/FileActions/TrashFileActionsMenu';
import { FileEntryResponse } from '@/types';

export default function FileActionsMenu({
  file,
  setVisibleFiles,
}: {
  file: FileEntryResponse;
  setVisibleFiles: React.Dispatch<React.SetStateAction<FileEntryResponse[]>>;
}) {
  if (typeof window !== 'undefined') {
    if (window.location.href.includes('shared')) {
      return <SharedFileActionsMenu file={file} />;
    }
    if (window.location.href.includes('trash')) {
      return <TrashFileActionsMenu file={file} setVisibleFiles={setVisibleFiles} />;
    }
  }
  return <AllFileActionsMenu file={file} setVisibleFiles={setVisibleFiles} />;
}
