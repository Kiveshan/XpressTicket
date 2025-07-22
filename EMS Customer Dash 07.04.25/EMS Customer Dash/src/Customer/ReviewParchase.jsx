"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FaArrowLeft, FaSignOutAlt, FaTicketAlt, FaCalendarAlt, FaUsers, FaMapMarkerAlt } from "react-icons/fa"
import "../shared/ModernDashboard.css"

const ReviewPurchase = () => {
  const navigate = useNavigate()
  const [purchasedTickets, setPurchasedTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPurchases()
  }, [])

  const getLatestPurchaseDate = (purchases) => {
    if (!purchases || purchases.length === 0) return 0;
    const dates = purchases.map(p => new Date(p.purchase_date || p.created_at || 0).getTime());
    return Math.max(...dates);
  }

  const fetchPurchases = async () => {
    setLoading(true);
    setError(null);

    try {
      const userInfo = JSON.parse(sessionStorage.getItem("userInfo"))
      const token = sessionStorage.getItem("token")

      if (!userInfo || !token) {
        setError("Please log in to view your purchases")
        setLoading(false)
        return
      }

      const userId = userInfo.userId || userInfo.user_id || userInfo.id
      console.log("Fetching purchased tickets for user ID:", userId)

      const response = await fetch(`http://localhost:5000/api/user-ticket-purchases/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("User ticket purchases data:", data)

      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received from server")
      }

      // Filter to only show approved purchases for the current user
      const userPurchases = data.filter(
        (purchase) => purchase.purchase_status === "Approved" && purchase.user_id === userId
      )

      console.log("Filtered user purchases:", userPurchases)

      // Remove duplicates based on purchase_id
      const uniquePurchases = userPurchases.reduce((acc, current) => {
        const existingPurchase = acc.find((item) => item.purchase_id === current.purchase_id)
        return existingPurchase ? acc : [...acc, current]
      }, [])

      console.log("Unique purchases after deduplication:", uniquePurchases)

      // Group purchases by event
      const eventGroups = {}
      uniquePurchases.forEach((purchase) => {
        const eventId = purchase.event_id
        if (!eventGroups[eventId]) {
          eventGroups[eventId] = {
            eventId: eventId,
            eventName: purchase.event_name,
            eventLocation: purchase.event_location,
            eventDate: purchase.event_date,
            eventImage: purchase.file_url || "/default-event-image.jpg",
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

            delegateCount = Array.isArray(delegates) ? delegates.length : 1
          } catch (e) {
            console.error("Error parsing delegate details:", e)
            delegateCount = purchase.number_of_tickets || 1
          }
        } else {
          delegateCount = purchase.number_of_tickets || 1
        }

        eventGroups[eventId].totalTickets += delegateCount
        eventGroups[eventId].totalAmount += Number.parseFloat(purchase.amount) || 0
      })

      // Convert to array and sort by most recent
      const groupedTickets = Object.values(eventGroups).sort((a, b) => {
        const aDate = getLatestPurchaseDate(a.purchases)
        const bDate = getLatestPurchaseDate(b.purchases)
        return bDate - aDate
      })

      console.log("Grouped tickets by event:", groupedTickets)
      setPurchasedTickets(groupedTickets)
    } catch (err) {
      console.error("Error fetching purchases:", err)
      setError(`Failed to load purchases: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToDashboard = () => {
    navigate("/customerdash")
  }

  const handleLogout = () => {
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("userInfo")
    navigate("/")
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Date not available"
    try {
      return new Date(dateString).toLocaleDateString("en-ZA", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (e) {
      return "Date not available"
    }
  }

  const handleImageError = (e) => {
    if (e.target.src !== "/default-event-image.jpg") {
      console.warn(`Failed to load image: ${e.target.src}`)
      e.target.src = "/default-event-image.jpg"
      e.target.classList.add("image-error")
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
      >
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
                onClick={handleBackToDashboard}
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
                <FaArrowLeft /> Back to Dashboard
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

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(100vh - 70px)",
            padding: "20px",
          }}
        >
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
            <p style={{ color: "#4ca1af", margin: "0", fontSize: "1.1rem" }}>Loading your purchases...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
      >
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
                onClick={handleBackToDashboard}
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
                <FaArrowLeft /> Back to Dashboard
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

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(100vh - 70px)",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
              padding: "60px",
              textAlign: "center",
              maxWidth: "500px",
            }}
          >
            <h3 style={{ color: "#dc2626", margin: "0 0 15px 0" }}>Error Loading Purchases</h3>
            <p style={{ color: "#6b7280", margin: "0 0 30px 0" }}>{error}</p>
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
                marginRight: "10px",
              }}
            >
              Try Again
            </button>
            <button
              onClick={handleBackToDashboard}
              style={{
                backgroundColor: "#6b7280",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  const eventGroups = groupTicketsByEvent(purchases)

  return (
    <div className="modern-dashboard-container">
      {/* Modern Header */}
      <header className="modern-header">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="modern-logo"
        />
        <div className="modern-header-actions">
          <button className="modern-logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {/* Back Button */}
      <div className="modern-back-button-container">
        <button className="modern-back-btn" onClick={handleBackToDashboard}>
          <FaArrowLeft /> Back
        </button>
      </div>

      {/* Main Content */}
      <main
        style={{
          padding: "30px 20px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: "30px" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "600",
              color: "#2c3e50",
              margin: "0 0 10px 0",
            }}
          >
            Your Ticket Purchases
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              color: "#6b7280",
              margin: "0",
            }}
          >
            Review and manage your event tickets
          </p>
        </div>

        {eventGroups.length === 0 ? (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
              padding: "60px",
              textAlign: "center",
            }}
          >
            <FaTicketAlt style={{ fontSize: "4rem", color: "#d1d5db", marginBottom: "20px" }} />
            <h3 style={{ color: "#374151", margin: "0 0 10px 0" }}>No Purchases Found</h3>
            <p style={{ color: "#6b7280", margin: "0" }}>You haven't purchased any tickets yet.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
              gap: "25px",
            }}
          >
            {eventGroups.map((eventGroup) => (
              <div
                key={eventGroup.eventId}
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
                  overflow: "hidden",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
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
                {/* Event Image */}
                <div
                  style={{
                    height: "200px",
                    backgroundImage: `url(${eventGroup.eventImage ? `http://localhost:5000${eventGroup.eventImage.startsWith("/") ? "" : "/"}${eventGroup.eventImage}` : "/placeholder.svg?height=200&width=400"})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    position: "relative",
                  }}
                >
                  <img
                    src={eventGroup.eventImage}
                    alt={eventGroup.eventName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.3s ease",
                    }}
                    onError={handleImageError}
                  />
                  {!eventGroup.eventImage && (
                    <div
                      style={{
                        position: "absolute",
                        top: "0",
                        left: "0",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f3f4f6",
                        color: "#6b7280",
                        fontSize: "1rem",
                      }}
                    >
                      <span>No Image</span>
                    </div>
                  )}
                  {/* Ticket Count Badge */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "0",
                      left: "0",
                      right: "0",
                      background: "linear-gradient(transparent, rgba(0, 0, 0, 0.7))",
                      color: "white",
                      padding: "20px",
                    }}
                  >
                    <h3
                      style={{
                        margin: "0",
                        fontSize: "1.3rem",
                        fontWeight: "600",
                      }}
                    >
                      {eventGroup.eventName}
                    </h3>
                  </div>
                </div>

                <div style={{ padding: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "12px",
                      color: "#6b7280",
                    }}
                  >
                    <FaCalendarAlt style={{ color: "#4ca1af" }} />
                    <span>{formatDate(eventGroup.eventDate)}</span>
                  </div>

                  {eventGroup.eventLocation && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "12px",
                        color: "#6b7280",
                      }}
                    >
                      <FaMapMarkerAlt style={{ color: "#4ca1af" }} />
                      <span>{eventGroup.eventLocation}</span>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "15px",
                      color: "#6b7280",
                    }}
                  >
                    <FaUsers style={{ color: "#4ca1af" }} />
                    <span>
                      {eventGroup.totalTickets} ticket{eventGroup.totalTickets !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "15px",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>Total Amount</div>
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "600",
                          color: "#059669",
                        }}
                      >
                        {formatPrice(eventGroup.totalAmount)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewTickets(eventGroup)}
                      style={{
                        backgroundColor: "#4ca1af",
                        color: "white",
                        border: "none",
                        padding: "12px 20px",
                        borderRadius: "6px",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#3d8b96"
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#4ca1af"
                      }}
                    >
                      <FaEye /> View Tickets
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .image-error {
            opacity: 0.6;
          }
        `}
      </style>
    </div>
  )
}

export default ReviewPurchase
