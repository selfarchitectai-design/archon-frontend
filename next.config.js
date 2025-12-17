/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/n8n/:path*',
        destination: 'https://n8n.selfarchitectai.com/webhook/:path*',
      },
    ];
  },
}

module.exports = nextConfig
