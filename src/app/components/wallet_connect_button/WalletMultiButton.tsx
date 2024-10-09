import { BaseWalletMultiButton } from '@/app/components/wallet_connect_button/BaseWalletMultiButton';
import { ButtonProps } from '@/app/components/wallet_connect_button/Button';

const LABELS = {
  'change-wallet': 'Change wallet',
  connecting: 'Connecting ...',
  'copy-address': 'Copy address',
  copied: 'Copied',
  disconnect: 'Disconnect',
  'has-wallet': 'Connect',
  'no-wallet': 'Select Wallet',
} as const;

export function WalletMultiButton(props: ButtonProps) {
  return <BaseWalletMultiButton {...props} labels={LABELS} />;
}
