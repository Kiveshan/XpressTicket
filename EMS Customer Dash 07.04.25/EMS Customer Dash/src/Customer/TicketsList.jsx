"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  FaArrowLeft,
  FaSignOutAlt,
  FaEye,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaTicketAlt,
  FaDownload,
} from "react-icons/fa"

const TicketsList = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      setLoading(true)
      setError(null)

      // Get data from navigation state
      const { purchases, eventInfo } = location.state || {}

      console.log("TicketsList - Received state:", { purchases, eventInfo })

      if (!purchases || !Array.isArray(purchases)) {
        setError("No purchase data found")
        return
      }

      // Process purchases into individual tickets
      const processedTickets = []

      purchases.forEach((purchase) => {
        if (purchase.delegates && Array.isArray(purchase.delegates)) {
          purchase.delegates.forEach((delegate, index) => {
            const ticket = {
              id: `${purchase.id}-${index + 1}`,
              purchaseId: purchase.id,
              eventName: purchase.eventName || eventInfo?.eventName || "Event",
              eventDate: purchase.eventDate || eventInfo?.eventDate,
              eventLocation: purchase.eventLocation || eventInfo?.eventLocation,
              eventImage: purchase.eventImage || eventInfo?.eventImage,
              ticketType: purchase.ticketType || "General Admission",
              price: purchase.price || purchase.totalAmount || 0,
              status: purchase.status || "Active",
              purchaseDate: purchase.purchaseDate || purchase.createdAt,
              delegate: {
                name: delegate.name || "N/A",
                surname: delegate.surname || "N/A",
                email: delegate.email || "N/A",
                phone: delegate.phone || "N/A",
              },
              qrCode: `QR-${purchase.id}-${index + 1}-${Date.now()}`,
              barcode: `BC${purchase.id}${String(index + 1).padStart(3, "0")}`,
            }
            processedTickets.push(ticket)
          })
        } else {
          // Handle purchases without delegate array (fallback)
          const ticket = {
            id: purchase.id,
            purchaseId: purchase.id,
            eventName: purchase.eventName || eventInfo?.eventName || "Event",
            eventDate: purchase.eventDate || eventInfo?.eventDate,
            eventLocation: purchase.eventLocation || eventInfo?.eventLocation,
            eventImage: purchase.eventImage || eventInfo?.eventImage,
            ticketType: purchase.ticketType || "General Admission",
            price: purchase.price || purchase.totalAmount || 0,
            status: purchase.status || "Active",
            purchaseDate: purchase.purchaseDate || purchase.createdAt,
            delegate: {
              name: purchase.customerName || "N/A",
              surname: purchase.customerSurname || "N/A",
              email: purchase.customerEmail || "N/A",
              phone: purchase.customerPhone || "N/A",
            },
            qrCode: `QR-${purchase.id}-${Date.now()}`,
            barcode: `BC${purchase.id}000`,
          }
          processedTickets.push(ticket)
        }
      })

      console.log("TicketsList - Processed tickets:", processedTickets)
      setTickets(processedTickets)
    } catch (err) {
      console.error("Error processing tickets:", err)
      setError(`Failed to process tickets: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [location.state])

  const handleBackToReview = () => {
    navigate("/reviewparchase")
  }

  const handleViewTicket = (ticket) => {
    console.log("TicketsList - Viewing ticket:", ticket)
    navigate("/viewtickets", {
      state: {
        ticket,
        eventInfo: location.state?.eventInfo,
        originalData: location.state,
      },
    })
  }

  const handleViewInvoice = (ticket) => {
    console.log("TicketsList - Viewing invoice for ticket:", ticket)
    navigate("/invoice", {
      state: {
        eventId: ticket.purchaseId,
        eventName: ticket.eventName,
        eventDate: ticket.eventDate,
        eventLocation: ticket.eventLocation,
        eventImage: ticket.eventImage,
        eventPrice: formatPrice(ticket.price),
        ticketData: [
          {
            type: ticket.ticketType,
            name: ticket.delegate.name,
            surname: ticket.delegate.surname,
            email: ticket.delegate.email,
            phone: ticket.delegate.phone,
            quantity: 1,
            unitPrice: formatPrice(ticket.price),
            total: formatPrice(ticket.price),
          },
        ],
        delegateDetails: [ticket.delegate],
      },
    })
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
        year: "numeric",
        month: "short",
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

  const getEventImageUrl = (eventImage) => {
    if (!eventImage) return "/placeholder.svg?height=200&width=300"

    if (eventImage.startsWith("http://") || eventImage.startsWith("https://")) {
      return eventImage
    }

    return `http://localhost:5000${eventImage.startsWith("/") ? "" : "/"}${eventImage}`
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
          <p style={{ color: "#4ca1af", margin: "0", fontSize: "1.1rem" }}>Loading tickets...</p>
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
        </header>

        <div
          style={{
            padding: "20px 15px",
            maxWidth: "1200px",
            margin: "0 auto",
            width: "100%",
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
            <h3 style={{ color: "#dc2626", margin: "0 0 10px 0" }}>Error Loading Tickets</h3>
            <p style={{ color: "#6b7280", margin: "0 0 20px 0" }}>{error}</p>
            <button
              onClick={handleBackToReview}
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
              Back to Review
            </button>
          </div>
        </div>
      </div>
    )
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
              onClick={handleBackToReview}
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
              <FaArrowLeft /> Back to Review
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
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
            padding: "30px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              margin: "0 0 10px 0",
              color: "#2c3e50",
              fontSize: "2rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "15px",
            }}
          >
            <FaTicketAlt style={{ color: "#4ca1af" }} />
            Your Tickets
          </h1>
          <p style={{ margin: "0", color: "#6b7280", fontSize: "1.1rem" }}>
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} available
          </p>
        </div>

        {/* Tickets Grid */}
        {tickets.length === 0 ? (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
              padding: "60px",
              textAlign: "center",
            }}
          >
            <h3 style={{ color: "#6b7280", margin: "0 0 10px 0" }}>No Tickets Found</h3>
            <p style={{ color: "#9ca3af", margin: "0" }}>There are no tickets to display.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
              gap: "20px",
            }}
          >
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
                  overflow: "hidden",
                  border: "1px solid #e5e7eb",
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
                    height: "150px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <img
                    src={getEventImageUrl(ticket.eventImage) || "/placeholder.svg"}
                    alt={ticket.eventName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.src = "/placeholder.svg?height=150&width=350"
                    }}
                  />
                  {/* Status Badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      backgroundColor: "rgba(5, 150, 105, 0.9)",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    {ticket.status}
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ padding: "20px" }}>
                  {/* Event Name */}
                  <h3
                    style={{
                      margin: "0 0 15px 0",
                      color: "#2c3e50",
                      fontSize: "1.3rem",
                      fontWeight: "600",
                      lineHeight: "1.3",
                    }}
                  >
                    {ticket.eventName}
                  </h3>

                  {/* Event Details */}
                  <div style={{ marginBottom: "15px" }}>
                    {ticket.eventDate && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                          color: "#6b7280",
                          fontSize: "0.9rem",
                        }}
                      >
                        <FaCalendarAlt style={{ color: "#4ca1af", fontSize: "0.8rem" }} />
                        {formatDate(ticket.eventDate)}
                      </div>
                    )}

                    {ticket.eventLocation && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                          color: "#6b7280",
                          fontSize: "0.9rem",
                        }}
                      >
                        <FaMapMarkerAlt style={{ color: "#4ca1af", fontSize: "0.8rem" }} />
                        {ticket.eventLocation}
                      </div>
                    )}
                  </div>

                  {/* Delegate Info */}
                  <div
                    style={{
                      backgroundColor: "#f8f9fa",
                      padding: "12px",
                      borderRadius: "8px",
                      marginBottom: "15px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "5px",
                        color: "#374151",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                      }}
                    >
                      <FaUser style={{ color: "#4ca1af", fontSize: "0.8rem" }} />
                      {ticket.delegate.name} {ticket.delegate.surname}
                    </div>
                    <div style={{ color: "#6b7280", fontSize: "0.8rem" }}>{ticket.delegate.email}</div>
                  </div>

                  {/* Ticket Details */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "15px",
                      paddingTop: "10px",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <div>
                      <div style={{ color: "#6b7280", fontSize: "0.8rem" }}>Ticket Type</div>
                      <div style={{ color: "#374151", fontSize: "0.9rem", fontWeight: "500" }}>{ticket.ticketType}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#6b7280", fontSize: "0.8rem" }}>Price</div>
                      <div
                        style={{
                          color: "#059669",
                          fontSize: "1.1rem",
                          fontWeight: "600",
                        }}
                      >
                        {formatPrice(ticket.price)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      paddingTop: "10px",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <button
                      onClick={() => handleViewTicket(ticket)}
                      style={{
                        flex: "1",
                        backgroundColor: "#4ca1af",
                        color: "white",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "6px",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#3d8e9c"
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#4ca1af"
                      }}
                    >
                      <FaEye /> View
                    </button>

                    <button
                      onClick={() => handleViewInvoice(ticket)}
                      style={{
                        flex: "1",
                        backgroundColor: "#059669",
                        color: "white",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "6px",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#047857"
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#059669"
                      }}
                    >
                      <FaDownload /> Invoice
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Loading Animation Styles */}
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

export default TicketsList
