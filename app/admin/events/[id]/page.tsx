import { AdminViewEventRequest } from "@/components/admin/admin-view-event-request"
import { DashboardHeader } from "@/components/layout/dashboard-header"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminViewEventPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className="dashboard-container">
      <DashboardHeader showBackButton backHref="/admin/events" />
      <main className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Event Request</h1>
          <p className="text-gray-600">Review and approve or reject this event</p>
        </div>
        <AdminViewEventRequest eventId={id} />
      </main>
    </div>
  )
}
