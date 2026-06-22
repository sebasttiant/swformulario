import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output keeps the production Docker runner image small.
  output: "standalone",
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
