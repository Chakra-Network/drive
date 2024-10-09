import FileListItem from '@/app/components/files/FileListItem';
import useDebounce from '@/app/hooks/useDebounce';
import { FileEntryResponse } from '@/types';
import { motion } from 'framer-motion';
import React, { useMemo } from 'react';

interface FileListViewProps {
  files: FileEntryResponse[];
  setSelectedFile: React.Dispatch<React.SetStateAction<FileEntryResponse | undefined>>;
  setVisibleFiles: React.Dispatch<React.SetStateAction<FileEntryResponse[]>>;
  searchInput: string;
}

export default function FileListView({
  files,
  setSelectedFile,
  setVisibleFiles,
  searchInput,
}: FileListViewProps) {
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
    <motion.div
      className="w-full h-[calc(100vh-200px)] overflow-y-scroll"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <table className="w-full mt-6">
        <thead>
          <tr className="border-b-2 border-[#B9B9B999] h-full">
            <th className="py-2 text-header-green font-semibold" align="left">
              Name
            </th>
            <th className="py-2 text-header-green font-semibold" align="left">
              File Size
            </th>
            <th className="py-2 text-header-green font-semibold" align="left">
              Date
            </th>
            <th className="py-2 text-header-green font-semibold" align="left">
              Type
            </th>
            <th className="py-2 text-header-green font-semibold" align="left">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleFiles.map(file => (
            <FileListItem
              key={file.id}
              file={file}
              setSelectedFile={setSelectedFile}
              setVisibleFiles={setVisibleFiles}
            />
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
