"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { FaArrowLeft, FaSignOutAlt, FaCalendarAlt, FaUser, FaDownload, FaPrint, FaQrcode } from "react-icons/fa"
import "../shared/ModernDashboard.css"

const ViewTickets = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [ticket, setTicket] = useState(null)
  const [eventInfo, setEventInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      setLoading(true)
      setError(null)

      // Get data from navigation state
      const { ticket: ticketData, eventInfo: eventData } = location.state || {}

      console.log("ViewTickets - Received state:", { ticketData, eventData })

      if (!ticketData) {
        setError("No ticket data found")
        return
      }

      setTicket(ticketData)
      setEventInfo(eventData)
    } catch (err) {
      console.error("Error loading ticket data:", err)
      setError(`Failed to load ticket: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [location.state])

  const handleBackToTickets = () => {
    navigate(-1)
  }

  const handleDownloadPDF = () => {
    if (!ticket) return

    console.log("ViewTickets - Downloading PDF for ticket:", ticket)
    // This would typically generate and download a PDF
    alert(`Downloading PDF ticket for ${ticket.delegate.name} ${ticket.delegate.surname}`)
  }

  const handlePrint = () => {
    window.print()
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
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return "Date not available"
    }
  }

  const getEventImageUrl = (eventImage) => {
    if (!eventImage) return "/placeholder.svg?height=300&width=600"

    if (eventImage.startsWith("http://") || eventImage.startsWith("https://")) {
      return eventImage
    }

    return `http://localhost:5000${eventImage.startsWith("/") ? "" : "/"}${eventImage}`
  }

  const generateQRCodeUrl = (data) => {
    // Using a web-based QR code service
    const encodedData = encodeURIComponent(data)
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}`
  }

  const generateBarcodeUrl = (data) => {
    // Using a web-based barcode service
    const encodedData = encodeURIComponent(data)
    return `https://barcode.tec-it.com/barcode.ashx?data=${encodedData}&code=Code128&dpi=96&dataseparator=`
  }

  if (loading) {
    return (
      <div className="modern-dashboard-container">
        <div style={{ textAlign: "center" }}>
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
          <p style={{ color: "#4ca1af", margin: "0", fontSize: "1.1rem" }}>Loading ticket...</p>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="modern-dashboard-container">
        {/* Modern Header */}
        <header className="modern-header no-print">
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
        <div className="modern-back-button-container no-print">
          <button className="modern-back-btn" onClick={handleBackToTickets}>
            <FaArrowLeft /> Back
          </button>
        </div>

        <div
          style={{
            padding: "20px 15px",
            maxWidth: "400px",
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
            <h3 style={{ color: "#dc2626", margin: "0 0 10px 0" }}>Error Loading Ticket</h3>
            <p style={{ color: "#6b7280", margin: "0 0 20px 0" }}>{error || "Ticket not found"}</p>
            <button
              onClick={handleBackToTickets}
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
    <div className="modern-dashboard-container">
      {/* Modern Header */}
      <header className="modern-header no-print">
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

      {/* Back and Print Buttons */}
      <div className="modern-back-button-container no-print">
        <button className="modern-back-btn" onClick={handleBackToTickets}>
          <FaArrowLeft /> Back
        </button>
        <button className="modern-back-btn" onClick={handlePrint}>
          <FaPrint /> Print
        </button>
      </div>

      {/* Main Content */}
      <main
        style={{
          padding: "20px 15px",
          maxWidth: "800px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Ticket Card */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
            overflow: "hidden",
            marginBottom: "20px",
          }}
        >
          {/* Event Image */}
          {ticket.eventImage && (
            <div
              style={{
                height: "200px",
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
                  e.target.src = "/placeholder.svg?height=200&width=800"
                }}
              />
              {/* Ticket Status Badge */}
              <div
                style={{
                  position: "absolute",
                  top: "15px",
                  right: "15px",
                  backgroundColor: "rgba(5, 150, 105, 0.9)",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  backdropFilter: "blur(10px)",
                }}
              >
                {ticket.status}
              </div>
            </div>
          )}

          {/* Ticket Header */}
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
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "15px",
              }}
            >
              <div>
                <h1 style={{ margin: "0 0 5px 0", fontSize: "1.5rem" }}>{ticket.eventName}</h1>
                <p style={{ margin: "0", fontSize: "1rem", opacity: "0.9" }}>
                  Ticket #{ticket.id} - {ticket.ticketType}
                </p>
              </div>
              <div
                style={{
                  fontSize: "1.3rem",
                  fontWeight: "600",
                }}
              >
                {formatPrice(ticket.price)}
              </div>
            </div>
          </div>

          {/* Ticket Content */}
          <div style={{ padding: "30px" }}>
            {/* Delegate Information */}
            <div style={{ marginBottom: "30px" }}>
              <h3
                style={{
                  margin: "0 0 15px 0",
                  color: "#2c3e50",
                  fontSize: "1.2rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FaUser style={{ color: "#4ca1af" }} /> Delegate Information
              </h3>
              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "20px",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                }}
              >
                <div
                  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}
                >
                  <div>
                    <strong style={{ color: "#2c3e50" }}>Name:</strong>
                    <div style={{ marginTop: "5px", color: "#6b7280" }}>
                      {ticket.delegate.name} {ticket.delegate.surname}
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: "#2c3e50" }}>Email:</strong>
                    <div style={{ marginTop: "5px", color: "#6b7280" }}>{ticket.delegate.email}</div>
                  </div>
                  {ticket.delegate.phone !== "N/A" && (
                    <div>
                      <strong style={{ color: "#2c3e50" }}>Phone:</strong>
                      <div style={{ marginTop: "5px", color: "#6b7280" }}>{ticket.delegate.phone}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div style={{ marginBottom: "30px" }}>
              <h3
                style={{
                  margin: "0 0 15px 0",
                  color: "#2c3e50",
                  fontSize: "1.2rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FaCalendarAlt style={{ color: "#4ca1af" }} /> Event Details
              </h3>
              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "20px",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                }}
              >
                <div
                  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}
                >
                  {ticket.eventDate && (
                    <div>
                      <strong style={{ color: "#2c3e50" }}>Date & Time:</strong>
                      <div style={{ marginTop: "5px", color: "#6b7280" }}>{formatDate(ticket.eventDate)}</div>
                    </div>
                  )}
                  {ticket.eventLocation && (
                    <div>
                      <strong style={{ color: "#2c3e50" }}>Location:</strong>
                      <div style={{ marginTop: "5px", color: "#6b7280" }}>{ticket.eventLocation}</div>
                    </div>
                  )}
                  <div>
                    <strong style={{ color: "#2c3e50" }}>Purchase Date:</strong>
                    <div style={{ marginTop: "5px", color: "#6b7280" }}>{formatDate(ticket.purchaseDate)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code and Barcode */}
            <div style={{ marginBottom: "30px" }}>
              <h3
                style={{
                  margin: "0 0 15px 0",
                  color: "#2c3e50",
                  fontSize: "1.2rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FaQrcode style={{ color: "#4ca1af" }} /> Ticket Codes
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "20px",
                  backgroundColor: "#f8f9fa",
                  padding: "20px",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                }}
              >
                {/* QR Code */}
                <div style={{ textAlign: "center" }}>
                  <strong style={{ color: "#2c3e50", display: "block", marginBottom: "10px" }}>QR Code</strong>
                  <img
                    src={generateQRCodeUrl(ticket.qrCode) || "/placeholder.svg"}
                    alt="QR Code"
                    style={{
                      width: "150px",
                      height: "150px",
                      border: "1px solid #e9ecef",
                      borderRadius: "8px",
                      backgroundColor: "white",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none"
                      e.target.nextSibling.style.display = "block"
                    }}
                  />
                  <div
                    style={{
                      display: "none",
                      width: "150px",
                      height: "150px",
                      border: "1px solid #e9ecef",
                      borderRadius: "8px",
                      backgroundColor: "white",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#6b7280",
                      fontSize: "0.9rem",
                      margin: "0 auto",
                    }}
                  >
                    QR Code
                  </div>
                  <div style={{ marginTop: "10px", fontSize: "0.8rem", color: "#6b7280" }}>{ticket.qrCode}</div>
                </div>

                {/* Barcode */}
                <div style={{ textAlign: "center" }}>
                  <strong style={{ color: "#2c3e50", display: "block", marginBottom: "10px" }}>Barcode</strong>
                  <img
                    src={generateBarcodeUrl(ticket.barcode) || "/placeholder.svg"}
                    alt="Barcode"
                    style={{
                      width: "200px",
                      height: "60px",
                      border: "1px solid #e9ecef",
                      borderRadius: "8px",
                      backgroundColor: "white",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none"
                      e.target.nextSibling.style.display = "block"
                    }}
                  />
                  <div
                    style={{
                      display: "none",
                      width: "200px",
                      height: "60px",
                      border: "1px solid #e9ecef",
                      borderRadius: "8px",
                      backgroundColor: "white",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#6b7280",
                      fontSize: "0.9rem",
                      margin: "0 auto",
                    }}
                  >
                    Barcode
                  </div>
                  <div style={{ marginTop: "10px", fontSize: "0.8rem", color: "#6b7280" }}>{ticket.barcode}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "15px",
                paddingTop: "20px",
                borderTop: "1px solid #e5e7eb",
              }}
              className="no-print"
            >
              <button
                onClick={handleDownloadPDF}
                style={{
                  backgroundColor: "#059669",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
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
                <FaDownload /> Download PDF
              </button>

              <button
                onClick={handlePrint}
                style={{
                  backgroundColor: "#4ca1af",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
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
                <FaPrint /> Print Ticket
              </button>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div
          style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "20px",
          }}
          className="no-print"
        >
          <h4 style={{ margin: "0 0 10px 0", color: "#856404" }}>Important Notice</h4>
          <p style={{ margin: "0", color: "#856404", fontSize: "0.9rem" }}>
            Please present this ticket (printed or on your mobile device) at the event entrance. Make sure the QR code
            is clearly visible for scanning.
          </p>
        </div>
      </main>

      {/* Print Styles */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @media print {
            .no-print {
              display: none !important;
            }
            
            body {
              background: white !important;
            }
            
            * {
              box-shadow: none !important;
            }
          }
        `}
      </style>
    </div>
  )
}

export default ViewTickets