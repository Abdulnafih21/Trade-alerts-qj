/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow all hosts for Replit environment
  async rewrites() {
    return []
  },
  // Configure for development with proxy
  assetPrefix: undefined,
  experimental: {
    allowedHosts: true,
  },
}

export default nextConfig
