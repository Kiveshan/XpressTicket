"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

const OrganiserDash = () => {
  const nav = useNavigate()
  const [analyticsData, setAnalyticsData] = useState({
    ticketsSold: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cards = [
    { label: "Host", image: "/wedding-wedding-day-marriage-marry-161018.jpeg", path: "/event-form" },
    { label: "Requests", image: "/pexels-photo-7163361.jpeg", path: "/requestcard" },
    { label: "Analytics", image: "/pexels-photo-185576.jpeg", path: "/analytics" },
    { label: "Payments", image: "/Customer2.jpg", path: "/ticketspaymentlist" },
  ]

  // Colors for charts
  const COLORS = ["#FF9800", "#2196F3", "#4CAF50", "#F44336", "#9C27B0", "#FFC107"]

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const token = sessionStorage.getItem("token")
        if (!token) {
          setError("No authentication token found. Please log in.")
          nav("/")
          return
        }

        setLoading(true)
        const response = await fetch("http://localhost:5000/api/organiser/analytics", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Fetched analytics data:", data) // Debug log
        setAnalyticsData(data)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching analytics data:", err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [nav])

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label || payload[0].name}</p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-value" style={{ color: entry.color || entry.payload.fill }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderTicketsSoldChart = () => {
    if (!analyticsData.ticketsSold || !analyticsData.ticketsSold.length) {
      return (
        <div className="chart-container-dash">
          <h3 className="chart-title-dash">Tickets Sold Analysis</h3>
          <div>No ticket sales data available</div>
        </div>
      )
    }

    return (
      <div className="chart-container-dash">
        <h3 className="chart-title-dash">Tickets Sold Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={analyticsData.ticketsSold}
              dataKey="ticketsSold"
              nameKey="event"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#FF9800"
              label
            >
              {analyticsData.ticketsSold.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="dashboard-container1">
      <header className="dashboard-header1">
        <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="dashboard-logo1" />
        <div className="profile-section">
          <button className="backbutton22" onClick={() => nav("/")}>
            LogOut
          </button>
        </div>
      </header>

      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav("/mainmenu")}>
          Back
        </button>
      </div>

      {/* Main Page Title */}
      <div className="page-title-container">
        <h1 className="page-title">Organizer Dashboard</h1>
      </div>

      <main className="dashboard-main-vertical">
        {/* Tickets Sold Chart Section */}
        <div className="chart-section-full">
          {loading ? (
            <div className="loading-container">Loading analytics...</div>
          ) : error ? (
            <div className="error-container">Error: {error}</div>
          ) : (
            renderTicketsSoldChart()
          )}
        </div>

        {/* Action Cards Section */}
        <div className="card-container-vertical">
          {cards.map((card, index) => (
            <div className="card1" key={index} onClick={() => nav(card.path)} style={{ cursor: "pointer" }}>
              <img src={card.image || "/placeholder.svg"} alt={card.label} />
              <div className="label">{card.label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default OrganiserDash
