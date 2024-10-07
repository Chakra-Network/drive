import Notification from '@/app/components/common/Notification';
import Popup from '@/app/components/common/Popup';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import apiClient from '@/lib/api-client';
import { storeSIWSMessage } from '@/lib/auth';
import { createSiwsInput } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { createSignInMessage } from '@solana/wallet-standard-util';
import { useWalletModal } from '@tiplink/wallet-adapter-react-ui';
import bs58 from 'bs58';
import { Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AuthStatus = 'authenticated' | 'unauthenticated' | 'rejected';

type AuthContextType = {
  status: AuthStatus;
  error: string;
  loading: boolean;
  currentPublicKey: string | null;
  triggerAuth: () => Promise<void>;
  logout: () => void;
};

const TermsAndConditions = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <span className="text-blue-500 cursor-pointer hover:underline text-black">
          Terms and Conditions
        </span>
      </DialogTrigger>
      <DialogContent className="flex flex-col p-0 text-black">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg font-semibold">Terms and Conditions</DialogTitle>
          <p className="text-xs text-gray-500">
            Please read these terms carefully before using Chakra Drive.
          </p>
        </DialogHeader>
        <ScrollArea className="flex-grow px-4 pb-4">
          <div className="space-y-2 text-xs">
            <p>
              Welcome to Chakra Drive, a service that allows direct file uploads to the Irys data
              chain. By using our service, you agree to the following terms:
            </p>

            <h3 className="font-bold">1. Data Permanence</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                Once uploaded, storage cannot be reclaimed. Files will remain on the Irys chain
                indefinitely.
              </li>
              <li>
                For public uploads, files will be accessible forever, even if &ldquo;deleted&rdquo;
                from your Chakra Drive interface.
              </li>
              <li>
                When a public file is &ldquo;deleted,&rdquo; it will still exist on the Irys chain.
                The file space will continue to be shown in your storage indicator.
              </li>
            </ul>

            <h3 className="font-bold">2. Privacy and Sharing</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Private uploads cannot be shared.</li>
              <li>
                Public uploads will be permanently accessible, even after deletion from your Chakra
                Drive interface.
              </li>
            </ul>

            <h3 className="font-bold">3. Content Responsibility</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                Chakra Labs Inc is not responsible for content posted on Chakra Drive. All data is
                posted directly to the Irys chain.
              </li>
              <li>
                Any content{' '}
                <a
                  href="https://hackmd.io/@mBbfLZ3iSX6d_bN-u5OBpw/rkwLsBWJJe"
                  target="_blank"
                  style={{ textDecoration: 'underline', textDecorationColor: 'currentColor' }}
                  // eslint-disable-next-line
                  onMouseEnter={(e: any) => (e.target.style.textDecoration = 'none')}
                  // eslint-disable-next-line
                  onMouseLeave={(e: any) => (e.target.style.textDecoration = 'underline')}
                >
                  takedown requests
                </a>{' '}
                should be directed to the Irys team.
              </li>
            </ul>

            <h3 className="font-bold">4. Service Level Agreement and Liability</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                Chakra Drive makes no guarantees regarding service level agreements (SLAs) and
                cannot be held liable for any outages or otherwise.
              </li>
              <li>
                By signing the authentication message, you agree that you will not hold Chakra Labs
                Inc, its affiliates, officers, directors, employees, or agents liable for any
                direct, indirect, incidental, special, consequential or exemplary damages, including
                but not limited to, damages for loss of profits, goodwill, use, data or other
                intangible losses resulting from the use of or inability to use the service.
              </li>
            </ul>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('unauthenticated');
  const [authError, setAuthError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPublicKey, setCurrentPublicKey] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const { publicKey, signMessage, connected, disconnect, signIn } = useWallet();
  const { setVisible } = useWalletModal();
  const pathname = usePathname();

  const isPublicFileRoute = useCallback(() => {
    return /^\/[A-Za-z0-9]{10}$/.test(pathname);
  }, [pathname]);

  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    const storedPublicKey = localStorage.getItem('publicKey');

    if (token && storedPublicKey && publicKey && storedPublicKey === publicKey.toBase58()) {
      try {
        const response = await apiClient.user.verify();
        if (response.data.success) {
          setStatus('authenticated');
          setCurrentPublicKey(storedPublicKey);
          return true;
        }
      } catch (err) {
        console.error('Token verification failed:', err);
      }
    }

    setStatus('unauthenticated');
    setCurrentPublicKey(null);
    return false;
  }, [publicKey]);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('publicKey');
    setStatus('unauthenticated');
    setCurrentPublicKey(null);
    disconnect();
  }, [disconnect]);

  const triggerAuth = useCallback(async () => {
    if (isAuthenticating) return;
    if (!publicKey || (!signMessage && !signIn)) {
      setVisible(true);
      return;
    }

    setIsAuthenticating(true);
    setLoading(true);

    try {
      const isAuthenticated = await checkAuthStatus();
      if (isAuthenticated) {
        console.log('Already authenticated, skipping signature request');
        setLoading(false);
        setIsAuthenticating(false);
        return;
      }

      const message = `Authenticate with Chakra Drive: ${Date.now()}`;
      console.log('Requesting signature');
      const siwsInput = createSiwsInput(publicKey.toBase58(), message);
      const signInMessage = createSignInMessage(siwsInput);
      const signature = signMessage ? await signMessage(signInMessage) : null;

      if (!signature) {
        setAuthError('Failed to authenticate, no signature found');
        return;
      }

      const bs58Signature = bs58.encode(signature);

      storeSIWSMessage({
        b58SignInMessage: bs58.encode(signInMessage),
        b58Signature: bs58Signature,
      });

      console.log('Sending authentication request to server');
      const response = await apiClient.user.login({
        publicKey: publicKey.toBase58(),
        signature: bs58Signature,
        message: bs58.encode(signInMessage),
      });

      if (response.data.success) {
        localStorage.setItem('authToken', response.data.data.token);
        localStorage.setItem('publicKey', publicKey.toBase58());
        setStatus('authenticated');
        setCurrentPublicKey(publicKey.toBase58());
        console.log('Authentication successful for public key:', publicKey.toBase58());
      } else {
        setAuthError('Failed to authenticate, unsuccessful response from server');
      }
    } catch (err) {
      setAuthError(`Failed to authenticate: ${err}`);
    } finally {
      setLoading(false);
      setIsAuthenticating(false);
    }
  }, [publicKey, signMessage, signIn, setVisible, checkAuthStatus, isAuthenticating]);

  const handleWalletChange = useCallback(() => {
    if (publicKey && currentPublicKey && publicKey.toBase58() !== currentPublicKey) {
      console.log('Wallet changed, logging out');
      logout();
      triggerAuth();
    }
  }, [publicKey, currentPublicKey, logout, triggerAuth]);

  useEffect(() => {
    checkAuthStatus().then(async () => {
      await new Promise(resolve => {
        setTimeout(resolve, 200);
      });
      setLoading(false);
    });
  }, [checkAuthStatus]);

  useEffect(() => {
    if (connected && publicKey) {
      handleWalletChange();
    }
  }, [connected, publicKey, handleWalletChange]);

  const contextValue = useMemo(
    () => ({
      status,
      error: authError,
      loading,
      currentPublicKey,
      triggerAuth,
      logout,
    }),
    [status, authError, loading, currentPublicKey, triggerAuth, logout]
  );

  const connectedButNotAuthenticated = connected && status === 'unauthenticated';

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      {((status === 'unauthenticated' && !isPublicFileRoute()) || loading) && (
        <Popup zIndex={50} alignItems="center" onClose={() => null}>
          <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                <div className="text-sm text-gray-500">Loading...</div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-semibold text-[#142A1D]">
                  {!connectedButNotAuthenticated ? 'Connect Wallet' : 'Prove Ownership'}
                </div>
                <div className="text-sm text-gray-500 text-center">
                  {!connectedButNotAuthenticated
                    ? 'Select wallet to continue using Chakra Drive'
                    : 'You must prove you own the wallet to continue'}
                </div>
                {connectedButNotAuthenticated && (
                  <div className="text-sm text-gray-700 text-center">
                    By signing, you acknowledge and accept the <TermsAndConditions />.
                  </div>
                )}
                <div className="flex flex-row gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setStatus('rejected')}
                    className="btn-secondary font-thin"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!publicKey) {
                        setVisible(true);
                      } else {
                        setLoading(true);
                        triggerAuth();
                      }
                    }}
                    className="btn-tertiary font-semibold"
                  >
                    {!connectedButNotAuthenticated ? 'Connect' : 'Sign'}
                  </button>
                </div>
              </>
            )}
          </div>
        </Popup>
      )}
      {authError && (
        <Notification
          type="error"
          title="Authentication Error"
          message={authError}
          onClose={() => setAuthError('')}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
