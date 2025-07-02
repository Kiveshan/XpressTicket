import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { DashboardHeader } from "@/components/layout/dashboard-header"

export default function AdminDashboardPage() {
  return (
    <div className="dashboard-container">
      <DashboardHeader />
      <main className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage events and users</p>
        </div>
        <AdminDashboard />
      </main>
    </div>
  )
}
