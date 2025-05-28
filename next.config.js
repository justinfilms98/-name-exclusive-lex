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
    ],
    domains: [
      'qqafafeqqtozfnrpuszso.supabase.co',
      // add other domains if needed
    ],
  },
};

module.exports = nextConfig; 