import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { AuthorizationError } from "./lib/errors";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/add(.*)",
  "/edit(.*)",
  "/meal-planner(.*)",
  "/shopping-lists(.*)",
  "/print(.*)",
  "/api/shopping-lists(.*)",
  "/api/recipes(.*)",
  "/api/upload(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const authObj = await auth();
    if (!authObj.userId) {
      throw new AuthorizationError();
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
