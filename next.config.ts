import type { NextConfig } from "next";
import os from "node:os";

// Automatische Erkennung aller lokalen IPv4-Netzwerkadressen für LAN-Zugriff (z.B. Handy, Tablet, Werkstatt)
const localIps: string[] = [];
try {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (ifaceList) {
      for (const net of ifaceList) {
        if (net.family === "IPv4" && !net.internal) {
          localIps.push(net.address);
        }
      }
    }
  }
} catch {
  // Fallback
}

const allowedOriginsList = [
  ...localIps,
  ...localIps.map((ip) => `${ip}:3000`),
  "192.168.178.97",
  "192.168.178.97:3000",
  "192.168.178.*",
  "192.168.*.*",
  "localhost",
  "localhost:3000",
  "127.0.0.1",
  "127.0.0.1:3000",
  "*.local",
];

const nextConfig: NextConfig = {
  // Erlaubt Cross-Origin / LAN-Verbindungen im Entwicklungsmodus (behebt HMR WebSocket-Fehler bei IP-Zugriff)
  allowedDevOrigins: allowedOriginsList,

  // Erlaubt Server Actions über LAN-IPs (verhindert CSRF-Blockaden bei Button-Klicks)
  experimental: {
    serverActions: {
      allowedOrigins: allowedOriginsList,
    },
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
