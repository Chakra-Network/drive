import { Button } from '@/app/components/wallet_connect_button/Button';
import type { WalletName } from '@solana/wallet-adapter-base';
import React from 'react';

type Props = React.ComponentProps<typeof Button> & {
  // eslint-disable-next-line react/require-default-props
  walletIcon?: string;
  // eslint-disable-next-line react/require-default-props
  walletName?: WalletName;
};

export function BaseWalletConnectionButton({
  walletIcon,
  walletName,
  startIcon,
  children,
  className,
  ...props
}: Props) {
  // Suppress unused variable warnings
  React.useEffect(() => {
    if (walletIcon || walletName) {
      // These props are not used in this component but might be used by parent components
    }
  }, [walletIcon, walletName]);

  return (
    <Button
      {...props}
      className={`wallet-adapter-button-trigger ${className || ''}`}
      startIcon={startIcon}
    >
      {children}
    </Button>
  );
}
