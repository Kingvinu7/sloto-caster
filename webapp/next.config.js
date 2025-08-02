/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  env: {
    CONTRACT_ADDRESS: '0x8e04a35502aa7915b2834774Eb33d9e3e4cE29c7',
    BASE_SEPOLIA_CHAIN_ID: '84532',
  }
};

module.exports = nextConfig;
