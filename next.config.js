/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  // Static export - no API routes allowed
  // Force fresh build - Dec 17 2025
}

module.exports = nextConfig
