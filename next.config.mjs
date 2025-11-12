/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // nie blokuj builda, nawet jeśli są błędy ESLint
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
