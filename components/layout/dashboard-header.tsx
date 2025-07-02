"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { ArrowLeft, LogOut } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface DashboardHeaderProps {
  showBackButton?: boolean
  backHref?: string
}

export function DashboardHeader({ showBackButton, backHref }: DashboardHeaderProps) {
  const { logout, user } = useAuth()

  return (
    <header className="dashboard-header">
      <div className="flex items-center gap-4">
        {showBackButton && backHref && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        )}
        <Image
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          width={150}
          height={60}
          className="dashboard-logo"
        />
      </div>

      <div className="flex items-center gap-4">
        {user && <div className="text-sm text-gray-600">Welcome, {user.name}</div>}
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  )
}
