import { type NextRequest, NextResponse } from "next/server"
import { generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Hardcoded admin credentials
    const ADMIN_EMAIL = "admin@eventxpress.com"
    const ADMIN_PASSWORD = "admin123"

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Invalid admin credentials" }, { status: 401 })
    }

    // Generate admin token
    const adminData = {
      userId: "admin",
      name: "Administrator",
      email: ADMIN_EMAIL,
      isAdmin: true,
    }

    const token = generateToken(adminData)

    // Set cookie
    const response = NextResponse.json({
      message: "Admin login successful",
      user: adminData,
      token,
    })

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
    })

    return response
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
