import Notification from '@/app/components/common/Notification';
import Popup from '@/app/components/common/Popup';
import apiClient from '@/lib/api-client';
import { storeSIWSMessage } from '@/lib/auth';
import { createSiwsInput } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { createSignInMessage } from '@solana/wallet-standard-util';
import { useWalletModal } from '@tiplink/wallet-adapter-react-ui';
import bs58 from 'bs58';
import { Loader2 } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AuthStatus = 'authenticated' | 'unauthenticated' | 'rejected';

type AuthContextType = {
  status: AuthStatus;
  error: string;
  loading: boolean;
  currentPublicKey: string | null;
  triggerAuth: () => Promise<void>;
  logout: () => void;
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
    checkAuthStatus().then(() => setLoading(false));
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
      {status === 'unauthenticated' && !isPublicFileRoute() && (
        <Popup zIndex={50} alignItems="center" onClose={() => null}>
          <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg">
            {!loading && status === 'unauthenticated' ? (
              <>
                <div className="text-2xl font-semibold text-[#142A1D]">
                  {!connectedButNotAuthenticated ? 'Connect Wallet' : 'Prove Ownership'}
                </div>
                <div className="text-sm text-gray-500 text-center">
                  {!connectedButNotAuthenticated
                    ? 'Select wallet to continue using Chakra Drive'
                    : 'You must prove you own the wallet to continue'}
                </div>
                <div className="flex flex-row gap-4">
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
                        triggerAuth();
                      }
                    }}
                    className="btn-tertiary font-semibold"
                  >
                    {!connectedButNotAuthenticated ? 'Connect' : 'Sign'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                <div className="text-sm text-gray-500">Loading...</div>
              </div>
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
