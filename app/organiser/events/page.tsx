import { EventRequestsList } from "@/components/events/event-requests-list"
import { DashboardHeader } from "@/components/layout/dashboard-header"

export default function EventRequestsPage() {
  return (
    <div className="dashboard-container">
      <DashboardHeader showBackButton backHref="/organiser/dashboard" />
      <main className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Requests</h1>
          <p className="text-gray-600">View and manage your event requests</p>
        </div>
        <EventRequestsList />
      </main>
    </div>
  )
}
