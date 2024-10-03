import FileGridItem from '@/app/components/files/FileGridItem';
import useDebounce from '@/app/hooks/useDebounce';
import { FileEntryResponse } from '@/types';
import React, { useMemo } from 'react';

interface FileGridViewProps {
  files: FileEntryResponse[];
  setSelectedFile: React.Dispatch<React.SetStateAction<FileEntryResponse | undefined>>;
  setVisibleFiles: React.Dispatch<React.SetStateAction<FileEntryResponse[]>>;
  searchInput: string;
}

export default function FileGridView({
  files,
  setSelectedFile,
  setVisibleFiles,
  searchInput,
}: FileGridViewProps) {
  const debouncedSearchInput = useDebounce(searchInput, 200);
  const visibleFiles = useMemo(() => {
    const trimmedSearch = debouncedSearchInput.trim().toLowerCase();
    let filteredFiles = files;
    if (trimmedSearch !== '') {
      filteredFiles = files.filter(file => file.name.toLowerCase().includes(trimmedSearch));
    }

    // Separate folders and files
    const folders = filteredFiles.filter(file => file.type === 'folder');
    const nonFolders = filteredFiles.filter(file => file.type !== 'folder');

    // Sort folders and files separately
    const sortedFolders = folders.sort((a, b) => a.name.localeCompare(b.name));
    const sortedFiles = nonFolders.sort((a, b) => a.name.localeCompare(b.name));

    // Combine sorted folders and files
    return [...sortedFolders, ...sortedFiles];
  }, [files, debouncedSearchInput]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 md:pt-8">
      {visibleFiles.map(file => (
        <FileGridItem
          key={file.id}
          file={file}
          setSelectedFile={setSelectedFile}
          setVisibleFiles={setVisibleFiles}
        />
      ))}
    </div>
  );
}
