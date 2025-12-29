import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
import { NextResponse } from "next/server";

// 1. Pre-calculate matchers OUTSIDE the middleware function to save CPU cycles
const routeMatchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

export default clerkMiddleware(async (auth, req) => {
  // 2. Protect only the routes that need it. 
  // If it's a login page or static asset, exit early.
  if (req.nextUrl.pathname === "/sign-in" || req.nextUrl.pathname === "/") {
    return NextResponse.next();
  }

  const { sessionClaims, userId } = await auth();
  
  // 3. Handle Sign-out/Unauthenticated state quickly
  if (!userId) {
    // If user is not logged in and trying to access a restricted page, 
    // Clerk handles the redirect to sign-in automatically if you use .protect()
    // or you can manually handle it here.
    return NextResponse.next();
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // 4. Find the first matching route and check permissions
  for (const { matcher, allowedRoles } of routeMatchers) {
    if (matcher(req)) {
      if (!role || !allowedRoles.includes(role)) {
        // Optimization: Don't redirect if they are already going to their role page
        const targetPath = role ? `/${role}` : "/sign-in";
        if (req.nextUrl.pathname !== targetPath) {
          return NextResponse.redirect(new URL(targetPath, req.url));
        }
      }
      break; // Stop loop once a match is found
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Standard Next.js/Clerk matcher
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
