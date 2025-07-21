"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { FaArrowLeft, FaSignOutAlt, FaTicketAlt, FaCalendarAlt, FaUsers } from "react-icons/fa"

const ReviewParchase = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [purchasedTickets, setPurchasedTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get event data from navigation state (not needed for this component)
  // const eventData = location.state || {}
  // const { eventId, eventName, eventImage, eventDate, eventLocation, eventDescription } = eventData

  // console.log("ReviewPurchase - Event Data:", eventData)
  // console.log("ReviewPurchase - Event ID:", eventId)

  useEffect(() => {
    const fetchPurchasedTickets = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get user ID from session storage
        const userInfo = sessionStorage.getItem("userInfo")
        let currentUserId = null

        if (userInfo) {
          try {
            const parsedInfo = JSON.parse(userInfo)
            currentUserId = parsedInfo.userId || parsedInfo.user_id
            console.log("Fetching purchased tickets for user ID:", currentUserId)
          } catch (e) {
            console.error("Error parsing user info:", e)
            setError("Error parsing user info from session")
            return
          }
        }

        const token = sessionStorage.getItem("token")

        if (!token) {
          setError("No authentication token found")
          navigate("/")
          return
        }

        if (!currentUserId) {
          setError("User not authenticated")
          return
        }

        // Fetch user ticket purchases
        const response = await fetch(`http://localhost:5000/api/user-ticket-purchases/${currentUserId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} - ${response.statusText}`)
        }

        const data = await response.json()
        console.log("User ticket purchases data:", data)

        // Filter purchases for the current user
        const userPurchases = data.filter((purchase) => purchase.user_id === currentUserId)

        console.log("Filtered user purchases:", userPurchases)

        // Group purchases by event
        const eventGroups = {}
        userPurchases.forEach((purchase) => {
          const eventId = purchase.event_id
          if (!eventGroups[eventId]) {
            eventGroups[eventId] = {
              eventId: eventId,
              eventName: purchase.event_name,
              purchases: [],
              totalTickets: 0,
              totalAmount: 0,
            }
          }

          eventGroups[eventId].purchases.push(purchase)

          // Parse delegate details to count tickets
          let delegateCount = 1
          if (purchase.delegate_details) {
            try {
              const delegates =
                typeof purchase.delegate_details === "string"
                  ? JSON.parse(purchase.delegate_details)
                  : purchase.delegate_details

              if (Array.isArray(delegates)) {
                delegateCount = delegates.length
              }
            } catch (e) {
              console.error("Error parsing delegate details:", e)
            }
          }

          eventGroups[eventId].totalTickets += delegateCount
          eventGroups[eventId].totalAmount += Number.parseFloat(purchase.amount) || 0
        })

        // Convert to array and sort by most recent
        const groupedTickets = Object.values(eventGroups).sort((a, b) => {
          const aDate = Math.max(...a.purchases.map((p) => new Date(p.purchase_date).getTime()))
          const bDate = Math.max(...b.purchases.map((p) => new Date(p.purchase_date).getTime()))
          return bDate - aDate
        })

        console.log("Grouped tickets by event:", groupedTickets)

        // Log specific event info
        groupedTickets.forEach((group) => {
          console.log(
            `ReviewPurchase - Event ${group.eventId} (${group.eventName}) - Total tickets: ${group.totalTickets}, Total amount: ${group.totalAmount}`,
          )
        })

        setPurchasedTickets(groupedTickets)
      } catch (err) {
        console.error("Error fetching purchased tickets:", err)
        setError(`Failed to load purchased tickets: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchPurchasedTickets()
  }, [navigate])

  const handleViewTickets = (eventGroup) => {
    console.log("ReviewPurchase - Navigating to tickets list for event:", eventGroup)
    navigate("/ticketslist", {
      state: {
        eventId: eventGroup.eventId,
        eventName: eventGroup.eventName,
        totalTickets: eventGroup.totalTickets,
        totalAmount: eventGroup.totalAmount,
        purchases: eventGroup.purchases,
      },
    })
  }

  const handleLogout = () => {
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("userInfo")
    navigate("/")
  }

  const formatPrice = (price) => {
    const numPrice = Number.parseFloat(price)
    return isNaN(numPrice) ? "R 0.00" : `R ${numPrice.toFixed(2)}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Date not available"
    try {
      return new Date(dateString).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (e) {
      return "Date not available"
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "linear-gradient(135deg, #2c3e50, #4ca1af)",
          color: "white",
          padding: "15px 20px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <img src="/XPRESS TICKETS LOGO2.png" alt="XpressTicket Logo" style={{ height: "35px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: "transparent",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.5)",
                borderRadius: "4px",
                padding: "5px 10px",
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <FaArrowLeft /> Back
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.5)",
                borderRadius: "4px",
                padding: "5px 10px",
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          padding: "20px 15px",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Page Title */}
        <div style={{ marginBottom: "30px" }}>
          <h1
            style={{
              fontSize: "1.8rem",
              color: "#2c3e50",
              margin: "0 0 10px 0",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <FaTicketAlt /> My Purchased Tickets
          </h1>
          <p
            style={{
              margin: "0",
              color: "#6c757d",
              fontSize: "1rem",
            }}
          >
            View and manage all your event tickets
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
              padding: "60px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #4ca1af",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px",
              }}
            ></div>
            <p style={{ color: "#4ca1af", margin: "0", fontSize: "1.1rem" }}>Loading your tickets...</p>
          </div>
        ) : error ? (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
              padding: "60px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                backgroundColor: "#fee2e2",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "24px",
                color: "#dc2626",
              }}
            >
              ⚠️
            </div>
            <h3 style={{ color: "#dc2626", margin: "0 0 10px 0" }}>Error Loading Tickets</h3>
            <p style={{ color: "#6b7280", margin: "0 0 20px 0" }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: "#4ca1af",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              Try Again
            </button>
          </div>
        ) : purchasedTickets.length > 0 ? (
          <div
            style={{
              display: "grid",
              gap: "20px",
              gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            }}
          >
            {purchasedTickets.map((eventGroup) => (
              <div
                key={eventGroup.eventId}
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
                  overflow: "hidden",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.12)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.08)"
                }}
              >
                {/* Event Header */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #2c3e50, #4ca1af)",
                    color: "white",
                    padding: "20px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "1.3rem",
                      fontWeight: "600",
                    }}
                  >
                    {eventGroup.eventName}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      fontSize: "0.9rem",
                      opacity: "0.9",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <FaTicketAlt />
                      {eventGroup.totalTickets} {eventGroup.totalTickets === 1 ? "ticket" : "tickets"}
                    </span>
                    <span>Total: {formatPrice(eventGroup.totalAmount)}</span>
                  </div>
                </div>

                {/* Event Details */}
                <div style={{ padding: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#6b7280",
                        fontSize: "0.9rem",
                      }}
                    >
                      <FaCalendarAlt />
                      <span>
                        Latest Purchase:{" "}
                        {formatDate(Math.max(...eventGroup.purchases.map((p) => new Date(p.purchase_date).getTime())))}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#6b7280",
                        fontSize: "0.9rem",
                      }}
                    >
                      <FaUsers />
                      <span>
                        {eventGroup.purchases.length} purchase{eventGroup.purchases.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleViewTickets(eventGroup)}
                    style={{
                      width: "100%",
                      backgroundColor: "#4ca1af",
                      color: "white",
                      border: "none",
                      padding: "12px 20px",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#3d8e9c"
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#4ca1af"
                    }}
                  >
                    <FaTicketAlt /> View Tickets
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
              padding: "60px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#f3f4f6",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "32px",
                color: "#9ca3af",
              }}
            >
              🎫
            </div>
            <h3 style={{ color: "#374151", margin: "0 0 10px 0", fontSize: "1.4rem" }}>No Tickets Found</h3>
            <p style={{ color: "#6b7280", margin: "0 0 30px 0", fontSize: "1rem" }}>
              You haven't purchased any tickets yet. Browse events to get started!
            </p>
            <button
              onClick={() => navigate("/eventmenu")}
              style={{
                backgroundColor: "#4ca1af",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#3d8e9c"
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#4ca1af"
              }}
            >
              Browse Events
            </button>
          </div>
        )}
      </main>

      {/* Loading Animation Keyframes */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

export default ReviewParchase
