"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const OrganiserDash = () => {
  const nav = useNavigate()
  const [analyticsData, setAnalyticsData] = useState({
    eventStatus: [],
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

  // Colors for charts (keeping original colors)
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

  const renderEventStatusChart = () => {
    return (
      <div className="chart-container-dash">
        <h3 className="chart-title-dash">Event Status Analysis</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={analyticsData.eventStatus} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="approved" name="Approved" fill="#4CAF50" radius={[4, 4, 0, 0]} />
            <Bar dataKey="rejected" name="Rejected" fill="#F44336" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" name="Pending" fill="#FFC107" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const renderTicketsSoldChart = () => {
    return (
      <div className="chart-container-dash">
        <h3 className="chart-title-dash">Tickets Sold Analysis</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={analyticsData.ticketsSold}
              dataKey="ticketsSold"
              nameKey="event"
              cx="50%"
              cy="50%"
              outerRadius={80}
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

      <main className="dashboard-main-split">
        {/* Left side - Analytics Charts */}
        <div className="analytics-section">
          <h2 className="analytics-header">Dashboard Analytics</h2>
          {loading ? (
            <div className="loading-container">Loading analytics...</div>
          ) : error ? (
            <div className="error-container">Error: {error}</div>
          ) : (
            <div className="charts-grid">
              {renderEventStatusChart()}
              {renderTicketsSoldChart()}
            </div>
          )}
        </div>

        {/* Right side - Navigation Cards */}
        <div className="cards-section">
          <h2 className="cards-header">Quick Actions</h2>
          <div className="card-container-split">
            {cards.map((card, index) => (
              <div className="card1" key={index} onClick={() => nav(card.path)} style={{ cursor: "pointer" }}>
                <img src={card.image || "/placeholder.svg"} alt={card.label} />
                <div className="label">{card.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default OrganiserDash
