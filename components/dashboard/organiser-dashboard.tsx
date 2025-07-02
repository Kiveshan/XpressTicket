"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Plus, FileText, BarChart3, CreditCard } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function OrganiserDashboard() {
  const cards = [
    {
      title: "Host",
      description: "Create a new event",
      image: "/wedding-wedding-day-marriage-marry-161018.jpeg",
      href: "/organiser/events/create",
      icon: Plus,
    },
    {
      title: "Requests",
      description: "View event requests and status",
      image: "/pexels-photo-7163361.jpeg",
      href: "/organiser/events",
      icon: FileText,
    },
    {
      title: "Analytics",
      description: "View event analytics and insights",
      image: "/pexels-photo-185576.jpeg",
      href: "/organiser/analytics",
      icon: BarChart3,
    },
    {
      title: "Payments",
      description: "Manage payments and transactions",
      image: "/Customer2.jpg",
      href: "/organiser/payments",
      icon: CreditCard,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <Link key={card.title} href={card.href}>
          <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full">
            <CardContent className="p-4 text-center">
              <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                <Image src={card.image || "/placeholder.svg"} alt={card.title} fill className="object-cover" />
              </div>
              <div className="flex items-center justify-center mb-2">
                <card.icon className="h-5 w-5 mr-2 text-blue-600" />
                <h3 className="text-lg font-semibold">{card.title}</h3>
              </div>
              <p className="text-sm text-gray-600">{card.description}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
