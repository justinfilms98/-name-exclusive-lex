/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '**',
      },
      // Add more remotePatterns if needed
    ],
    domains: [
      'qqfafeqqtozfnrpusszo.supabase.co', // Correct Supabase project ref
      'images.unsplash.com', // Keep Unsplash if used
    ],
  },
};

module.exports = nextConfig; 