import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import bcrypt from "bcrypt"

export async function POST(request: NextRequest) {
  try {
    const { name, title, email, phoneNumber, institutionLocation, faculty, department, ieeeNum, organVAT, password } =
      await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Name, email, and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await pool.query("SELECT * FROM userprofile WHERE email = $1", [email])
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert user
    const query = `
      INSERT INTO userprofile (name, title, email, phone_number, institution_location, faculty, department, iee_num, oran_vat, password)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING userid, name, email, title
    `
    const values = [
      name,
      title,
      email,
      phoneNumber,
      institutionLocation,
      faculty,
      department,
      ieeeNum,
      organVAT,
      hashedPassword,
    ]

    const result = await pool.query(query, values)
    const user = result.rows[0]

    return NextResponse.json({
      message: "User registered successfully",
      user: {
        id: user.userid,
        name: user.name,
        email: user.email,
        title: user.title,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
