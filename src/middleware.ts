import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { generateCorrelationId } from "~/lib/logger";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const correlationId = request.headers.get("x-correlation-id") ?? generateCorrelationId();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-correlation-id", correlationId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("x-correlation-id", correlationId);

  if (sessionCookie && ["/sign-in", "/sign-up"].includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url), {
      headers: response.headers,
    });
  }

  if (
    !sessionCookie &&
    (pathname.startsWith("/api/shopping-lists") ||
      pathname.startsWith("/api/recipes") ||
      pathname.startsWith("/api/upload"))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
