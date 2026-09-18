import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El empaquetado Docker se habilita explícitamente; el build local de Windows
  // no requiere permisos especiales para crear enlaces simbólicos.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  deploymentId: process.env.RELEASE_ID,
  assetPrefix: process.env.RELEASE_ID
    ? `/releases/${process.env.RELEASE_ID}`
    : undefined,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Aumenta el límite a 10 MB (ajusta según tus necesidades)
    },
  },
};

export default nextConfig;
