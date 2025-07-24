"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { FaArrowLeft, FaSignOutAlt, FaTicketAlt, FaCalendarAlt, FaUsers, FaMapMarkerAlt } from "react-icons/fa"
import "../shared/ModernDashboard.css"

const ReviewPurchase = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [purchasedTickets, setPurchasedTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
            setLoading(false)
            return
          }
        } else {
          setError("No user information found")
          navigate("/")
          return
        }

        const token = sessionStorage.getItem("token")

        if (!token) {
          setError("No authentication token found")
          navigate("/")
          return
        }

        if (!currentUserId) {
          setError("User not authenticated")
          navigate("/")
          return
        }

        // Fetch user ticket purchases
        const response = await fetch(`http://localhost:5000/api/user-ticket-purchases/${currentUserId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        })

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized: Please log in again")
          } else if (response.status === 403) {
            throw new Error("Forbidden: You do not have permission to access this resource")
          } else {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`)
          }
        }

        const data = await response.json()
        console.log("User ticket purchases data:", data)

        // Filter purchases for the current user
        const userPurchases = data.filter((purchase) => purchase.user_id === currentUserId)

        console.log("Filtered user purchases:", userPurchases)

        // Remove duplicates based on purchase_id
        const uniquePurchases = userPurchases.reduce((acc, current) => {
          const existingPurchase = acc.find((item) => item.purchase_id === current.purchase_id)
          if (!existingPurchase) {
            acc.push(current)
          }
          return acc
        }, [])

        console.log("Unique purchases after deduplication:", uniquePurchases)

        // Group purchases by event
        const eventGroups = {}
        uniquePurchases.forEach((purchase) => {
          const eventId = purchase.event_id
          if (!eventGroups[eventId]) {
            eventGroups[eventId] = {
              eventId: eventId,
              eventName: purchase.event_name || "Unknown Event",
              eventLocation: purchase.event_location || "Location not specified",
              eventDate: purchase.event_date || null,
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

              if (Array.isArray(delegates)) {
                delegateCount = delegates.length
              } else if (typeof delegates === "object" && delegates !== null) {
                delegateCount = 1
              }
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

        // Log specific event info
        groupedTickets.forEach((group) => {
          console.log(
            `ReviewPurchase - Event ${group.eventId} (${group.eventName}) - Total tickets: ${group.totalTickets}, Total amount: ${group.totalAmount}`,
          )
          console.log(`Number of unique purchases: ${group.purchases.length}`)
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

  // Helper function to get the latest purchase date safely
  const getLatestPurchaseDate = (purchases) => {
    const validDates = purchases
      .map((p) => {
        const date = new Date(p.purchase_date)
        return isNaN(date.getTime()) ? null : date.getTime()
      })
      .filter((date) => date !== null)

    return validDates.length > 0 ? Math.max(...validDates) : 0
  }

  // Helper function to format the latest purchase date
  const getFormattedLatestDate = (purchases) => {
    const latestTimestamp = getLatestPurchaseDate(purchases)
    if (latestTimestamp === 0) {
      return "Date not available"
    }
    return formatDate(new Date(latestTimestamp).toISOString())
  }

  const handleViewTickets = (eventGroup) => {
    console.log("ReviewPurchase - Navigating to tickets list for event:", eventGroup)
    navigate("/ticketslist", {
      state: {
        eventId: eventGroup.eventId,
        eventName: eventGroup.eventName,
        totalTickets: eventGroup.totalTickets,
        totalAmount: eventGroup.totalAmount,
        purchases: eventGroup.purchases,
        eventInfo: {
          eventName: eventGroup.eventName,
          eventLocation: eventGroup.eventLocation,
          eventDate: eventGroup.eventDate,
          eventImage: eventGroup.eventImage,
        },
      },
    })
  }

  const handleBackToDashboard = () => {
    navigate("/customerdash")
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

  const handleImageError = (e) => {
    if (e.target.src !== "/default-event-image.jpg") {
      console.warn(`Failed to load image: ${e.target.src}`)
      e.target.src = "/default-event-image.jpg"
      e.target.classList.add("image-error")
    }
  }

  console.log("Rendering ReviewPurchase", { purchasedTickets, loading, error })

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
              onClick={() => navigate("/customerdash")}
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
              Back to Dashboard
            </button>
          </div>
        ) : purchasedTickets.length > 0 ? (
          <div
            style={{
              display: "grid",
              gap: "20px",
              gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
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
                {/* Event Image */}
                <div
                  style={{
                    height: "200px",
                    overflow: "hidden",
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
                      top: "15px",
                      right: "15px",
                      backgroundColor: "rgba(76, 161, 175, 0.9)",
                      color: "white",
                      padding: "8px 12px",
                      borderRadius: "20px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <FaTicketAlt />
                    {eventGroup.totalTickets} {eventGroup.totalTickets === 1 ? "ticket" : "tickets"}
                  </div>
                </div>

                {/* Event Content */}
                <div style={{ padding: "20px" }}>
                  {/* Event Title */}
                  <h3
                    style={{
                      margin: "0 0 15px 0",
                      fontSize: "1.4rem",
                      fontWeight: "600",
                      color: "#2c3e50",
                      lineHeight: "1.3",
                    }}
                  >
                    {eventGroup.eventName}
                  </h3>

                  {/* Event Details */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      marginBottom: "20px",
                    }}
                  >
                    {eventGroup.eventDate && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          color: "#6b7280",
                          fontSize: "0.9rem",
                        }}
                      >
                        <FaCalendarAlt style={{ color: "#4ca1af" }} />
                        <span>Event Date: {formatDate(eventGroup.eventDate)}</span>
                      </div>
                    )}

                    {eventGroup.eventLocation && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          color: "#6b7280",
                          fontSize: "0.9rem",
                        }}
                      >
                        <FaMapMarkerAlt style={{ color: "#4ca1af" }} />
                        <span>Location: {eventGroup.eventLocation}</span>
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#6b7280",
                        fontSize: "0.9rem",
                      }}
                    >
                      <FaCalendarAlt style={{ color: "#4ca1af" }} />
                      <span>Latest Purchase: {getFormattedLatestDate(eventGroup.purchases)}</span>
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
                      <FaUsers style={{ color: "#4ca1af" }} />
                      <span>
                        {eventGroup.purchases.length} purchase{eventGroup.purchases.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Price and Action */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "15px",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: "600",
                        color: "#059669",
                      }}
                    >
                      Total: {formatPrice(eventGroup.totalAmount)}
                    </div>

                    <button
                      onClick={() => handleViewTickets(eventGroup)}
                      style={{
                        backgroundColor: "#4ca1af",
                        color: "white",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
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
          .image-error {
            opacity: 0.6;
          }
        `}
      </style>
    </div>
  )
}

export default ReviewPurchase