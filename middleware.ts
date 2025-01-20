import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  console.log("Middleware executing for path:", request.nextUrl.pathname)

  const token = request.cookies.get("token")?.value
  const user = request.cookies.get("user")?.value

  console.log("Token from cookie:", token)
  console.log("User from cookie:", user)

  if (!token || !user) {
    console.log("No token or user in cookies, redirecting to login")
    return NextResponse.redirect(new URL("/login", request.url))
  }

  let userObj
  try {
    userObj = JSON.parse(user)
    console.log("Parsed user object:", userObj)
  } catch (error) {
    console.error("Error parsing user cookie:", error)
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (request.nextUrl.pathname === "/") {
    if (userObj.role === "admin") {
      console.log("Admin user at root, redirecting to admin dashboard")
      return NextResponse.redirect(new URL("/admin/users", request.url))
    } else if (userObj.role === "customer") {
      console.log("Customer user at root, redirecting to restaurant orders")
      return NextResponse.redirect(new URL("/restaurant/orders", request.url))
    }
  }

  if (request.nextUrl.pathname.startsWith("/admin") && userObj.role !== "admin") {
    console.log("Non-admin trying to access admin area, redirecting")
    return NextResponse.redirect(new URL("/restaurant/orders", request.url))
  }

  if (request.nextUrl.pathname.startsWith("/restaurant") && userObj.role !== "customer") {
    console.log("Non-customer trying to access restaurant area, redirecting")
    return NextResponse.redirect(new URL("/admin/users", request.url))
  }

  console.log("Middleware allowing request to proceed")
  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/admin/:path*", "/restaurant/:path*"],
}

