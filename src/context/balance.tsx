import { createContext, useCallback, useContext, useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWebIrys } from '@/context/webIrys';
import { useWallet } from '@solana/wallet-adapter-react';
import BigNumber from 'bignumber.js';
import { FundResponse } from '@irys/sdk/common/types';
import { PublicKey } from '@solana/web3.js';

type BalanceContextType = {
  balanceUsdcRaw: BigNumber | undefined;
  freeBalanceUsedBytes: number;
  fundIrys: (usdcRawAmount: BigNumber) => Promise<FundResponse | null>;
  triggerRefetch: () => void;
  isLoading: boolean;
  error: string | null;
};

async function getFreeBalanceUsed(publicKey: PublicKey | null): Promise<number> {
  if (!publicKey) return 0;
  const balance = await fetch(
    `https://testnet-upload.irys.xyz/account/data-uploaded/usdc-solana/total?address=${publicKey.toBase58()}&application-name=chakra-drive`
  );
  const balanceJson = (await balance.json()) as { total: string };
  return Number(balanceJson.total);
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const { webIrys, isLoading: isWebIrysLoading, error: webIrysError } = useWebIrys();
  const { publicKey } = useWallet();
  const [fundTriggeredCounter, setFundTriggeredCounter] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { data: freeBalanceUsed } = useQuery({
    queryKey: ['free_balance_used', publicKey?.toBase58() || 'not_connected', fundTriggeredCounter],
    queryFn: () => getFreeBalanceUsed(publicKey),
    enabled: !!publicKey,
  });

  useEffect(() => {
    if (webIrysError) {
      setError(webIrysError);
    }
  }, [webIrysError]);

  const fundIrys = useCallback(
    async (usdcRawAmount: BigNumber): Promise<FundResponse | null> => {
      if (!webIrys) {
        setError('WebIrys is not initialized');
        return null;
      }
      try {
        const fundResponse = await webIrys.fund(usdcRawAmount);
        console.log('fundResponse', fundResponse);
        setFundTriggeredCounter(prev => prev + 1);
        return fundResponse;
      } catch (err) {
        console.error('Error funding Irys:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred while funding');
        return null;
      }
    },
    [webIrys]
  );

  const getBalance = useCallback(async () => {
    if (!webIrys) {
      setError('WebIrys is not initialized');
      return undefined;
    }
    try {
      const balance = await webIrys.getLoadedBalance();
      console.log('balance', balance.toString());
      return balance;
    } catch (err) {
      console.error('Error getting balance:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred while getting balance');
      return undefined;
    }
  }, [webIrys]);

  const { data: balanceUsdcRaw, isLoading: isBalanceLoading } = useQuery({
    queryKey: ['irys_balance', publicKey?.toBase58() || 'not_connected', fundTriggeredCounter],
    queryFn: getBalance,
    enabled: !!webIrys && !!publicKey,
  });

  const triggerRefetch = useCallback(() => {
    setFundTriggeredCounter(prev => prev + 1);
  }, []);

  const contextValue = useMemo(
    () => ({
      balanceUsdcRaw,
      freeBalanceUsedBytes: freeBalanceUsed || 0,
      fundIrys,
      triggerRefetch,
      isLoading: isWebIrysLoading || isBalanceLoading,
      error,
    }),
    [
      balanceUsdcRaw,
      freeBalanceUsed,
      fundIrys,
      triggerRefetch,
      isWebIrysLoading,
      isBalanceLoading,
      error,
    ]
  );

  return <BalanceContext.Provider value={contextValue}>{children}</BalanceContext.Provider>;
}

export const useBalance = () => {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
};
