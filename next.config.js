/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,           // Check for file changes every 1s
      aggregateTimeout: 300 // Delay before rebuilding
    }
    return config
  },
}

module.exports = nextConfig
