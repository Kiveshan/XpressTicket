"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  FaArrowLeft,
  FaSignOutAlt,
  FaTicketAlt,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaFileInvoice,
  FaEye,
} from "react-icons/fa"

const TicketsList = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [tickets, setTickets] = useState([])
  const [eventInfo, setEventInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      const { eventInfo: eventData, tickets: ticketsData } = location.state || {}

      console.log("TicketsList - Received state:", location.state)

      if (!ticketsData || !Array.isArray(ticketsData)) {
        setError("No ticket data found")
        return
      }

      setEventInfo(eventData)
      setTickets(ticketsData)
      console.log("TicketsList - Processed tickets:", ticketsData)
    } catch (err) {
      console.error("Error processing ticket data:", err)
      setError("Failed to process ticket data")
    } finally {
      setLoading(false)
    }
  }, [location.state])

  const handleViewTicket = (ticket) => {
    console.log("TicketsList - Viewing ticket:", ticket)
    navigate("/viewtickets", {
      state: {
        ticket: ticket,
        eventInfo: eventInfo,
        originalData: location.state?.originalData,
      },
    })
  }

  const handleViewInvoice = (ticket) => {
    console.log("TicketsList - Viewing invoice for ticket:", ticket)
    navigate("/invoice", {
      state: {
        ticket: ticket,
        eventInfo: eventInfo,
        originalData: location.state?.originalData,
      },
    })
  }

  const handleBackToPurchases = () => {
    navigate("/reviewpurchase", {
      state: location.state?.originalData || {},
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

  const getEventImageUrl = (eventImage) => {
    if (!eventImage) return "/placeholder.svg?height=200&width=400"

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

  if (error || tickets.length === 0) {
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
            <h3 style={{ color: "#dc2626", margin: "0 0 10px 0" }}>No Tickets Found</h3>
            <p style={{ color: "#6b7280", margin: "0 0 20px 0" }}>{error || "No tickets available"}</p>
            <button
              onClick={handleBackToPurchases}
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
              Go Back
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
              onClick={handleBackToPurchases}
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
              <FaArrowLeft /> Back to Purchases
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
        {/* Event Header */}
        {eventInfo && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
              padding: "20px",
              marginBottom: "30px",
              display: "flex",
              gap: "20px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "8px",
                backgroundImage: `url(${getEventImageUrl(eventInfo.eventImage)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: "1.8rem",
                  color: "#2c3e50",
                  margin: "0 0 10px 0",
                }}
              >
                {eventInfo.eventName || "Event"}
              </h1>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {eventInfo.eventDate && (
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
                    <span>{formatDate(eventInfo.eventDate)}</span>
                  </div>
                )}
                {eventInfo.eventLocation && (
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
                    <span>{eventInfo.eventLocation}</span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#6b7280", fontSize: "0.8rem", marginBottom: "5px" }}>Total Tickets</div>
              <div style={{ fontSize: "2rem", fontWeight: "600", color: "#4ca1af" }}>{tickets.length}</div>
            </div>
          </div>
        )}

        {/* Tickets Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
            gap: "25px",
          }}
        >
          {tickets.map((ticket, index) => (
            <div
              key={`${ticket.id}-${index}`}
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
              <div
                style={{
                  background: "linear-gradient(135deg, #4ca1af, #2c3e50)",
                  color: "white",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <FaTicketAlt style={{ fontSize: "1.3rem" }} />
                    <h3 style={{ margin: "0", fontSize: "1.2rem", fontWeight: "600" }}>{ticket.ticketType}</h3>
                  </div>
                  <div
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      padding: "4px 12px",
                      borderRadius: "15px",
                      fontSize: "0.8rem",
                      fontWeight: "500",
                    }}
                  >
                    {ticket.status}
                  </div>
                </div>
                <p style={{ margin: "0", fontSize: "0.9rem", opacity: "0.9" }}>Ticket ID: {ticket.id}</p>
              </div>

              <div style={{ padding: "20px" }}>
                <div style={{ marginBottom: "20px" }}>
                  <h4
                    style={{
                      margin: "0 0 15px 0",
                      color: "#2c3e50",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FaUser style={{ color: "#4ca1af" }} />
                    Attendee Information
                  </h4>
                  <div style={{ paddingLeft: "24px" }}>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Name:</strong> {ticket.delegate?.name || "N/A"} {ticket.delegate?.surname || ""}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                        color: "#6b7280",
                      }}
                    >
                      <FaEnvelope style={{ color: "#4ca1af", fontSize: "0.9rem" }} />
                      <span>{ticket.delegate?.email || "N/A"}</span>
                    </div>
                    {ticket.delegate?.phone && ticket.delegate.phone !== "N/A" && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                          color: "#6b7280",
                        }}
                      >
                        <FaPhone style={{ color: "#4ca1af", fontSize: "0.9rem" }} />
                        <span>{ticket.delegate.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "15px",
                    borderTop: "1px solid #e5e7eb",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>Price</div>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "600",
                        color: "#059669",
                      }}
                    >
                      {formatPrice(ticket.price)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <button
                    onClick={() => handleViewTicket(ticket)}
                    style={{
                      flex: 1,
                      backgroundColor: "#4ca1af",
                      color: "white",
                      border: "none",
                      padding: "10px 15px",
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
                      e.target.style.backgroundColor = "#3d8b96"
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#4ca1af"
                    }}
                  >
                    <FaEye /> View Ticket
                  </button>
                  <button
                    onClick={() => handleViewInvoice(ticket)}
                    style={{
                      flex: 1,
                      backgroundColor: "#059669",
                      color: "white",
                      border: "none",
                      padding: "10px 15px",
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
                    <FaFileInvoice /> Invoice
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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

export default TicketsList
