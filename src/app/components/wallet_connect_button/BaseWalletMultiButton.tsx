import { ButtonProps } from '@/app/components/ui/button';
import { BaseWalletConnectionButton } from '@/app/components/wallet_connect_button/BaseWalletConnectionButton';
import { useDevice } from '@/context/device';
import { publicKeyToEmoji } from '@/lib/emoji';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useWalletModal } from '@tiplink/wallet-adapter-react-ui';
import React, { useEffect, useMemo, useRef, useState } from 'react';

type Props = Omit<ButtonProps, 'onClick'> & {
  labels: {
    connecting: string;
    'has-wallet': string;
    'no-wallet': string;
    'copy-address': string;
    copied: string;
    'change-wallet': string;
    disconnect: string;
  };
};

function publicKeyToPastelColor(publicKey: string | PublicKey): string {
  let key: string;

  if (typeof publicKey === 'string') {
    key = publicKey;
  } else if (publicKey instanceof PublicKey) {
    key = publicKey.toBase58();
  } else {
    throw new Error('Invalid public key format');
  }

  const seed = key.slice(0, 12);

  let seedNumber = 0;
  for (let i = 0; i < seed.length; i += 1) {
    seedNumber += seed.charCodeAt(i);
  }

  const r = 155 + (seedNumber % 100);
  const g = 155 + ((seedNumber * 3) % 100);
  const b = 155 + ((seedNumber * 7) % 100);

  const toHex = (value: number) => {
    const hex = value.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function BaseWalletMultiButton({ children, labels, ...props }: Props) {
  const { isMobile } = useDevice();

  const { setVisible: setModalVisible } = useWalletModal();
  const { publicKey, wallet, disconnect, connecting, connected } = useWallet();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const node = ref.current;
      if (!node || node.contains(event.target as Node)) return;
      setMenuOpen(false);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, []);

  const contentBig = useMemo(() => {
    if (children) return children;
    if (connected && publicKey) {
      const base58 = publicKey.toBase58();
      return `${base58.slice(0, 4)}..${base58.slice(-4)}`;
    }
    if (connecting) return labels.connecting;
    if (wallet) return labels['has-wallet'];
    return labels['no-wallet'];
  }, [children, connecting, connected, publicKey, wallet, labels]);

  // if content is a string, it will be used as the button text
  const content = useMemo(() => {
    if (typeof contentBig === 'string' && isMobile) {
      return contentBig.length > 6 ? `${contentBig.slice(0, 6)}` : contentBig;
    }
    return contentBig;
  }, [contentBig, isMobile]);

  const handleClick = () => {
    if (connected) {
      setMenuOpen(!menuOpen);
    } else if (wallet) {
      wallet.adapter.connect().catch(() => {});
    } else {
      setModalVisible(true);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="wallet-adapter-dropdown" ref={ref}>
      <div
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={menuOpen}
      >
        <BaseWalletConnectionButton
          {...props}
          style={{ pointerEvents: menuOpen ? 'none' : 'auto', ...props.style }}
          startIcon={
            connected && publicKey ? (
              <div
                className="rounded-full p-4 relative border-2 border-[#E5E5E5]"
                style={{ backgroundColor: publicKeyToPastelColor(publicKey) }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {publicKeyToEmoji(publicKey)}
                </div>
              </div>
            ) : undefined
          }
        >
          {content}
        </BaseWalletConnectionButton>
      </div>
      {menuOpen && (
        <ul
          aria-label="dropdown-list"
          className="wallet-adapter-dropdown-list wallet-adapter-dropdown-list-active"
          role="menu"
        >
          {publicKey && (
            <li
              className="wallet-adapter-dropdown-list-item"
              onClick={async () => {
                await navigator.clipboard.writeText(publicKey.toBase58());
                setCopied(true);
                setTimeout(() => setCopied(false), 400);
              }}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.currentTarget.click();
                }
              }}
              role="menuitem"
              tabIndex={0}
            >
              {copied ? labels.copied : labels['copy-address']}
            </li>
          )}
          <li
            className="wallet-adapter-dropdown-list-item"
            onClick={() => {
              setModalVisible(true);
              setMenuOpen(false);
            }}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.currentTarget.click();
              }
            }}
            role="menuitem"
            tabIndex={0}
          >
            {labels['change-wallet']}
          </li>
          {connected && (
            <li
              className="wallet-adapter-dropdown-list-item"
              onClick={() => {
                disconnect().catch(() => {});
                setMenuOpen(false);
              }}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.currentTarget.click();
                }
              }}
              role="menuitem"
              tabIndex={0}
            >
              {labels.disconnect}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
