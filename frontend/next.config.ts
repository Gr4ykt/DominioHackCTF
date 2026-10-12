import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // En desarrollo, Next bloquea las peticiones cross-origin a los assets del
  // dev server. Para probar desde otra máquina/VM por la IP de red, hay que
  // listar ese host aquí (solo afecta a `next dev`). Agrega las IPs que uses.
  allowedDevOrigins: ["192.168.1.8"],
}

export default nextConfig
