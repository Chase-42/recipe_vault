/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [{ hostname: "utfs.io" }, { hostname: "ucarecdn.com" }],
  },
  typescript: {
    // Enable strict type checking during builds
    ignoreBuildErrors: false,
  },
  eslint: {
    // Skip linting during builds
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; img-src 'self' data: https://ucarecdn.com https://utfs.io; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.dev; style-src 'self' 'unsafe-inline'; connect-src 'self' https://clerk.dev https://api.clerk.dev; frame-src https://clerk.dev;",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/scraper/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:5328/api/scraper/:path*"
            : "/api/scraper/:path*",
      },
      {
        source: "/api/:path*",
        destination: "/api/:path*",
      },
    ];
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
      "@radix-ui/react-slot",
      "@radix-ui/react-tooltip",
      "lucide-react",
      "@tabler/icons-react",
      "framer-motion",
    ],
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:5328"],
    },
  },
};

export default config;
