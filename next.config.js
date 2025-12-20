/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  // API routes enabled - Dec 20 2025
  // Removed output: "export" to enable serverless functions
}

module.exports = nextConfig
