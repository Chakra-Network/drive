import '@/app/globals.css';
import type { Metadata } from 'next';
import PlausibleProvider from 'next-plausible';
import { Sora } from 'next/font/google';
import localFont from 'next/font/local';
import ClientLayout from '@/app/components/ClientLayout';
import { NotificationProvider } from '@/context/notification';
import { DeviceProvider } from '@/context/device';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Chakra Drive',
  description: 'Powered by Irys',
};

const sora = Sora({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Chakra Drive</title>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex ${sora.className}`}
      >
        <PlausibleProvider domain="drive.chakra.network">
          <NotificationProvider>
            <DeviceProvider>
              <ClientLayout>{children}</ClientLayout>
            </DeviceProvider>
          </NotificationProvider>
        </PlausibleProvider>
      </body>
    </html>
  );
}
