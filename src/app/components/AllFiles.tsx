'use client';

import Breadcrumbs from '@/app/components/Breadcrumbs';
import ViewToggle from '@/app/components/ViewToggle';
import { constructMultipartEncryptedBytes } from '@/app/components/client_lib/lit_encryption';
import DelayedComponent from '@/app/components/common/DelayedComponent';
import Popup from '@/app/components/common/Popup';
import FileDialog from '@/app/components/files/FileDialog';
import FileGridView from '@/app/components/files/FileGridView';
import FileListView from '@/app/components/files/FileListView';
import FileUpload from '@/app/components/files/FileUpload';
import UploadProgress from '@/app/components/files/UploadProgress';
import CreateFolder from '@/app/components/folder/CreateFolder';
import { useGlobalState } from '@/app/hooks/useGlobalState';
import { env } from '@/app/utils/env';
import { useAuth } from '@/context/auth';
import { useDevice } from '@/context/device';
import { useNotification } from '@/context/notification';
import apiClient from '@/lib/api-client';
import { webIrysUploadData } from '@/lib/web_irys';
import { FileEntryResponse } from '@/types';
import { useWallet } from '@solana/wallet-adapter-react';
import { FileUpIcon, FolderPlus, Loader2, Minus, Plus, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface HoverUploadDropdownProps {
  handleFileUploadClick: () => void;

  setIsPrivateUpload: React.Dispatch<React.SetStateAction<boolean>>;
}

function HoverUploadDropdown({
  handleFileUploadClick,
  setIsPrivateUpload,
}: HoverUploadDropdownProps) {
  const [isHovering, setIsHovering] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovering(false);
    }, 300);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className="flex items-center justify-center px-4 py-2.5 bg-black text-white rounded-md hover:bg-[#1d3f2a] focus:outline-none focus:ring-2 focus:ring-header-green focus:ring-opacity-50 transition-colors"
      >
        <FileUpIcon size={20} className="mr-2" />
        <span>Upload File</span>
      </button>
      {isHovering && (
        <div
          className="absolute left-0 mt-1 bg-black text-white rounded-md shadow-lg z-10 w-full"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 hover:bg-[#1d3f2a] transition-colors flex items-center rounded-md"
            onClick={() => {
              setIsPrivateUpload(false);
              handleFileUploadClick();
            }}
          >
            Public
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 hover:bg-[#1d3f2a] transition-colors flex items-center rounded-md"
            onClick={() => {
              setIsPrivateUpload(true);
              handleFileUploadClick();
            }}
          >
            Private
          </button>
        </div>
      )}
    </div>
  );
}

function isFileType(
  file: FileEntryResponse
): file is FileEntryResponse & { type: 'file'; size: number } {
  return file.type === 'file' && 'size' in file;
}

function RenderFileView({
  uploadedFiles,
  handleFileUpload,
  isListView,
  setSelectedFile,
  setUploadedFiles,
  searchInput,
  disableUploadOptionModal,
}: {
  uploadedFiles: FileEntryResponse[];
  handleFileUpload: (files: File[], isPrivate: boolean) => Promise<void>;
  isListView: boolean;
  setSelectedFile: React.Dispatch<React.SetStateAction<FileEntryResponse | undefined>>;
  setUploadedFiles: React.Dispatch<React.SetStateAction<FileEntryResponse[]>>;
  searchInput: string;
  disableUploadOptionModal: boolean;
}) {
  const { isMobile } = useDevice();
  if (uploadedFiles.length === 0) {
    return (
      <FileUpload
        onFileUpload={handleFileUpload}
        disableUploadOptionModal={disableUploadOptionModal}
      />
    );
  }

  if (isListView && !isMobile) {
    return (
      <FileListView
        files={uploadedFiles}
        setSelectedFile={setSelectedFile}
        setVisibleFiles={setUploadedFiles}
        searchInput={searchInput}
      />
    );
  }

  return (
    <FileGridView
      files={uploadedFiles}
      setSelectedFile={setSelectedFile}
      setVisibleFiles={setUploadedFiles}
      searchInput={searchInput}
    />
  );
}

export default function AllFiles({ path }: { path: string | string[] | undefined }) {
  const [pendingFiles, setPendingFiles] = useState<FileEntryResponse[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<FileEntryResponse[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileEntryResponse>();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [fileEntryNames, setFileEntryNames] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { status, currentPublicKey } = useAuth();
  const walletContextState = useWallet();
  const { publicKey } = walletContextState;
  const { setNotification } = useNotification();
  const router = useRouter();
  const [isPrivateUpload, setIsPrivateUpload] = useState(false);
  const { isMobile } = useDevice();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const currentPath = useMemo(() => {
    if (typeof path === 'string') return [path];
    if (Array.isArray(path)) return path;
    return [];
  }, [path]);

  const folderId = useMemo(() => {
    return currentPath.length > 0 ? currentPath[currentPath.length - 1] : null;
  }, [currentPath]);

  const totalFiles = uploadedFiles.length;
  const { setTotalFiles, getSearchInput, getIsGridView, setIsGridView } = useGlobalState();
  const isListView = !getIsGridView();
  const searchInput = getSearchInput() || '';

  useEffect(() => {
    setTotalFiles(totalFiles);
  }, [totalFiles, setTotalFiles]);

  const [disableUploadOptionModal, setDisableUploadOptionModal] = useState(false); // New state to disable the modal

  const handleFileUploadClick = () => {
    setDisableUploadOptionModal(true);

    if (fileInputRef.current) {
      fileInputRef.current.click();
    }

    setTimeout(() => {
      setDisableUploadOptionModal(false); // Ensure the modal is shown for the next interaction
    }, 300);
  };

  const fetchFiles = useCallback(async () => {
    console.log('Fetching files for folder:', folderId);
    setIsLoading(true);
    try {
      const response = await apiClient.fileentry.getAll({ folderId });
      if (response.data.success) {
        console.log('Files fetched successfully');
        setUploadedFiles(response.data.data.items);
      } else {
        setNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to fetch files',
        });
      }
    } catch (err) {
      console.error('Error fetching files:', err);
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while fetching files',
      });
    } finally {
      setIsLoading(false);
    }
  }, [folderId, setNotification]);

  useEffect(() => {
    if (status === 'authenticated' && currentPublicKey) {
      fetchFiles();
    }
  }, [status, currentPublicKey, fetchFiles]);

  useEffect(() => {
    if (selectedFile && selectedFile?.type === 'folder') {
      if (selectedFile.folderId) {
        router.push(`/${[...currentPath, selectedFile.id].join('/')}`);
      } else {
        router.push(`/${selectedFile.id}`);
      }
    }
  }, [selectedFile, router, currentPath]);

  useEffect(() => {
    async function fetchFileEntryNames() {
      if (currentPath.length > 0) {
        try {
          const response = await apiClient.fileentry.getNames({ ids: currentPath.join(',') });
          if (response.data.success) {
            setFileEntryNames(response.data.data);
          }
        } catch (error) {
          console.error('Error fetching file entry names:', error);
        }
      }
    }

    fetchFileEntryNames();
  }, [currentPath]);

  const breadcrumbPath = useMemo(() => {
    return currentPath.map(id => ({ id, name: fileEntryNames[id] || id }));
  }, [currentPath, fileEntryNames]);

  const handleNewFolder = async () => {
    setShowCreateFolder(true);
  };

  const handleFileUpload = useCallback(
    async (newFiles: File[], isPrivate: boolean) => {
      // isPrivate = true;
      if (!walletContextState.wallet || !publicKey) {
        console.error('Wallet not available');
        return;
      }
      const pendingFileEntries: FileEntryResponse[] = newFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: 'file',
        ownerPK: publicKey.toBase58(),
        folderId: folderId || null,
        deleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        encryptionKey: null,
        metadata: null,
        size: file.size,
        mimeType: file.type,
        url: URL.createObjectURL(file),
        uploadedSize: 0,
        isPrivate,
        isPubliclyShared: false,
        publicShareId: null,
      }));

      setPendingFiles(pendingFileEntries);

      const uploadFile = async (file: File, index: number) => {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        const buffer = isPrivate
          ? await constructMultipartEncryptedBytes(publicKey, file)
          : new Uint8Array(await file.arrayBuffer());
        try {
          const uploadResponse = await webIrysUploadData(walletContextState, buffer, [
            { name: 'Content-Type', value: isPrivate ? 'application/octet-stream' : file.type },
            { name: 'Source', value: 'ChakraDrive' },
          ]);

          if (!uploadResponse) {
            throw new Error('Upload failed');
          }

          console.log('Irys file upload response', uploadResponse);

          const response = await apiClient.fileentry.create({
            name: file.name,
            type: 'file',
            size: file.size,
            mimeType: file.type,
            folderId: folderId || null,
            irysFileId: uploadResponse.id,
            isPrivate,
          });

          if (response.data.success) {
            setUploadedFiles(prevFiles => [...prevFiles, response.data.data]);
            setPendingFiles(prevPending =>
              prevPending.map(pf =>
                pf.id === pendingFileEntries[index].id && isFileType(pf)
                  ? { ...pf, uploadedSize: pf.size }
                  : pf
              )
            );
          } else {
            console.error('File entry creation failed');
            setNotification({
              type: 'error',
              title: 'Upload Error',
              message: `Failed to create file entry for ${file.name}`,
            });
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          setNotification({
            type: 'error',
            title: 'Upload Error',
            message: `Error uploading ${file.name}`,
          });
        }
      };

      await Promise.all(newFiles.map((file, index) => uploadFile(file, index)));

      setPendingFiles([]);
    },
    [walletContextState, publicKey, setNotification, folderId]
  );

  const handleUploadComplete = useCallback(() => {
    setPendingFiles([]);
    fetchFiles();
  }, [fetchFiles]);

  const handleFileInputChange = useCallback(
    (files: FileList) => {
      handleFileUpload(Array.from(files), isPrivateUpload);
    },
    [handleFileUpload, isPrivateUpload]
  );

  if (status === 'unauthenticated' || !currentPublicKey) {
    return (
      <DelayedComponent delay={500} className="w-full h-full">
        <div className="flex flex-col items-center justify-center h-full">
          <p className="mb-4 text-black">
            Please connect your wallet and authenticate to view your files.
          </p>
        </div>
      </DelayedComponent>
    );
  }

  if (status === 'authenticated' && isLoading) {
    return (
      <DelayedComponent
        delay={400}
        className="w-full h-full items-center justify-center mx-auto flex"
      >
        <Loader2 className="h-8 w-8 animate-spin" />
      </DelayedComponent>
    );
  }

  return (
    <>
      {showCreateFolder && (
        <CreateFolder
          onClose={() => {
            setShowCreateFolder(false);
            setIsAddOpen(false);
          }}
          setUploadedFiles={setUploadedFiles}
          currentPath={currentPath}
        />
      )}
      <div className="pt-4 w-full">
        <Breadcrumbs path={breadcrumbPath} />
      </div>
      <div className="pt-4 w-full h-full">
        {!isMobile && (
          <div className="flex flex-row justify-between py-4">
            <div className="flex flex-row gap-2">
              {env.NEXT_PUBLIC_ENABLE_PRIVATE_FILE_UPLOAD ? (
                <HoverUploadDropdown
                  handleFileUploadClick={handleFileUploadClick}
                  setIsPrivateUpload={setIsPrivateUpload}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    console.log('Upload file button clicked');
                    setIsPrivateUpload(false);
                    fileInputRef.current?.click();
                  }}
                  className="flex items-center justify-center px-4 py-2 bg-header-black text-white rounded-md hover:bg-[#1d3f2a] focus:outline-none focus:ring-2 focus:ring-header-green focus:ring-opacity-50 transition-colors"
                >
                  <FileUpIcon size={24} />
                  <span className="mx-2">Upload File</span>
                </button>
              )}

              <button type="button" onClick={handleNewFolder} className="btn-secondary">
                <FileUpIcon size={24} />
                <span className="ml-2">New Folder</span>
              </button>
            </div>
            {/* Because isListView and isGridView are opposites, you counter-intuitvely want to set it to current state of isListView */}
            <ViewToggle isListView={isListView} onViewChange={() => setIsGridView(isListView)} />
          </div>
        )}
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={e => {
            if (e.target.files) {
              handleFileInputChange(e.target.files);
            }
          }}
          className="hidden"
        />
        <RenderFileView
          uploadedFiles={uploadedFiles}
          handleFileUpload={handleFileUpload}
          isListView={isListView}
          setSelectedFile={setSelectedFile}
          setUploadedFiles={setUploadedFiles}
          searchInput={searchInput}
          disableUploadOptionModal={disableUploadOptionModal}
        />
        <UploadProgress pendingFiles={pendingFiles} onUploadComplete={handleUploadComplete} />
        <FileDialog
          file={selectedFile && selectedFile.type !== 'folder' ? selectedFile : undefined}
          onClose={() => setSelectedFile(undefined)}
          setVisibleFiles={setUploadedFiles}
          currentPath={currentPath}
        />
        {isMobile && (
          <div className="fixed bottom-4 right-4 text-black">
            {isAddOpen && (
              <Popup zIndex={50} alignItems="none" onClose={() => setIsAddOpen(false)}>
                <div className="absolute bottom-20 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-48">
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 rounded flex items-center space-x-2"
                    onClick={() => {
                      console.log('Upload file button clicked');
                      setIsPrivateUpload(false);
                      fileInputRef.current?.click();
                      setIsAddOpen(false);
                    }}
                  >
                    <Upload size={18} />
                    <span>Upload file</span>
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 rounded flex items-center space-x-2"
                    onClick={handleNewFolder}
                  >
                    <FolderPlus size={18} />
                    <span>Create folder</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="fixed bottom-4 right-4 bg-black text-white rounded-full p-3 shadow-[0_0px_10px_5px_rgba(22,163,74,0.05),0_0px_10px_5px_rgba(22,163,74,0.1)]"
                >
                  <Minus size={24} />
                </button>
              </Popup>
            )}
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="bg-black text-white rounded-full p-3 shadow-[0_0px_10px_5px_rgba(22,163,74,0.15),0_0px_10px_5px_rgba(22,163,74,0.3)]"
            >
              <Plus size={24} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
