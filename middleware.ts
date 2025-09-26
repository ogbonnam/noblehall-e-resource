// Use named imports for clarity and type support
import { NextResponse, NextRequest } from "next/server"; // Import NextRequest
import auth from "./auth";

// Define the middleware function with the correct type for 'request'
export async function middleware(request: NextRequest) {
  // <--- Added NextRequest type
  const user = await auth.getUser();

  // If user is already authenticated and tries to visit /signup → redirect them
  // if (!user && request.nextUrl.pathname === "/signup") {
  //   return NextResponse.redirect(new URL("/login", request.url)); // redirect home or dashboard
  // }

  // if (!user) {
  //   // request.cookies.delete() returns a new cookies object
  //   // You generally don't need to assign it back, just perform the action.
  //   request.cookies.delete("session");

  //   const response = NextResponse.redirect(new URL("/login", request.url));
  //   return response;
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/signup"],
};
