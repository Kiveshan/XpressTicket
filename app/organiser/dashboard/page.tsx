import { OrganiserDashboard } from "@/components/dashboard/organiser-dashboard"
import { DashboardHeader } from "@/components/layout/dashboard-header"

export default function OrganiserDashboardPage() {
  return (
    <div className="dashboard-container">
      <DashboardHeader showBackButton backHref="/main-menu" />
      <main className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Organiser Dashboard</h1>
          <p className="text-gray-600">Create and manage your events</p>
        </div>
        <OrganiserDashboard />
      </main>
    </div>
  )
}
