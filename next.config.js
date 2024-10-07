/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: config => {
    config.module.rules.push({
      test: /litActionSiws\.js$/,
      use: {
        loader: 'raw-loader',
        options: {
          esModule: false,
        },
      },
    });
    return config;
  },
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gateway.irys.xyz',
      },
      {
        protocol: 'https',
        hostname: 'drive.chakra.network',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/irys/:path*',
        destination: 'https://gateway.irys.xyz/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/share/:publicShareId',
        headers: [
          {
            key: 'User-Agent',
            value: '(.*Twitterbot.*)',
          },
        ],
      },
      // Add security headers
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  // Ensure static files are served correctly
  publicRuntimeConfig: {
    staticFolder: '/public',
  },
};

module.exports = nextConfig;
