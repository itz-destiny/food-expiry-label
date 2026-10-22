import type {NextConfig} from 'next';

// Pin the project root: a stray lockfile in a parent folder otherwise makes
// Next treat that folder as the root and watch far too many files.
const projectRoot = __dirname;

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
