import { CustomerDashboard } from "@/components/dashboard/customer-dashboard"
import { DashboardHeader } from "@/components/layout/dashboard-header"

export default function CustomerDashboardPage() {
  return (
    <div className="dashboard-container">
      <DashboardHeader showBackButton backHref="/main-menu" />
      <main className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Dashboard</h1>
          <p className="text-gray-600">Book events and manage your tickets</p>
        </div>
        <CustomerDashboard />
      </main>
    </div>
  )
}
