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
      'images.unsplash.com', // Keep Unsplash if used
    ],
  },
};

process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

module.exports = nextConfig; 