import { ViewEventRequest } from "@/components/events/view-event-request"
import { DashboardHeader } from "@/components/layout/dashboard-header"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ViewEventPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className="dashboard-container">
      <DashboardHeader showBackButton backHref="/organiser/events" />
      <main className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Details</h1>
          <p className="text-gray-600">View your event request details</p>
        </div>
        <ViewEventRequest eventId={id} />
      </main>
    </div>
  )
}
