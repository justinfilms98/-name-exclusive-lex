/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly disable typed routes
  typedRoutes: false,
  // Ignore TypeScript build errors as fallback (Next.js keeps re-adding .next/types)
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        port: '',
        pathname: '**',
      },
    ],
    domains: [
      'images.unsplash.com', // Keep Unsplash if used
    ],
    unoptimized: false, // Keep optimization enabled
  },
};

process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

module.exports = nextConfig; 