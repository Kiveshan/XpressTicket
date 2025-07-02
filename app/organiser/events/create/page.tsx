import { EventForm } from "@/components/forms/event-form"
import { DashboardHeader } from "@/components/layout/dashboard-header"

export default function CreateEventPage() {
  return (
    <div className="dashboard-container">
      <DashboardHeader showBackButton backHref="/organiser/dashboard" />
      <main className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Event</h1>
          <p className="text-gray-600">Fill in the details to create your event</p>
        </div>
        <EventForm />
      </main>
    </div>
  )
}
