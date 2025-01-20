/** @type {import("next").NextConfig} */
const config = {
	images: {
		remotePatterns: [{ hostname: "utfs.io" }, { hostname: "ucarecdn.com" }],
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
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
				source: "/api/recipes/:path*",
				destination: "/api/recipes/:path*",
			},
		];
	},
};

export default config;
