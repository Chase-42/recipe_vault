"use client";

import * as Sentry from "@sentry/nextjs";
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
import Error from "next/error";
import { useEffect } from "react";

export default function GlobalError(props: { error: unknown }) {
	useEffect(() => {
		Sentry.captureException(props.error);
	}, [props.error]);

	return (
		<html lang="en">
			<body>
				<Error statusCode={500} title="Error" />
			</body>
		</html>
	);
}
