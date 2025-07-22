"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FaArrowLeft, FaSignOutAlt, FaTicketAlt, FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaEye } from "react-icons/fa"

const ReviewPurchase = () => {
  const navigate = useNavigate()
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    try {
      const userInfo = JSON.parse(sessionStorage.getItem("userInfo"))
      const token = sessionStorage.getItem("token")

      if (!userInfo || !token) {
        setError("Please log in to view your purchases")
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

      if (Array.isArray(data)) {
        // Filter to only show approved purchases
        const approvedPurchases = data.filter((purchase) => purchase.purchase_status === "Approved")
        console.log("Filtered approved purchases:", approvedPurchases)

        // Remove duplicates based on purchase_id
        const uniquePurchases = approvedPurchases.reduce((acc, current) => {
          const existingPurchase = acc.find((item) => item.purchase_id === current.purchase_id)
          if (!existingPurchase) {
            acc.push(current)
          }
          return acc
        }, [])

        console.log("Unique purchases after deduplication:", uniquePurchases)
        setPurchases(uniquePurchases)
      } else {
        console.error("Expected array but got:", typeof data, data)
        setError("Invalid data format received from server")
      }
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

  const formatPrice = (price) => {
    const numPrice = Number.parseFloat(price)
    return isNaN(numPrice) ? "R 0.00" : `R ${numPrice.toFixed(2)}`
  }

  const groupTicketsByEvent = (purchases) => {
    const grouped = purchases.reduce((acc, purchase) => {
      const eventId = purchase.event_id
      if (!acc[eventId]) {
        acc[eventId] = {
          eventId,
          eventName: purchase.event_name || purchase.eventName || "Unknown Event",
          eventDate: purchase.event_date || purchase.eventDate,
          eventLocation: purchase.location || purchase.event_location || purchase.eventLocation,
          eventImage: purchase.file_url || purchase.coverimage || purchase.eventImage,
          purchases: [],
          totalAmount: 0,
          totalTickets: 0,
        }
      }
      acc[eventId].purchases.push(purchase)
      acc[eventId].totalAmount += Number.parseFloat(purchase.amount || purchase.total_amount || purchase.price || 0)

      // Count tickets from number_of_tickets or delegate details
      const ticketCount = purchase.number_of_tickets || 1
      acc[eventId].totalTickets += ticketCount

      return acc
    }, {})

    const groupedArray = Object.values(grouped)
    console.log("Grouped tickets by event:", groupedArray)

    groupedArray.forEach((event) => {
      console.log(
        `ReviewPurchase - Event ${event.eventId} (${event.eventName}) - Total tickets: ${event.totalTickets}, Total amount: ${event.totalAmount}`,
      )
    })

    console.log("Number of unique purchases:", purchases.length)
    return groupedArray
  }

  const processTicketsForEvent = (eventGroup) => {
    console.log("Processing tickets for event group:", eventGroup)
    const processedTickets = []

    eventGroup.purchases.forEach((purchase, purchaseIndex) => {
      console.log(`Processing purchase ${purchaseIndex}:`, purchase)

      // Parse delegate details
      let delegates = []
      try {
        if (purchase.delegate_details) {
          console.log("Raw delegate_details:", purchase.delegate_details)
          if (typeof purchase.delegate_details === "string") {
            delegates = JSON.parse(purchase.delegate_details)
          } else {
            delegates = purchase.delegate_details
          }
          console.log("Parsed delegates:", delegates)
        }
      } catch (e) {
        console.error("Error parsing delegate details:", e)
        delegates = []
      }

      // Ensure delegates is an array
      if (!Array.isArray(delegates)) {
        if (typeof delegates === "object" && delegates !== null) {
          delegates = [delegates]
        } else {
          delegates = []
        }
      }

      // If no delegates, create one from customer info
      if (delegates.length === 0) {
        console.log("No delegates found, creating from customer info")
        delegates = [
          {
            name: purchase.firstname || "N/A",
            surname: purchase.surname || "",
            email: purchase.email || "N/A",
            phone: purchase.cellnumber || "N/A",
            institution: purchase.institution || "N/A",
          },
        ]
        console.log("Created delegate from customer info:", delegates[0])
      }

      // Parse package information
      let packageInfo = "General Admission"
      try {
        if (purchase.package && typeof purchase.package === "string") {
          const parsedPackage = JSON.parse(purchase.package)
          packageInfo =
            parsedPackage.selectType || parsedPackage.packageType || parsedPackage.name || "General Admission"
        } else if (purchase.package && typeof purchase.package === "object") {
          packageInfo =
            purchase.package.selectType || purchase.package.packageType || purchase.package.name || "General Admission"
        }
      } catch (e) {
        console.warn("Could not parse package info:", purchase.package)
        packageInfo = purchase.package || "General Admission"
      }

      // Create individual tickets for each delegate
      delegates.forEach((delegate, delegateIndex) => {
        const ticket = {
          id: `${purchase.purchase_id}-${delegateIndex}`,
          purchaseId: purchase.purchase_id,
          eventId: purchase.event_id,
          eventName: purchase.event_name || eventGroup.eventName,
          eventDate: purchase.event_date || eventGroup.eventDate,
          eventLocation: purchase.location || eventGroup.eventLocation,
          eventImage: purchase.file_url || purchase.coverimage || eventGroup.eventImage,
          ticketType: packageInfo,
          price: Number.parseFloat(purchase.amount || 0) / delegates.length, // Divide price by number of delegates
          status: purchase.purchase_status || "Active",
          purchaseDate: purchase.created_at || purchase.purchase_date,
          delegate: {
            name: delegate.name || "N/A",
            surname: delegate.surname || "",
            email: delegate.email || "N/A",
            phone: delegate.phone || delegate.cellnumber || "N/A",
            institution: delegate.institution || "N/A",
          },
          qrCode: `QR-${purchase.purchase_id}-${delegateIndex}`,
          barcode: `BC-${purchase.purchase_id}-${delegateIndex}`,
          originalPurchase: purchase,
          delegateIndex: delegateIndex,
          totalDelegates: delegates.length,
        }

        console.log(`Created ticket ${delegateIndex} for purchase ${purchase.purchase_id}:`, ticket)
        processedTickets.push(ticket)
      })
    })

    console.log("Final processed tickets being passed to TicketsList:", processedTickets)
    console.log("Number of processed tickets:", processedTickets.length)
    return processedTickets
  }

  const handleViewTickets = (eventGroup) => {
    console.log("ReviewPurchase - Navigating to tickets list for event:", eventGroup)

    // Process the tickets for this event
    const processedTickets = processTicketsForEvent(eventGroup)

    const navigationState = {
      eventInfo: {
        eventId: eventGroup.eventId,
        eventName: eventGroup.eventName,
        eventDate: eventGroup.eventDate,
        eventLocation: eventGroup.eventLocation,
        eventImage: eventGroup.eventImage,
      },
      tickets: processedTickets,
      originalData: { purchases },
    }

    console.log("About to navigate with tickets:", processedTickets)
    console.log("Navigation state being passed:", navigationState)

    navigate("/ticketslist", {
      state: navigationState,
    })
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
        `}
      </style>
    </div>
  )
}

export default ReviewPurchase
