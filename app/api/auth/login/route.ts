import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import bcrypt from "bcrypt"
import { generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    // Query user from database
    const result = await pool.query("SELECT * FROM userprofile WHERE email = $1", [email])
    const user = result.rows[0]

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Generate token
    const userData = {
      userId: user.userid.toString(),
      name: user.name,
      email: user.email,
      title: user.title,
      isAdmin: false,
    }

    const token = generateToken(userData)

    // Set cookie
    const response = NextResponse.json({
      message: "Login successful",
      user: userData,
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
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
