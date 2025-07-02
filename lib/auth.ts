import jwt from "jsonwebtoken"

export interface User {
  userId: string
  name: string
  email: string
  title?: string
  isAdmin?: boolean
}

export async function getUserFromToken(token: string): Promise<User | null> {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured")
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any

    if (decoded.isAdmin) {
      return {
        userId: "admin",
        name: "Administrator",
        email: "admin@eventxpress.com",
        isAdmin: true,
      }
    }

    return {
      userId: decoded.userId,
      name: decoded.name || "",
      email: decoded.email || "",
      title: decoded.title,
      isAdmin: false,
    }
  } catch (error) {
    console.error("Error verifying token:", error)
    return null
  }
}

export function generateToken(user: User): string {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured")
  }

  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" })
}
