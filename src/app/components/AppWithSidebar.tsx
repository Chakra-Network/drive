'use client';

import AddStorage from '@/app/components/AddStorage';
import SearchInput from '@/app/components/SearchInput';
import { WalletMultiButton } from '@/app/components/wallet_connect_button/WalletMultiButton';
import { GlobalStateProvider, useGlobalState } from '@/app/hooks/useGlobalState';
import { env } from '@/app/utils/env';
import { AuthProvider, useAuth } from '@/context/auth';
import { BalanceProvider, useBalance } from '@/context/balance';
import { useDevice } from '@/context/device';
import { NotificationProvider } from '@/context/notification';
import { PriceProvider, usePrice } from '@/context/price';
import { WebIrysProvider } from '@/context/webIrys';
import apiClient from '@/lib/api-client';
import { ONE_MB_IN_BYTES } from '@/lib/consts';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import '@solana/wallet-adapter-react-ui/styles.css';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { TipLinkWalletAdapter } from '@tiplink/wallet-adapter';
import { DefaultTipLinkWalletModalProvider } from '@tiplink/wallet-adapter-react-ui';
import bytes from 'bytes';
import { AlignJustify, Files, LucideIcon, Trash2 as Trash, Users, X } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface SidebarItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

const defaultIconProps = { size: 18, strokeWidth: 2.5 };
const FREE_STORAGE_LIMIT_BYTES = 10 * 1024 * 1024 * 1024; // 10GB in bytes

function Header({ title, fileCount = 0 }: { title: string; fileCount?: number }) {
  const { setSearchInput, getSearchInput } = useGlobalState();
  const searchInput = getSearchInput() || '';
  const { isMobile } = useDevice();
  console.log(fileCount);

  // const getFileCountText = (count: number): string => {
  //   if (count === 0) {
  //     return 'No items';
  //   }
  //   if (count === 1) {
  //     return '1 item';
  //   }
  //   return `${count} items`;
  // };

  return (
    <div className="flex justify-between items-center w-full gap-3">
      <div className="flex flex-col flex-shrink-0">
        {!isMobile && <h1 className="text-2xl font-semibold text-[#142A1D]">{title}</h1>}
        {/* <h2 className="text-lg text-gray-600">{getFileCountText(fileCount)}</h2> */}
      </div>
      <div
        className="ml-4 flex items-center gap-4"
        style={{
          marginLeft: isMobile ? '30px' : '0px',
        }}
      >
        <SearchInput onChange={setSearchInput} searchInput={searchInput} />
        {!isMobile && <WalletMultiButton className="flex-shrink-0" />}
        {isMobile && (
          <Image
            onClick={() => window.open('https://x.com/chakra_ai', '_blank')}
            src="/chakra_icon.png"
            alt="logo"
            width={45}
            height={45}
          />
        )}
      </div>
    </div>
  );
}

function SidebarLabel({
  label,
  icon: Icon,
  isActive,
  onClick,
}: SidebarItem & { isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`flex items-center justify-left hover:bg-[#63E7871A] select-none px-4 py-2 rounded-lg mb-4 cursor-pointer w-full ${
        isActive ? 'bg-[#63E7871A] font-semibold' : ''
      }`}
      onClick={onClick}
    >
      <div className="text-secondary">
        <Icon {...defaultIconProps} />
      </div>
      <p className="ml-2.5 text-md text-secondary">{label}</p>
    </button>
  );
}

function AppWithSidebar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [addStorageOpen, setAddStorageOpen] = useState(false);
  const { balanceUsdcRaw, freeBalanceUsedBytes, triggerRefetch } = useBalance();
  const { priceUsdcRawPerMb } = usePrice();
  const { currentPublicKey } = useAuth();
  const { isMobile } = useDevice();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pathname = usePathname();
  const { setSearchInput } = useGlobalState();

  useEffect(() => {
    setSearchInput('');
  }, [pathname, setSearchInput]);

  const { data: storageUsedBytes } = useQuery({
    queryKey: ['storageInfo', currentPublicKey],
    queryFn: async () => {
      const response = await apiClient.user.getStorage();
      return response.data.data.storageUsed;
    },
    enabled: !!currentPublicKey,
  });

  const totalStorageUsedBytes = useMemo(() => {
    return storageUsedBytes ? storageUsedBytes + freeBalanceUsedBytes : 0;
  }, [storageUsedBytes, freeBalanceUsedBytes]);

  const totalStorageAvailableBytes = useMemo(() => {
    if (!balanceUsdcRaw || !priceUsdcRawPerMb) return 0;
    return (
      balanceUsdcRaw.div(priceUsdcRawPerMb).multipliedBy(ONE_MB_IN_BYTES).toNumber() +
      totalStorageUsedBytes +
      (FREE_STORAGE_LIMIT_BYTES - freeBalanceUsedBytes)
    );
  }, [balanceUsdcRaw, priceUsdcRawPerMb, totalStorageUsedBytes, freeBalanceUsedBytes]);

  const sidebarItems: SidebarItem[] = useMemo(
    () => [
      {
        label: 'All Files',
        icon: Files,
        path: '/',
      },
      {
        label: 'Shared with me',
        icon: Users,
        path: '/shared-with-me',
      },
      {
        label: 'Trash',
        icon: Trash,
        path: '/trash',
      },
    ],
    []
  );

  const handleSidebarClick = useCallback(
    (index: number) => {
      setActiveIndex(index);
      console.log('TRIGGERING ROUTE CHANGE', sidebarItems[index].path);
      if (isMobile) {
        setSidebarOpen(false);
      }
      router.push(sidebarItems[index].path);
    },
    [router, sidebarItems, isMobile]
  );

  const handleUpgradePlan = () => {
    setAddStorageOpen(true);
  };

  useEffect(() => {
    const path = window.location.pathname;
    let index = 0;
    switch (path) {
      case '/shared-with-me':
        index = 1;
        break;
      case '/trash':
        index = 2;
        break;
      default:
        index = 0;
    }
    setActiveIndex(index);
  }, []);

  const { getTotalFiles } = useGlobalState();
  const totalFiles = getTotalFiles();

  if (isMobile) {
    return (
      <div className="flex min-h-screen h-full w-full overflow-x-scroll relative">
        {!sidebarOpen && (
          <AlignJustify
            className="absolute top-4 left-1 m-2 text-black"
            width={28}
            height={28}
            onClick={() => setSidebarOpen(true)}
          />
        )}
        <div className="bg-white">
          <div
            className="flex flex-col w-[100vw] h-[100vh] fixed inset-0 z-[10] bg-[#F6F6F6] rounded-r-3xl pt-4"
            style={{
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.2s ease-in-out',
            }}
          >
            <div className="flex justify-between items-center w-full px-4 py-2">
              <X
                className="text-black cursor-pointer"
                width={28}
                height={28}
                onClick={() => setSidebarOpen(false)}
              />
              <WalletMultiButton
                className="!bg-transparent !border-green-600 !border-opacity-20 !px-2"
                style={{
                  display: sidebarOpen ? '' : 'none',
                }}
              />
            </div>

            {sidebarItems.map((item, index) => (
              <SidebarLabel
                key={item.path}
                {...item}
                isActive={index === activeIndex}
                onClick={() => handleSidebarClick(index)}
              />
            ))}
            {totalStorageAvailableBytes > 0 && (
              <div className="flex flex-col w-full px-4 py-2">
                <div className="flex flex-row justify-between text-secondary rounded-lg mb-1 gap-1 text-sm font-semibold">
                  <div className="flex flex-row gap-2 items-center whitespace-nowrap">
                    <span>Storage Used</span>
                  </div>
                  <span>
                    {((totalStorageUsedBytes / totalStorageAvailableBytes) * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex h-4 rounded-full bg-[#707D751A] justify-self-center mb-2">
                  <div
                    className="h-full bg-green-500 transition-all duration-300 ease-in-out rounded-full"
                    style={{
                      width: `${Math.max(
                        (totalStorageUsedBytes / totalStorageAvailableBytes) * 100,
                        10
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex flex-row justify-between mb-1 text-xs text-secondary">
                  <span>{bytes(totalStorageUsedBytes)}</span>
                  <span>{bytes(totalStorageAvailableBytes)}</span>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleUpgradePlan}
              className="btn-primary mx-4 font-semibold !bg-green-500"
            >
              <span className="w-full text-center">Add Storage</span>
            </button>
          </div>
        </div>
        <div className="flex flex-col p-4 w-full bg-white">
          <Header title={sidebarItems[activeIndex].label} fileCount={totalFiles} />
          {children}
        </div>
        {addStorageOpen && (
          <AddStorage onClose={() => setAddStorageOpen(false)} onConfirm={() => triggerRefetch()} />
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen h-full w-full">
      <div className="bg-white">
        <div className="flex flex-col w-[250px] h-full bg-[#142A1D0A] px-4 rounded-r-3xl">
          <a
            className="flex items-center justify-center py-4 gap-4"
            href="https://x.com/chakra_ai"
            target="_blank"
            rel="noreferrer"
          >
            <Image src="/chakra_word_logo.svg" alt="logo" width={450} height={450} />
          </a>
          {sidebarItems.map((item, index) => (
            <SidebarLabel
              key={item.path}
              {...item}
              isActive={index === activeIndex}
              onClick={() => handleSidebarClick(index)}
            />
          ))}
          {totalStorageAvailableBytes > 0 && (
            <div className="flex flex-col w-full px-4 py-2">
              <div className="flex flex-row justify-between text-secondary rounded-lg mb-1 gap-1 text-sm font-semibold">
                <div className="flex flex-row gap-2 items-center whitespace-nowrap">
                  <span>Storage Used</span>
                </div>
                <span>
                  {((totalStorageUsedBytes / totalStorageAvailableBytes) * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex h-4 rounded-full bg-[#707D751A] justify-self-center mb-2">
                <div
                  className="h-full bg-green-500 transition-all duration-300 ease-in-out rounded-full"
                  style={{
                    width: `${Math.max(
                      (totalStorageUsedBytes / totalStorageAvailableBytes) * 100,
                      10
                    )}%`,
                  }}
                />
              </div>
              <div className="flex flex-row justify-between mb-1 text-xs text-secondary">
                <span>{bytes(totalStorageUsedBytes)}</span>
                <span>{bytes(totalStorageAvailableBytes)}</span>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleUpgradePlan}
            className="btn-primary mx-4 font-semibold !bg-green-500"
          >
            <span className="w-full text-center">Add Storage</span>
          </button>
        </div>
      </div>
      <div className="flex flex-col p-4 w-full bg-white">
        <Header title={sidebarItems[activeIndex].label} fileCount={totalFiles} />
        {children}
      </div>
      {addStorageOpen && (
        <AddStorage onClose={() => setAddStorageOpen(false)} onConfirm={() => triggerRefetch()} />
      )}
    </div>
  );
}

const queryClient = new QueryClient();

export default function AppWithSidebarAndWallet({ children }: { children: React.ReactNode }) {
  const tipLinkWalletAdapter = useMemo(
    () =>
      new TipLinkWalletAdapter({
        theme: 'light',
        title: 'Chakra Drive',
        clientId: '126f4290-c08a-40c1-b58b-def30f499145',
        hideWalletOnboard: true,
      }),
    []
  );
  return (
    <ConnectionProvider endpoint={env.NEXT_PUBLIC_RPC_URL}>
      <WalletProvider wallets={[tipLinkWalletAdapter]} autoConnect>
        <DefaultTipLinkWalletModalProvider>
          <AuthProvider>
            <NotificationProvider>
              <QueryClientProvider client={queryClient}>
                <WebIrysProvider>
                  <BalanceProvider>
                    <PriceProvider>
                      <GlobalStateProvider>
                        <AppWithSidebar>{children}</AppWithSidebar>
                      </GlobalStateProvider>
                    </PriceProvider>
                  </BalanceProvider>
                </WebIrysProvider>
              </QueryClientProvider>
            </NotificationProvider>
          </AuthProvider>
        </DefaultTipLinkWalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
