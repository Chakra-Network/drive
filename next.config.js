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
};

module.exports = nextConfig;
