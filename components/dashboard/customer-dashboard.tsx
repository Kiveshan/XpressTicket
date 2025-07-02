"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Receipt } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function CustomerDashboard() {
  const cards = [
    {
      title: "Book an Event",
      description: "Browse and book available events",
      image: "/Organiser.jpg",
      href: "/customer/events",
      icon: Calendar,
    },
    {
      title: "Review Purchases",
      description: "View your tickets and purchase history",
      image: "/Customer.jpg",
      href: "/customer/purchases",
      icon: Receipt,
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
