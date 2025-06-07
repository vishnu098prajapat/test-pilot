
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
    ],
  },
  experimental: {
    allowedOrigins: ['https://6000-firebase-studio-1749184145527.cluster-zumahodzirciuujpqvsniawo3o.cloudworkstations.dev'],
  },
};

export default nextConfig;
