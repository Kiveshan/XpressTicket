"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Calendar } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function MainMenuCards() {
  const cards = [
    {
      title: "Customer",
      description: "Book events and manage tickets",
      image: "/Customer.jpg",
      href: "/customer/dashboard",
      icon: Users,
    },
    {
      title: "Organiser",
      description: "Create and manage events",
      image: "/Organiser.jpg",
      href: "/organiser/dashboard",
      icon: Calendar,
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
