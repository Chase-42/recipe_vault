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
    const securityHeaders = [
      {
        key: "X-DNS-Prefetch-Control",
        value: "on",
      },
      {
        key: "X-Frame-Options",
        value: "SAMEORIGIN",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-XSS-Protection",
        value: "1; mode=block",
      },
      {
        key: "Referrer-Policy",
        value: "origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];

    // HSTS only in production (HTTPS required)
    if (process.env.NODE_ENV === "production") {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          ...securityHeaders,
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
