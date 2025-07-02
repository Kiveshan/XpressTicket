import { redirect } from "next/navigation"
import { getUserFromToken } from "@/lib/auth"
import { cookies } from "next/headers"

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    redirect("/")
  }

  const user = await getUserFromToken(token)

  if (!user) {
    redirect("/")
  }

  // Redirect based on user type
  if (user.isAdmin) {
    redirect("/admin/dashboard")
  } else {
    // For regular users, redirect to main menu to choose role
    redirect("/main-menu")
  }
}
