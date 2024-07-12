/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const coreConfig = {
	images: {
		remotePatterns: [{ hostname: "utfs.io" }, { hostname: "ucarecdn.com" }],
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	rewrites: async () => {
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
				destination:
					process.env.NODE_ENV === "development"
						? "http://127.0.0.1:5328/api/recipes/:path*"
						: "/api/recipes/:path*",
			},
		];
	},
};

import { withSentryConfig } from "@sentry/nextjs";

const config = withSentryConfig(coreConfig, {
	org: "chase-collins",
	project: "recipe-vault",
	silent: !process.env.CI,
	widenClientFileUpload: true,
	hideSourceMaps: true,
	disableLogger: true,
	automaticVercelMonitors: true,
});

export default config;
