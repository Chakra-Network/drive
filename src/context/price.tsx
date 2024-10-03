import { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ONE_MB_IN_BYTES } from '@/lib/consts';

type PriceContextType = {
  priceUsdcRawPerMb: number | null;
};

const PriceContext = createContext<PriceContextType | undefined>(undefined);

async function fetchPriceUsdcRawPerMb() {
  const response = await fetch(`https://uploader.irys.xyz/price/usdc-solana/${ONE_MB_IN_BYTES}`);
  const pricePer100Mb = await response.json();
  return pricePer100Mb;
}

export function PriceProvider({ children }: { children: React.ReactNode }) {
  const { data: priceUsdcRawPerMb } = useQuery({
    queryKey: ['priceUsdcRawPerMb'],
    queryFn: fetchPriceUsdcRawPerMb,
  });

  const contextValue = useMemo(
    () => ({ priceUsdcRawPerMb: priceUsdcRawPerMb ?? null }),
    [priceUsdcRawPerMb]
  );

  return <PriceContext.Provider value={contextValue}>{children}</PriceContext.Provider>;
}

export const usePrice = () => {
  const context = useContext(PriceContext);
  if (context === undefined) {
    throw new Error('usePrice must be used within a PriceProvider');
  }
  return context;
};
