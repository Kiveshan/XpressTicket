import { MainMenuCards } from "@/components/dashboard/main-menu-cards"
import { DashboardHeader } from "@/components/layout/dashboard-header"

export default function MainMenuPage() {
  return (
    <div className="dashboard-container">
      <DashboardHeader />
      <main className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Role</h1>
          <p className="text-gray-600">Select how you'd like to use EventXpress today</p>
        </div>
        <MainMenuCards />
      </main>
    </div>
  )
}
