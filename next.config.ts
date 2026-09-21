import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* MEMEOS keeps the default Next.js config; remote token logos are
     intentionally proxied as plain <img> to avoid next/image host config churn. */
  images: { unoptimized: true },
};

export default nextConfig;
