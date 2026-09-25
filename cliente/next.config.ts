import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Fija la raíz de Turbopack a cliente/ para que ignore el
    // package-lock.json suelto en C:\Users\MSI (fuera del repo).
    root: __dirname,
  },
};

export default nextConfig;
