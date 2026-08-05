import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@prisma/client", "prisma"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@prisma/client": false,
        "@/database/prisma.service": false,
        "@/database/repositories/prisma-data-store.loader": false,
      };
    }
    return config;
  },
};

export default nextConfig;
