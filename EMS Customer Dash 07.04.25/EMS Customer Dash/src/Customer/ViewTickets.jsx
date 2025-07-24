"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { FaArrowLeft, FaSignOutAlt, FaUser, FaEnvelope, FaPhone, FaDownload } from "react-icons/fa"
import "../shared/ModernDashboard.css"

const ViewTickets = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generatingTicket, setGeneratingTicket] = useState(false)

  useEffect(() => {
    try {
      const { ticket: ticketData } = location.state || {}
      console.log("ViewTickets - Received state:", location.state)

      if (!ticketData) {
        console.error("No ticket data found")
        navigate("/ticketslist")
        return
      }

      setTicket(ticketData)
    } catch (error) {
      console.error("Error processing ticket data:", error)
      navigate("/ticketslist")
    } finally {
      setLoading(false)
    }
  }, [location.state, navigate])

  const handleBackToList = () => {
    navigate("/ticketslist", { state: location.state?.originalData })
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
    if (price === null || price === undefined || price === "N/A") return "R 0.00"

    if (typeof price === "string") {
      const cleanPrice = price.replace(/[R\s,]/g, "").replace(/[^\d.]/g, "")
      const numPrice = Number.parseFloat(cleanPrice)
      return isNaN(numPrice) ? "R 0.00" : `R ${numPrice.toFixed(2)}`
    }

    const numPrice = Number.parseFloat(price)
    return isNaN(numPrice) ? "R 0.00" : `R ${numPrice.toFixed(2)}`
  }

  const getEventImageUrl = (eventImage) => {
    if (!eventImage) return "/placeholder.svg?height=300&width=600"

    if (eventImage.startsWith("http://") || eventImage.startsWith("https://")) {
      return eventImage
    }

    return `http://localhost:5000${eventImage.startsWith("/") ? "" : "/"}${eventImage}`
  }

  const handleDownloadTicket = async () => {
    setGeneratingTicket(true)

    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import("jspdf")

      // Create new PDF document in landscape orientation
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // White background
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 0, pageWidth, pageHeight, "F")

      // Teal header section - full width
      const headerHeight = 35
      doc.setFillColor(76, 161, 175) // Teal color
      doc.rect(0, 0, pageWidth, headerHeight, "F")

      // Decorative circles in header
      doc.setFillColor(44, 62, 80) // Dark circles
      doc.circle(25, headerHeight / 2, 10, "F") // Left circle
      doc.circle(pageWidth - 25, headerHeight / 2, 10, "F") // Right circle

      // E-TICKET title
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(28)
      doc.setFont("helvetica", "bold")
      doc.text("E-TICKET", pageWidth / 2, 15, { align: "center" })

      // Ticket ID
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Ticket ID: ${ticket.id}`, pageWidth / 2, 25, { align: "center" })

      // Main content area - split into left and right sections
      let currentY = headerHeight + 15

      // Event name - centered
      doc.setTextColor(44, 62, 80)
      doc.setFontSize(22)
      doc.setFont("helvetica", "bold")
      const eventNameLines = doc.splitTextToSize(ticket.eventName, pageWidth - 40)
      doc.text(eventNameLines, pageWidth / 2, currentY, { align: "center" })
      currentY += eventNameLines.length * 8 + 15

      // Left section - Event Details and Attendee Info
      const leftSectionWidth = pageWidth * 0.6 - 30
      const rightSectionX = pageWidth * 0.6 + 10

      // Event Details Box
      const boxHeight = 45
      doc.setDrawColor(76, 161, 175)
      doc.setLineWidth(2)
      doc.roundedRect(20, currentY, leftSectionWidth, boxHeight, 8, 8, "S")

      // Light blue background
      doc.setFillColor(240, 248, 255)
      doc.roundedRect(20, currentY, leftSectionWidth, boxHeight, 8, 8, "F")

      // Redraw border on top
      doc.setDrawColor(76, 161, 175)
      doc.setLineWidth(2)
      doc.roundedRect(20, currentY, leftSectionWidth, boxHeight, 8, 8, "S")

      // EVENT DETAILS header
      doc.setTextColor(76, 161, 175)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("EVENT DETAILS", 25, currentY + 10)

      // Event details content
      doc.setTextColor(44, 62, 80)
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")

      const eventDate = ticket.eventDate
        ? new Date(ticket.eventDate).toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "Date TBA"

      doc.text(`Date: ${eventDate}`, 25, currentY + 18)
      doc.text(`Location: ${ticket.eventLocation || "Location TBA"}`, 25, currentY + 26)
      doc.text(`Ticket Type: ${ticket.ticketType}`, 25, currentY + 34)

      // Attendee Information Box - below event details
      const attendeeBoxY = currentY + boxHeight + 10
      doc.setDrawColor(245, 158, 11)
      doc.setLineWidth(2)
      doc.roundedRect(20, attendeeBoxY, leftSectionWidth, 35, 8, 8, "S")

      // Light yellow background
      doc.setFillColor(254, 249, 195)
      doc.roundedRect(20, attendeeBoxY, leftSectionWidth, 35, 8, 8, "F")

      // Redraw border on top
      doc.setDrawColor(245, 158, 11)
      doc.setLineWidth(2)
      doc.roundedRect(20, attendeeBoxY, leftSectionWidth, 35, 8, 8, "S")

      // ATTENDEE INFORMATION header
      doc.setTextColor(245, 158, 11)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("ATTENDEE INFORMATION", 25, attendeeBoxY + 10)

      // Attendee details
      doc.setTextColor(44, 62, 80)
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")

      const attendeeName = `${ticket.delegate.name} ${ticket.delegate.surname}`.trim() || "Guest Attendee"
      doc.text(`Name: ${attendeeName}`, 25, attendeeBoxY + 18)
      doc.text(`Email: ${ticket.delegate.email}`, 25, attendeeBoxY + 26)
      if (ticket.delegate.phone) {
        doc.text(`Phone: ${ticket.delegate.phone}`, 25, attendeeBoxY + 34)
      }

      // Important notice section
      const noticeY = attendeeBoxY + 45
      doc.setFillColor(254, 226, 226) // Light red background
      doc.roundedRect(20, noticeY, leftSectionWidth, 20, 5, 5, "F")
      doc.setDrawColor(239, 68, 68)
      doc.setLineWidth(1)
      doc.roundedRect(20, noticeY, leftSectionWidth, 20, 5, 5, "S")

      doc.setTextColor(185, 28, 28)
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text("IMPORTANT:", 25, noticeY + 8)
      doc.setFont("helvetica", "normal")
      doc.text("Present this ticket and valid ID at event entrance.", 25, noticeY + 15)

      // Right section - QR Code and Barcode
      const rightSectionWidth = pageWidth - rightSectionX - 20
      const qrSize = 70 // Reduced from 100 to 70
      const qrX = rightSectionX + (rightSectionWidth - qrSize) / 2
      const qrY = currentY + 10

      // QR Code border
      doc.setDrawColor(44, 62, 80)
      doc.setLineWidth(3)
      doc.roundedRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 12, 12, "S")

      // QR Code background
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 8, 8, "F")

      // Generate QR code pattern
      const qrPatternSize = 60 // Reduced from 90 to 60
      const qrPatternX = qrX + (qrSize - qrPatternSize) / 2
      const cellSize = qrPatternSize / 25

      // Create QR code pattern
      for (let i = 0; i < 25; i++) {
        for (let j = 0; j < 25; j++) {
          // Create finder patterns (corners)
          const isFinderPattern = (i < 7 && j < 7) || (i < 7 && j > 17) || (i > 17 && j < 7)
          // Create timing patterns
          const isTimingPattern = i === 6 || j === 6
          // Random data pattern
          const isDataPattern = Math.random() > 0.5

          const shouldFill = isFinderPattern || isTimingPattern || isDataPattern

          if (shouldFill) {
            doc.setFillColor(44, 62, 80)
            doc.rect(qrPatternX + i * cellSize, qrY + j * cellSize, cellSize - 0.3, cellSize - 0.3, "F")
          }
        }
      }

      // Add finder pattern squares (QR code corners)
      const finderSize = 7 * cellSize
      const finderPositions = [
        [qrPatternX, qrY], // Top-left
        [qrPatternX + qrPatternSize - finderSize, qrY], // Top-right
        [qrPatternX, qrY + qrPatternSize - finderSize], // Bottom-left
      ]

      finderPositions.forEach(([x, y]) => {
        // Outer square
        doc.setFillColor(44, 62, 80)
        doc.rect(x, y, finderSize, finderSize, "F")
        // Inner white square
        doc.setFillColor(255, 255, 255)
        doc.rect(x + cellSize, y + cellSize, finderSize - 2 * cellSize, finderSize - 2 * cellSize, "F")
        // Center black square
        doc.setFillColor(44, 62, 80)
        doc.rect(x + 2 * cellSize, y + 2 * cellSize, finderSize - 4 * cellSize, finderSize - 4 * cellSize, "F")
      })

      // QR Code label
      doc.setTextColor(44, 62, 80)
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text("Scan for entry", qrX + qrSize / 2, qrY + qrSize + 15, { align: "center" })

      // Barcode section - positioned below QR code in right section
      const barcodeY = qrY + qrSize + 25
      const barcodeWidth = 80 // Reduced to fit in right section
      const barcodeX = rightSectionX + (rightSectionWidth - barcodeWidth) / 2

      doc.setFillColor(255, 255, 255)
      doc.rect(barcodeX - 5, barcodeY - 5, barcodeWidth + 10, 20, "F")
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(1)
      doc.rect(barcodeX - 5, barcodeY - 5, barcodeWidth + 10, 20, "S")

      // Generate barcode pattern
      for (let i = 0; i < 40; i++) {
        const barWidth = Math.random() > 0.5 ? 1.5 : 2.5
        const shouldFill = Math.random() > 0.3
        if (shouldFill) {
          doc.setFillColor(44, 62, 80)
          doc.rect(barcodeX + i * 2, barcodeY, barWidth, 12, "F")
        }
      }

      // Barcode number
      doc.setTextColor(107, 114, 128)
      doc.setFontSize(7)
      doc.setFont("helvetica", "normal")
      doc.text(ticket.barcode, barcodeX + barcodeWidth / 2, barcodeY + 18, { align: "center" })

      // Footer
      const footerY = pageHeight - 15

      doc.setTextColor(156, 163, 175)
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.text("Powered by XpressTicket", 20, footerY)

      const currentDate = new Date().toLocaleDateString("en-GB")
      doc.text(`Generated: ${currentDate}`, pageWidth - 20, footerY, { align: "right" })

      // Add decorative elements
      // Ticket stub perforations (left side)
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.5)
      for (let i = 10; i < pageHeight - 10; i += 3) {
        doc.line(15, i, 15, i + 1.5)
      }

      // Save the PDF
      const sanitizedName = attendeeName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "")
      const sanitizedEvent = ticket.eventName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "")
      doc.save(`${sanitizedEvent}_${sanitizedName}_Ticket.pdf`)
    } catch (error) {
      console.error("Error generating ticket PDF:", error)
      alert("Failed to generate ticket PDF. Please try again.")
    } finally {
      setGeneratingTicket(false)
    }
  }

  if (loading) {
    return (
      <div className="modern-dashboard-container">
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
          <p style={{ color: "#4ca1af", margin: "0", fontSize: "1.1rem" }}>Loading ticket...</p>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="modern-dashboard-container">
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
            padding: "60px",
            textAlign: "center",
          }}
        >
          <h3 style={{ color: "#dc2626", margin: "0 0 10px 0" }}>Ticket Not Found</h3>
          <p style={{ color: "#6b7280", margin: "0 0 20px 0" }}>The requested ticket could not be found.</p>
          <button
            onClick={handleBackToList}
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
            Back to Tickets
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="modern-dashboard-container">
      {/* Modern Header */}
      <header className="modern-header">
        <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="modern-logo" />
        <div className="modern-header-actions">
          <button className="modern-logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {/* Back Button */}
      <div className="modern-back-button-container">
        <button className="modern-back-btn" onClick={handleBackToList}>
          <FaArrowLeft /> Back to Tickets
        </button>
      </div>

      {/* Main Content */}
      <main
        style={{
          padding: "20px 15px",
          maxWidth: "900px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Ticket Display */}
        <div
          id="ticket-container"
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
            overflow: "hidden",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Header Section */}
          <div
            style={{
              background: "linear-gradient(135deg, #4ca1af 0%, #2c3e50 100%)",
              padding: "30px",
              color: "white",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative circles */}
            <div
              style={{
                position: "absolute",
                top: "-20px",
                right: "-20px",
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              }}
            ></div>
            <div
              style={{
                position: "absolute",
                bottom: "-30px",
                left: "-30px",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
              }}
            ></div>

            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <h1
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "2.2rem",
                      fontWeight: "700",
                      lineHeight: "1.2",
                    }}
                  >
                    {ticket.eventName}
                  </h1>
                  <div
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      display: "inline-block",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                  >
                    {ticket.ticketType}
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    textAlign: "center",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>E-TICKET</div>
                  <div style={{ fontSize: "0.7rem", opacity: 0.7 }}>#{ticket.id}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Event Image */}
          {ticket.eventImage && (
            <div style={{ height: "200px", overflow: "hidden" }}>
              <img
                src={getEventImageUrl(ticket.eventImage) || "/placeholder.svg"}
                alt={ticket.eventName}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                crossOrigin="anonymous"
                onError={(e) => {
                  e.target.style.display = "none"
                }}
              />
            </div>
          )}

          {/* Content Section */}
          <div style={{ padding: "40px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 200px",
                gap: "40px",
                alignItems: "start",
              }}
            >
              {/* Left Column - Event Details */}
              <div>
                {/* Event Date */}
                <div style={{ marginBottom: "25px" }}>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      color: "#4ca1af",
                      fontSize: "1rem",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    EVENT DATE
                  </h3>
                  <p
                    style={{
                      margin: "0",
                      color: "#374151",
                      fontSize: "1.1rem",
                      fontWeight: "500",
                    }}
                  >
                    {formatDate(ticket.eventDate)}
                  </p>
                </div>

                {/* Location */}
                <div style={{ marginBottom: "25px" }}>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      color: "#4ca1af",
                      fontSize: "1rem",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    LOCATION
                  </h3>
                  <p
                    style={{
                      margin: "0",
                      color: "#374151",
                      fontSize: "1.1rem",
                      fontWeight: "500",
                    }}
                  >
                    {ticket.eventLocation || "Location TBA"}
                  </p>
                </div>

                {/* Attendee Details */}
                <div style={{ marginBottom: "25px" }}>
                  <h3
                    style={{
                      margin: "0 0 15px 0",
                      color: "#4ca1af",
                      fontSize: "1rem",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    ATTENDEE DETAILS
                  </h3>
                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      padding: "20px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "10px",
                      }}
                    >
                      <FaUser style={{ color: "#4ca1af", fontSize: "1rem" }} />
                      <span
                        style={{
                          color: "#1f2937",
                          fontSize: "1.1rem",
                          fontWeight: "600",
                        }}
                      >
                        {`${ticket.delegate.name} ${ticket.delegate.surname}`.trim() || "Guest Attendee"}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "8px",
                      }}
                    >
                      <FaEnvelope style={{ color: "#6b7280", fontSize: "0.9rem" }} />
                      <span style={{ color: "#6b7280", fontSize: "0.95rem" }}>
                        {ticket.delegate.email || "No email provided"}
                      </span>
                    </div>
                    {ticket.delegate.phone && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <FaPhone style={{ color: "#6b7280", fontSize: "0.9rem" }} />
                        <span style={{ color: "#6b7280", fontSize: "0.95rem" }}>{ticket.delegate.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - QR Code and Barcode */}
              <div style={{ textAlign: "center" }}>
                {/* QR Code */}
                <div
                  style={{
                    backgroundColor: "white",
                    border: "3px solid #4ca1af",
                    borderRadius: "16px",
                    padding: "15px",
                    marginBottom: "15px",
                  }}
                >
                  <div
                    style={{
                      width: "120px", // Reduced from 150px
                      height: "120px", // Reduced from 150px
                      backgroundColor: "#f8fafc",
                      border: "2px solid #e2e8f0",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto",
                      position: "relative",
                    }}
                  >
                    {/* QR Code Pattern */}
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      {/* Generate QR code pattern */}
                      {Array.from({ length: 20 }, (_, i) =>
                        Array.from({ length: 20 }, (_, j) => {
                          const shouldFill =
                            (i < 7 && j < 7) || (i < 7 && j > 12) || (i > 12 && j < 7) || Math.random() > 0.5
                          return shouldFill ? (
                            <rect key={`${i}-${j}`} x={i * 5} y={j * 5} width="4.5" height="4.5" fill="#1f2937" />
                          ) : null
                        }),
                      )}
                    </svg>
                  </div>
                </div>
                <p
                  style={{
                    margin: "0 0 15px 0",
                    color: "#6b7280",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  SCAN AT ENTRANCE
                </p>

                {/* Barcode */}
                <div
                  style={{
                    backgroundColor: "white",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <svg width="140" height="30" viewBox="0 0 140 30">
                    {/* Generate barcode pattern */}
                    {Array.from({ length: 35 }, (_, i) => {
                      const width = Math.random() > 0.5 ? 2 : 3
                      const shouldFill = Math.random() > 0.3
                      return shouldFill ? (
                        <rect key={i} x={i * 4} y="3" width={width} height="24" fill="#1f2937" />
                      ) : null
                    })}
                  </svg>
                </div>
                <p
                  style={{
                    margin: "0",
                    color: "#9ca3af",
                    fontSize: "0.7rem",
                    fontFamily: "monospace",
                  }}
                >
                  {ticket.barcode}
                </p>
              </div>
            </div>

            {/* Important Information */}
            <div
              style={{
                marginTop: "40px",
                padding: "20px",
                backgroundColor: "#fef3c7",
                borderRadius: "12px",
                border: "1px solid #f59e0b",
              }}
            >
              <h4
                style={{
                  margin: "0 0 10px 0",
                  color: "#92400e",
                  fontSize: "1rem",
                  fontWeight: "600",
                }}
              >
                IMPORTANT
              </h4>
              <p
                style={{
                  margin: "0 0 8px 0",
                  color: "#92400e",
                  fontSize: "0.9rem",
                  lineHeight: "1.5",
                }}
              >
                Present this ticket at the event entrance. Keep this ticket safe and arrive 30 minutes early.
              </p>
              <p
                style={{
                  margin: "0",
                  color: "#92400e",
                  fontSize: "0.9rem",
                  lineHeight: "1.5",
                }}
              >
                This ticket is non-transferable and valid only for the named attendee. For support, contact
                XpressTicket.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              padding: "20px 40px",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ color: "#9ca3af", fontSize: "0.8rem" }}>
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </div>
            <div style={{ color: "#9ca3af", fontSize: "0.8rem" }}>Powered by XpressTicket</div>
          </div>
        </div>
        {/* Download Button */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            onClick={handleDownloadTicket}
            disabled={generatingTicket}
            style={{
              backgroundColor: generatingTicket ? "#9ca3af" : "#059669",
              color: "white",
              border: "none",
              padding: "15px 30px",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: generatingTicket ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              margin: "0 auto",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
              opacity: generatingTicket ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!generatingTicket) {
                e.target.style.backgroundColor = "#047857"
                e.target.style.transform = "translateY(-2px)"
                e.target.style.boxShadow = "0 6px 16px rgba(5, 150, 105, 0.4)"
              }
            }}
            onMouseLeave={(e) => {
              if (!generatingTicket) {
                e.target.style.backgroundColor = "#059669"
                e.target.style.transform = "translateY(0)"
                e.target.style.boxShadow = "0 4px 12px rgba(5, 150, 105, 0.3)"
              }
            }}
          >
            <FaDownload />
            {generatingTicket ? "Generating Ticket..." : "Download E-Ticket"}
          </button>
        </div>
      </main>

      {/* Loading Animation Styles */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @media (max-width: 768px) {
            #ticket-container > div:last-child > div:first-child {
              grid-template-columns: 1fr !important;
              gap: 30px !important;
            }
          }
        `}
      </style>
    </div>
  )
}

export default ViewTickets
