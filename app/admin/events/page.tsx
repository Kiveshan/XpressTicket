import { EventApprovalList } from "@/components/admin/event-approval-list"
import { DashboardHeader } from "@/components/layout/dashboard-header"

export default function EventApprovalPage() {
  return (
    <div className="dashboard-container">
      <DashboardHeader showBackButton backHref="/admin/dashboard" />
      <main className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Approval</h1>
          <p className="text-gray-600">Review and approve event requests</p>
        </div>
        <EventApprovalList />
      </main>
    </div>
  )
}
