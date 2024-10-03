import { Card, CardContent } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';
import { useNotification } from '@/context/notification';
import { FileEntryResponse } from '@/types';
import { CheckCircle2, FileUp, Loader2 } from 'lucide-react';
import React from 'react';

interface UploadProgressProps {
  pendingFiles: FileEntryResponse[];
  onUploadComplete: () => void;
}

export function isFileType(
  file: FileEntryResponse
): file is FileEntryResponse & { type: 'file'; size: number } {
  return file.type === 'file' && 'size' in file;
}

function FileUploadProgress({ pendingFiles, onUploadComplete }: UploadProgressProps) {
  const { setNotification } = useNotification();

  React.useEffect(() => {
    const allFilesComplete = pendingFiles.every(
      file => !isFileType(file) || file.uploadedSize === file.size
    );

    if (pendingFiles.length > 0 && allFilesComplete) {
      setNotification({
        type: 'success',
        title: 'Upload Complete',
        message: `${pendingFiles.length} item${
          pendingFiles.length > 1 ? 's' : ''
        } processed successfully`,
      });
      onUploadComplete();
    }
  }, [pendingFiles, onUploadComplete, setNotification]);

  const renderFileStatus = (file: FileEntryResponse) => {
    if (!isFileType(file)) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }

    if (file.size === file.uploadedSize) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }

    return (
      <Loader2
        className={`h-4 w-4 text-green-500 ${file.uploadedSize! > 0 ? 'animate-spin' : ''}`}
      />
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-72 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <FileUp className="text-green-500" />
            <span className="font-semibold text-sm">Processing {pendingFiles.length} Items</span>
          </div>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {pendingFiles.map((file: FileEntryResponse) => (
              <div key={file.id} className="flex items-center gap-2">
                <div className="w-full">
                  <div className="text-sm text-gray-500 mb-1 font-semibold break-all">
                    {file.name}
                  </div>
                  {isFileType(file) ? (
                    <Progress value={(file.uploadedSize! / file.size) * 100} className="h-2" />
                  ) : (
                    <div className="text-xs text-gray-400">Folder</div>
                  )}
                </div>
                {renderFileStatus(file)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UploadProgress({ pendingFiles, onUploadComplete }: UploadProgressProps) {
  if (pendingFiles.length === 0) {
    return null;
  }

  return <FileUploadProgress pendingFiles={pendingFiles} onUploadComplete={onUploadComplete} />;
}
