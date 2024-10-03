import Popup from '@/app/components/common/Popup';
import { Button } from '@/app/components/ui/button';
import { Slider } from '@/app/components/ui/slider';
import { getSignerWebIrys } from '@/lib/web_irys';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

const HUNDRED_MB = 104857600;

function AddStorage({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [sliderValue, setSliderValue] = useState(0);
  const [isFunding, setIsFunding] = useState(false);
  const wallet = useWallet();

  const fetchPricePer100Mb = async () => {
    const response = await fetch(`https://uploader.irys.xyz/price/usdc-solana/${HUNDRED_MB}`);
    const pricePer100Mb = await response.json();
    return pricePer100Mb;
  };

  const { data: priceUsdcPer100Mb } = useQuery({
    queryKey: ['pricePer100Mb'],
    queryFn: fetchPricePer100Mb,
  });

  const storageMb = useMemo(() => {
    return sliderValue < 10 ? sliderValue * 100 : sliderValue * 102.4;
  }, [sliderValue]);

  const totalPriceUsdcRaw = useMemo(() => {
    if (!priceUsdcPer100Mb) return 0;
    return (storageMb / 100) * priceUsdcPer100Mb;
  }, [storageMb, priceUsdcPer100Mb]);

  const handleAddStorage = useCallback(async () => {
    if (wallet) {
      const signer = await getSignerWebIrys(wallet);
      if (signer) {
        const fundResponse = await signer.fund(Math.floor(totalPriceUsdcRaw));
        console.log(fundResponse);
      } else {
        console.error('Signer is null');
      }
    }
  }, [wallet, totalPriceUsdcRaw]);

  return (
    <Popup zIndex={50} alignItems="center" onClose={onClose}>
      <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg w-[90vw] sm:w-auto md:min-w-[400px]">
        <div className="text-2xl font-semibold text-[#142A1D]">Add Storage</div>
        <div className="flex w-full items-center gap-4">
          <Slider onValueChange={value => setSliderValue(value[0])} />
          <div className="text-sm text-secondary">
            {storageMb < 1024 ? `${storageMb} MB` : `${(storageMb / 1024).toFixed(2)} GB`}
          </div>
        </div>
        <div className="text-sm text-secondary">
          Total price: {(totalPriceUsdcRaw / 1e6).toFixed(2)} USDC
        </div>
        <Button
          onClick={async () => {
            setIsFunding(true);
            await handleAddStorage();
            setIsFunding(false);
            onConfirm();
            onClose();
          }}
          disabled={isFunding}
          className="!bg-green-500"
        >
          {isFunding ? (
            <div className="flex items-center gap-2 ">
              <div>Funding...</div>
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            'Confirm'
          )}
        </Button>
      </div>
    </Popup>
  );
}

export default AddStorage;
