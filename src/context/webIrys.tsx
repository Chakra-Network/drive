import { getSignerWebIrys, WebIrysUploader } from '@/lib/web_irys';
import { useWallet } from '@solana/wallet-adapter-react';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';

export type WebIrysContextType = {
  webIrys: WebIrysUploader | null;
  isLoading: boolean;
  error: string | null;
};

const WebIrysContext = createContext<WebIrysContextType | undefined>(undefined);

export function WebIrysProvider({ children }: { children: React.ReactNode }) {
  const wallet = useWallet();
  const [webIrys, setWebIrys] = useState<WebIrysUploader | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeWebIrys() {
      if (wallet.connected && wallet.publicKey) {
        setIsLoading(true);
        setError(null);
        try {
          const irys = await getSignerWebIrys(wallet);
          if (irys) {
            setWebIrys(irys);
          } else {
            throw new Error('Failed to initialize WebIrys');
          }
        } catch (err) {
          console.error('Error initializing WebIrys:', err);
          setError(err instanceof Error ? err.message : 'Unknown error occurred');
          setWebIrys(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setWebIrys(null);
        setError(null);
      }
    }

    initializeWebIrys();
  }, [wallet]);

  const contextValue = useMemo<WebIrysContextType>(
    () => ({
      webIrys,
      isLoading,
      error,
    }),
    [webIrys, isLoading, error]
  );

  return <WebIrysContext.Provider value={contextValue}>{children}</WebIrysContext.Provider>;
}

export const useWebIrys = () => {
  const context = useContext(WebIrysContext);
  if (context === undefined) {
    throw new Error('useWebIrys must be used within a WebIrysProvider');
  }
  return context;
};
