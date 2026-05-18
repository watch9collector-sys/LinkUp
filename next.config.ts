import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.11"],
  async redirects() {
    return [
      { source: "/discover", destination: "/explore", permanent: true },
      { source: "/discover/:path*", destination: "/explore", permanent: true },
      { source: "/shoutouts", destination: "/linkups", permanent: true },
      { source: "/shoutouts/:path*", destination: "/linkups", permanent: true },
      { source: "/safety", destination: "/child-safety", permanent: true },
    ];
  },
};

export default nextConfig;
