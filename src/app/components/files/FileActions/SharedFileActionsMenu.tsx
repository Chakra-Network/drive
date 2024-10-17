import { handleDownloadClicked } from '@/app/components/files/FileActions/AllFileActionsMenu';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { useNotification } from '@/context/notification';
import { FileEntryResponse } from '@/types';
import { useWallet } from '@solana/wallet-adapter-react';
import { Download, EllipsisVertical } from 'lucide-react';

export default function SharedFileActionsMenu({ file }: { file: FileEntryResponse }) {
  const { setNotification } = useNotification();
  const { signMessage } = useWallet();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <EllipsisVertical className="h-5 w-6 text-[#707D75]" />
          <span className="sr-only">Open file actions menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {signMessage && (
          <DropdownMenuItem
            onClick={() => handleDownloadClicked(file, setNotification, null, signMessage)}
            className="cursor-pointer"
          >
            <Download className="mr-2 h-4 w-4" />
            <span>Download</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
