"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function AdminDashboard() {
  const cards = [
    {
      title: "Events",
      description: "Review and approve event requests",
      image: "/pexels-photo-2774556.jpeg",
      href: "/admin/events",
      icon: Calendar,
    },
    {
      title: "Users",
      description: "Manage system users",
      image: "/pexels-photo-5077038.jpeg",
      href: "/admin/users",
      icon: Users,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {cards.map((card) => (
        <Link key={card.title} href={card.href}>
          <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full">
            <CardContent className="p-6 text-center">
              <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                <Image src={card.image || "/placeholder.svg"} alt={card.title} fill className="object-cover" />
              </div>
              <div className="flex items-center justify-center mb-2">
                <card.icon className="h-6 w-6 mr-2 text-blue-600" />
                <h3 className="text-xl font-semibold">{card.title}</h3>
              </div>
              <p className="text-gray-600">{card.description}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
