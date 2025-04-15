/** @type {import("next").NextConfig} */
const config = {
	images: {
		remotePatterns: [
			{ hostname: "utfs.io" },
			{ hostname: "ucarecdn.com" }
		],
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
					{
						key: 'X-Frame-Options',
						value: 'DENY',
					},
					{
						key: 'Cache-Control',
						value: 'no-cache, no-store, must-revalidate',
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
	swcMinify: true,
	optimizeFonts: true,
	compiler: {
		removeConsole: process.env.NODE_ENV === "production" ? {
			exclude: ['error', 'warn'],
		} : false,
	},
	experimental: {
		optimizePackageImports: [
			'@radix-ui/react-alert-dialog',
			'@radix-ui/react-checkbox',
			'@radix-ui/react-dialog',
			'@radix-ui/react-select',
			'@radix-ui/react-slot',
			'@radix-ui/react-tooltip',
			'lucide-react',
			'@tabler/icons-react',
			'framer-motion'
		],
		optimizeServerReact: true,
		serverMinification: true,
	}
};

export default config;
