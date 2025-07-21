"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { FaSearch, FaEye, FaCalendarAlt, FaArrowLeft, FaSignOutAlt, FaTicketAlt } from "react-icons/fa"

const ParchasedTicketNew = () => {
  const nav = useNavigate()
  const location = useLocation()
  const [ticketData, setTicketData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [eventInfo, setEventInfo] = useState(null)

  // Get event data from navigation state
  const eventData = location.state || {}
  const { eventId, eventName, fromPage } = eventData

  console.log("ParchasedTicketNew - Event Data:", eventData)
  console.log("ParchasedTicketNew - Event ID:", eventId)
  console.log("ParchasedTicketNew - Event Name:", eventName)
  console.log("ParchasedTicketNew - From Page:", fromPage)

  // Helper function to format price
  const formatPrice = (price) => {
    if (price === "N/A" || price === undefined || price === null) return "N/A"
    const numPrice = Number.parseFloat(price)
    return isNaN(numPrice) ? "N/A" : `R ${numPrice.toFixed(2)}`
  }

  // Handle viewing ticket details
  const handleViewDetails = (ticket) => {
    console.log("ParchasedTicketNew - Viewing ticket details:", ticket)

    // Prepare comprehensive ticket data for the view-more-details page
    const ticketDetailsData = {
      // Basic ticket information
      ticketId: ticket.id,
      purchaseId: ticket.purchaseId,
      eventId: ticket.eventId,
      eventName: ticket.eventName,

      // Package and pricing information
      packageName: ticket.ticketType,
      amount: ticket.amount,
      tickets: ticket.numberOfTickets,

      // Delegate details - format as expected by ViewMoreDetailsCompact
      delegateDetails: [
        {
          title: ticket.title || "",
          name: ticket.name,
          email: ticket.email,
          phone: ticket.phone,
          gender: ticket.gender,
          delegation: ticket.delegation,
          ieeeNumber: ticket.ieeeNumber,
          dayPass: ticket.dayPass,
          amount: ticket.amount,
        },
      ],

      // Additional ticket information
      ticketType: ticket.ticketType,
      purchaseDate: ticket.purchaseDate,
      status: ticket.status,
      ticketNumber: ticket.ticketNumber,

      // Event information from eventInfo state
      eventLocation: eventInfo?.location || "",
      eventVenue: eventInfo?.venue || "",
      eventStartDate: eventInfo?.startDate || "",
      eventEndDate: eventInfo?.endDate || "",
      eventTime: eventInfo?.startTime || "",

      // Pass the original delegate details object as well
      originalDelegateDetails: ticket.delegateDetails,

      // Add navigation breadcrumb
      fromPage: "parchasedticket",
      parentEventData: eventData,
    }

    console.log("ParchasedTicketNew - Navigating with data:", ticketDetailsData)

    nav("/view-more-details", {
      state: ticketDetailsData,
    })
  }

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("userInfo")
    sessionStorage.removeItem("user")
    sessionStorage.removeItem("userId")
    nav("/")
  }

  // Handle back navigation
  const handleBackNavigation = () => {
    if (fromPage === "reviewpurchase") {
      nav("/reviewparchase")
    } else {
      nav("/reviewparchase")
    }
  }

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get user ID from session storage - check multiple possible keys
        let currentUserId = null

        // Try different session storage keys
        const userInfo = sessionStorage.getItem("userInfo")
        const user = sessionStorage.getItem("user")
        const userId = sessionStorage.getItem("userId")

        if (userInfo) {
          try {
            const parsedInfo = JSON.parse(userInfo)
            currentUserId = parsedInfo.userId || parsedInfo.user_id || parsedInfo.id
          } catch (e) {
            console.error("Error parsing userInfo:", e)
          }
        }

        if (!currentUserId && user) {
          try {
            const parsedUser = JSON.parse(user)
            currentUserId = parsedUser.userId || parsedUser.user_id || parsedUser.id
          } catch (e) {
            console.error("Error parsing user:", e)
          }
        }

        if (!currentUserId && userId) {
          currentUserId = userId
        }

        console.log("ParchasedTicketNew - Current User ID:", currentUserId)

        const token = sessionStorage.getItem("token")

        if (!token) {
          setError("No authentication token found")
          nav("/")
          return
        }

        if (!currentUserId) {
          setError("User not authenticated")
          return
        }

        if (!eventId) {
          setError("Event information is missing")
          return
        }

        // Fetch user ticket purchases
        const apiUrl = `http://localhost:5000/api/user-ticket-purchases/${currentUserId}`
        console.log("ParchasedTicketNew - Fetching from:", apiUrl)

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} - ${response.statusText}`)
        }

        const rawData = await response.json()
        console.log("ParchasedTicketNew - Raw API Response:", rawData)

        if (!Array.isArray(rawData)) {
          setError("Invalid data format received from server")
          setTicketData([])
          return
        }

        // Filter tickets for the specific event and approved status
        const eventTickets = rawData.filter((purchase) => {
          const matchesEvent = purchase.event_id?.toString() === eventId?.toString()
          const isApproved = purchase.purchase_status?.toLowerCase() === "approved"
          console.log(
            `ParchasedTicketNew - Purchase ${purchase.purchase_id}: Event match: ${matchesEvent}, Approved: ${isApproved}, Event ID: ${purchase.event_id}, Status: ${purchase.purchase_status}`,
          )
          return matchesEvent && isApproved
        })

        console.log(`ParchasedTicketNew - Found ${eventTickets.length} approved tickets for event ${eventId}`)

        if (eventTickets.length === 0) {
          console.log("ParchasedTicketNew - No tickets found, setting empty state")
          setTicketData([])
          setEventInfo(null)
          return
        }

        // Process tickets - extract individual delegates from each purchase
        const processedTickets = []
        const seenTickets = new Set() // To prevent duplicates

        eventTickets.forEach((purchase, purchaseIndex) => {
          console.log(`ParchasedTicketNew - Processing purchase ${purchaseIndex + 1}:`, purchase)

          try {
            // Parse delegate_details JSONB
            let delegateDetails = {}
            if (purchase.delegate_details) {
              if (typeof purchase.delegate_details === "string") {
                delegateDetails = JSON.parse(purchase.delegate_details)
              } else {
                delegateDetails = purchase.delegate_details
              }
            }

            console.log("ParchasedTicketNew - Parsed delegate details:", delegateDetails)

            // Handle both array and single object formats
            const delegates = Array.isArray(delegateDetails) ? delegateDetails : [delegateDetails]

            delegates.forEach((delegate, delegateIndex) => {
              // Create unique identifier to prevent duplicates
              const uniqueId = `${purchase.purchase_id}-${delegateIndex}-${delegate.email || delegate.name || Math.random()}`

              if (seenTickets.has(uniqueId)) {
                console.log("ParchasedTicketNew - Skipping duplicate ticket:", uniqueId)
                return
              }

              seenTickets.add(uniqueId)

              const processedTicket = {
                id: uniqueId,
                purchaseId: purchase.purchase_id,
                eventId: purchase.event_id,
                eventName: purchase.event_name || eventName || "Event",
                ticketType: purchase.package || "General",
                status: purchase.purchase_status,
                amount: delegate.amount || purchase.amount || 0,
                numberOfTickets: 1,
                purchaseDate: purchase.purchase_date
                  ? new Date(purchase.purchase_date).toLocaleDateString()
                  : new Date().toLocaleDateString(),

                // Delegate information
                name: delegate.name || `${delegate.firstName || ""} ${delegate.lastName || ""}`.trim() || "Guest",
                email: delegate.email || "No email provided",
                phone: delegate.phone || "",
                title: delegate.title || "",
                gender: delegate.gender || "",
                dayPass: delegate.dayPass || "",
                delegation: delegate.delegation || "",
                ieeeNumber: delegate.ieeeNumber || "",
                ticketNumber: delegate.ticketNumber || `TKT-${purchase.purchase_id}-${delegateIndex + 1}`,

                // Store the original delegate details for passing to view page
                delegateDetails: delegate,

                // Store the original purchase data for reference
                originalPurchase: purchase,
              }

              console.log(`ParchasedTicketNew - Final processed ticket ${delegateIndex + 1}:`, processedTicket)
              processedTickets.push(processedTicket)
            })
          } catch (parseError) {
            console.error("ParchasedTicketNew - Error processing purchase:", parseError)
          }
        })

        console.log("ParchasedTicketNew - All processed tickets:", processedTickets)
        console.log("ParchasedTicketNew - Setting ticket data with", processedTickets.length, "tickets")
        setTicketData(processedTickets)

        // Set event info with additional details from the first purchase
        if (processedTickets.length > 0) {
          const totalAmount = processedTickets.reduce((sum, ticket) => sum + (Number.parseFloat(ticket.amount) || 0), 0)
          const totalTickets = processedTickets.length
          const firstPurchase = processedTickets[0].originalPurchase

          const eventInfoData = {
            eventName: processedTickets[0].eventName,
            eventId: processedTickets[0].eventId,
            totalTickets: totalTickets,
            totalAmount: totalAmount,
            // Add additional event details if available
            location: firstPurchase?.event_location || "",
            venue: firstPurchase?.event_venue || "",
            startDate: firstPurchase?.event_start_date || "",
            endDate: firstPurchase?.event_end_date || "",
            startTime: firstPurchase?.event_start_time || "",
          }

          console.log("ParchasedTicketNew - Setting event info:", eventInfoData)
          setEventInfo(eventInfoData)
        }
      } catch (err) {
        console.error("ParchasedTicketNew - Fetch error:", err)
        setError(`Failed to load tickets: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchTicketData()
  }, [eventId, eventName, nav])

  // Filter tickets based on search term
  const filteredTickets = ticketData.filter((ticket) => {
    if (!searchTerm.trim()) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      ticket.name.toLowerCase().includes(searchLower) ||
      ticket.email.toLowerCase().includes(searchLower) ||
      ticket.purchaseId.toString().includes(searchLower)
    )
  })

  console.log("ParchasedTicketNew - Current state:", {
    loading,
    error,
    ticketDataLength: ticketData.length,
    filteredTicketsLength: filteredTickets.length,
    eventInfo,
  })

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
              onClick={handleBackNavigation}
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
        <div style={{ marginBottom: "20px" }}>
          <h1
            style={{
              fontSize: "1.5rem",
              color: "#2c3e50",
              margin: "0 0 5px 0",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <FaTicketAlt /> Your Purchased Tickets
          </h1>
          <p
            style={{
              margin: "0",
              color: "#6c757d",
              fontSize: "0.9rem",
            }}
          >
            View and manage your approved event tickets
          </p>
        </div>

        {/* Event Info Card */}
        {eventInfo && (
          <div
            style={{
              background: "linear-gradient(135deg, #2c3e50, #4ca1af)",
              color: "white",
              marginBottom: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "20px" }}>
              <h2
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "1.3rem",
                  fontWeight: "600",
                  color: "white", // Ensure event name is white
                }}
              >
                {eventInfo.eventName}
              </h2>
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  fontSize: "0.9rem",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <FaCalendarAlt />
                  {ticketData[0]?.purchaseDate || "Date not available"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <FaTicketAlt />
                  {eventInfo.totalTickets} {eventInfo.totalTickets === 1 ? "ticket" : "tickets"}
                </span>
                <span>Total: {formatPrice(eventInfo.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            overflow: "hidden",
            marginBottom: "20px",
          }}
        >
          <div style={{ padding: "15px" }}>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <FaSearch
                style={{
                  position: "absolute",
                  left: "15px",
                  color: "#6c757d",
                }}
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                style={{
                  width: "100%",
                  padding: "10px 15px 10px 45px",
                  border: "1px solid #ced4da",
                  borderRadius: "25px",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              padding: "40px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#4ca1af", margin: "0", fontSize: "1.1rem" }}>Loading your tickets...</p>
          </div>
        ) : error ? (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              padding: "40px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#e74c3c", marginBottom: "10px", fontSize: "1.1rem" }}>Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: "#4ca1af",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        ) : filteredTickets.length > 0 ? (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.9rem",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        backgroundColor: "#f8f9fa",
                        color: "#495057",
                        fontWeight: "600",
                        textAlign: "left",
                        padding: "15px 20px",
                        borderBottom: "2px solid #e9ecef",
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        backgroundColor: "#f8f9fa",
                        color: "#495057",
                        fontWeight: "600",
                        textAlign: "left",
                        padding: "15px 20px",
                        borderBottom: "2px solid #e9ecef",
                      }}
                    >
                      Email
                    </th>
                    <th
                      style={{
                        backgroundColor: "#f8f9fa",
                        color: "#495057",
                        fontWeight: "600",
                        textAlign: "left",
                        padding: "15px 20px",
                        borderBottom: "2px solid #e9ecef",
                      }}
                    >
                      Package
                    </th>
                    <th
                      style={{
                        backgroundColor: "#f8f9fa",
                        color: "#495057",
                        fontWeight: "600",
                        textAlign: "left",
                        padding: "15px 20px",
                        borderBottom: "2px solid #e9ecef",
                      }}
                    >
                      Amount
                    </th>
                    <th
                      style={{
                        backgroundColor: "#f8f9fa",
                        color: "#495057",
                        fontWeight: "600",
                        textAlign: "left",
                        padding: "15px 20px",
                        borderBottom: "2px solid #e9ecef",
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        backgroundColor: "#f8f9fa",
                        color: "#495057",
                        fontWeight: "600",
                        textAlign: "left",
                        padding: "15px 20px",
                        borderBottom: "2px solid #e9ecef",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td
                        style={{
                          padding: "15px 20px",
                          color: "#495057",
                          fontWeight: "500",
                        }}
                      >
                        {ticket.name}
                      </td>
                      <td
                        style={{
                          padding: "15px 20px",
                          color: "#6b7280",
                        }}
                      >
                        {ticket.email}
                      </td>
                      <td
                        style={{
                          padding: "15px 20px",
                          color: "#495057",
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: "#e9f7fe",
                            color: "#2c3e50",
                            padding: "5px 10px",
                            borderRadius: "20px",
                            fontSize: "0.8rem",
                            fontWeight: "500",
                            display: "inline-block",
                          }}
                        >
                          {ticket.ticketType}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "15px 20px",
                          color: "#495057",
                          fontWeight: "500",
                        }}
                      >
                        {formatPrice(ticket.amount)}
                      </td>
                      <td
                        style={{
                          padding: "15px 20px",
                          color: "#6b7280",
                        }}
                      >
                        {ticket.purchaseDate}
                      </td>
                      <td
                        style={{
                          padding: "15px 20px",
                          color: "#495057",
                        }}
                      >
                        <button
                          onClick={() => handleViewDetails(ticket)}
                          style={{
                            backgroundColor: "#4ca1af",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            fontWeight: "500",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <FaEye /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              padding: "40px",
              textAlign: "center",
            }}
          >
            <FaTicketAlt size={48} color="#e5e7eb" style={{ marginBottom: "20px" }} />
            <h3 style={{ color: "#374151", margin: "0 0 10px 0", fontSize: "1.2rem" }}>No Tickets Found</h3>
            <p style={{ color: "#6b7280", margin: "0 0 20px 0" }}>
              {searchTerm
                ? "No tickets match your search criteria."
                : "You don't have any approved tickets for this event yet."}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: "#4ca1af",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Refresh Page
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default ParchasedTicketNew
