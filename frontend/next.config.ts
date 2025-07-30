import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  compiler: {
    removeConsole:
      process.env.NEXT_PUBLIC_VERCEL_ENV !== 'preview' &&
      process.env.NODE_ENV === 'production',
  },
}

export default nextConfig
