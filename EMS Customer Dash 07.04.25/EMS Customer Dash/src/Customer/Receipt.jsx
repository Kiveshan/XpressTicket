"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { FaSignOutAlt, FaArrowLeft, FaDownload, FaCreditCard, FaCheck } from "react-icons/fa"
import "../shared/ModernDashboard.css"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const Receipt = () => {
  const nav = useNavigate()
  const location = useLocation()
  const receiptRef = useRef(null)
  // Track downloading state for each package separately
  const [isDownloading, setIsDownloading] = useState({})
  // Track payment status
  const [isPaid, setIsPaid] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState("")
  const [ticketIds, setTicketIds] = useState([]) // Store ticket IDs from the backend

  // Initialize purchase data from location state
  const [purchaseData, setPurchaseData] = useState({ event: {}, packages: [] })

  // Handle payment process
  const handlePayNow = async () => {
    if (!purchaseData || !purchaseData.packages || purchaseData.packages.length === 0) {
      alert("No ticket information available")
      return
    }

    try {
      setIsProcessingPayment(true)

      // Get token from session storage
      const token = sessionStorage.getItem("token")
      const userId = sessionStorage.getItem("userId")

      if (!token || !userId) {
        alert("Authentication required. Please log in again.")
        nav("/login")
        return
      }

      // Extract ticket IDs from the purchase data
      const ticketIdsToUpdate = purchaseData.packages.map((pkg) => pkg.ticketId).filter((id) => id)

      // Call the API to update ticket status to 'Approved'
      const response = await fetch("http://localhost:5000/api/update-ticket-status", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: Number.parseInt(userId),
          event_id: Number.parseInt(purchaseData.event.event_id),
          status: "Approved",
        }),
      })

      if (!response.ok) {
        throw new Error(`Payment failed: ${response.statusText}`)
      }

      const result = await response.json()

      // Set the ticket IDs from the response if available
      if (result.ticketIds) {
        setTicketIds(result.ticketIds)
      }

      // Show success message and reveal receipt
      setPaymentSuccessMessage("Payment successful! Your tickets are now approved.")
      setIsPaid(true)
    } catch (error) {
      console.error("Payment error:", error)
      alert(`Payment process failed: ${error.message}`)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Redirect if no data is present
  useEffect(() => {
    if (location.state?.purchaseData) {
      console.log("Receipt data received:", location.state.purchaseData)
      // Log the event object structure for debugging
      console.log("Event data structure:", location.state.purchaseData.event)
      setPurchaseData(location.state.purchaseData)
    } else {
      // If no data is passed, redirect back to dashboard
      console.log("No purchase data found, redirecting...")
      setTimeout(() => {
        nav("/customerdash")
      }, 1000)
    }
  }, [location, nav])

  // Calculate totals
  const [totals, setTotals] = useState({
    subtotal: 0,
    tax: 0,
    total: 0,
  })

  useEffect(() => {
    // Calculate totals from packages
    if (purchaseData.packages && purchaseData.packages.length > 0) {
      let subtotal = 0

      purchaseData.packages.forEach((pkg) => {
        // Extract numeric price from amount (remove R, spaces, commas)
        const priceStr = pkg.amount.replace(/[R\s,]/g, "")
        const price = Number.parseFloat(priceStr)
        if (!isNaN(price)) {
          subtotal += price
        }
      })

      // Calculate tax (15% VAT for South Africa)
      const tax = subtotal * 0.15
      const total = subtotal + tax

      setTotals({
        subtotal,
        tax,
        total,
      })
    }
  }, [purchaseData])

  // Format currency consistently
  const formatCurrency = (amount) => {
    return `R ${amount.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  // Helper function to fix duplicated URLs
  const fixImageUrl = (url) => {
    if (!url) return ""

    // Check if the URL has a duplicated base URL
    const s3BaseUrl = "https://xpressticket.s3.af-south-1.amazonaws.com/"

    if (url && url.includes(s3BaseUrl + s3BaseUrl)) {
      // Remove the duplicate base URL
      return url.replace(s3BaseUrl + s3BaseUrl, s3BaseUrl)
    }

    return url
  }

  // Format date helper functions (copied from ViewTickets)
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

  const formatTime = (dateString) => {
    if (!dateString) return "Time not available"
    try {
      return new Date(dateString).toLocaleTimeString("en-ZA", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return "Time not available"
    }
  }

  const formatPrice = (price) => {
    const numPrice = Number.parseFloat(price)
    return isNaN(numPrice) ? "R 0.00" : `R ${numPrice.toFixed(2)}`
  }

  const getQRCodeUrl = (data) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`
  }

  const getBarcodeUrl = (data) => {
    return `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(data)}&code=Code128&dpi=96&dataseparator=`
  }

  // Safe access to delegate information with fallbacks (copied from ViewTickets)
  const getDelegateInfo = (pkg) => {
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}")

    return {
      name: userInfo.name || "N/A",
      surname: userInfo.surname || "",
      email: userInfo.email || "N/A",
      phone: userInfo.phone || userInfo.cellnumber || "N/A",
    }
  }

  // Handle download ticket - EXACT COPY from ViewTickets.jsx handleDownloadPDF function
  const handleDownload = async (pkg, index) => {
    if (!purchaseData || !purchaseData.packages || purchaseData.packages.length === 0) {
      alert("No ticket information available")
      return
    }

    setIsDownloading((prev) => ({ ...prev, [index]: true }))

    try {
      // Create a new PDF document
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Set background color for the entire page
      doc.setFillColor(249, 250, 251) // Very light gray background
      doc.rect(0, 0, pageWidth, pageHeight, "F")

      // Add header bar
      doc.setFillColor(44, 62, 80) // #2c3e50 - dark blue
      doc.rect(0, 0, pageWidth, 25, "F")

      // Function to load image with promise
      const loadImage = (src) => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.onload = () => resolve(img)
          img.onerror = (e) => {
            console.error("Image failed to load:", e)
            reject(e)
          }
          img.src = src
        })
      }

      // Try to add logo
      try {
        const logoImg = await loadImage("/XPRESS TICKETS LOGO2.png")
        // Add logo to PDF header
        doc.addImage(logoImg, "PNG", 10, 5, 40, 15)
      } catch (logoErr) {
        console.error("Error loading logo:", logoErr)
        // Continue without logo
      }

      // Add ticket title in header
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(255, 255, 255) // White text for header
      doc.text("EVENT TICKET", pageWidth - 20, 15, { align: "right" })

      // Add ticket ID
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      const ticketId = `XPT-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}-${Date.now().toString().slice(-6)}`
      doc.text(`Ticket ID: ${ticketId}`, 20, 35)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 20, 35, { align: "right" })

      // Add event title
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(44, 62, 80) // #2c3e50 - dark blue
      const eventName = purchaseData.event?.name || "Event Name"
      doc.text(eventName, pageWidth / 2, 50, { align: "center" })

      // Add event details
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(73, 80, 87) // #495057 - dark gray

      let yPosition = 65
      const eventDate =
        purchaseData.event?.formattedDate ||
        purchaseData.event?.startdate ||
        purchaseData.event?.start_date ||
        purchaseData.event?.date
      const eventTime = purchaseData.event?.formattedTime || purchaseData.event?.time || purchaseData.event?.start_time
      const eventLocation = purchaseData.event?.location

      if (eventDate) {
        doc.text(`Date: ${formatDate(eventDate)} at ${formatTime(eventDate)}`, pageWidth / 2, yPosition, {
          align: "center",
        })
        yPosition += 8
      }
      if (eventLocation) {
        doc.text(`Location: ${eventLocation}`, pageWidth / 2, yPosition, { align: "center" })
        yPosition += 8
      }

      // Add line
      doc.setDrawColor(76, 161, 175) // #4ca1af - teal
      doc.setLineWidth(0.5)
      doc.line(20, yPosition + 5, pageWidth - 20, yPosition + 5)

      yPosition += 15

      // Add attendee information
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(44, 62, 80) // #2c3e50 - dark blue
      doc.text("ATTENDEE INFORMATION", 20, yPosition)

      yPosition += 10

      const delegateInfo = getDelegateInfo(pkg)

      // Create attendee table
      const attendeeData = [
        ["Full Name", `${delegateInfo.name} ${delegateInfo.surname}`],
        ["Email", delegateInfo.email],
        ["Phone", delegateInfo.phone !== "N/A" ? delegateInfo.phone : "Not provided"],
        ["Ticket Type", pkg.packageDetails || "Standard Package"],
        ["Price", pkg.amount || formatPrice(500)],
        ["Status", "Approved"],
      ]

      autoTable(doc, {
        body: attendeeData,
        startY: yPosition,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: "bold", fillColor: [248, 249, 250] },
          1: { cellWidth: "auto" },
        },
        margin: { left: 20, right: 20 },
      })

      yPosition = doc.lastAutoTable.finalY + 20

      // Add QR Code and Barcode section
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(44, 62, 80)
      doc.text("VERIFICATION CODES", 20, yPosition)

      yPosition += 15

      // Try to add QR Code
      try {
        const qrCodeUrl = getQRCodeUrl(ticketId)
        const qrImg = await loadImage(qrCodeUrl)
        doc.addImage(qrImg, "PNG", 30, yPosition, 40, 40)

        // QR Code label
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text("QR Code", 50, yPosition + 45, { align: "center" })
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        doc.text(ticketId, 50, yPosition + 50, { align: "center" })
      } catch (qrErr) {
        console.error("Error adding QR code:", qrErr)
        // Add text fallback
        doc.setFontSize(10)
        doc.text("QR Code:", 30, yPosition)
        doc.text(ticketId, 30, yPosition + 8)
      }

      // Try to add Barcode
      try {
        const barcodeUrl = getBarcodeUrl(ticketId)
        const barcodeImg = await loadImage(barcodeUrl)
        doc.addImage(barcodeImg, "PNG", 100, yPosition + 10, 80, 20)

        // Barcode label
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text("Barcode", 140, yPosition + 35, { align: "center" })
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        doc.text(ticketId, 140, yPosition + 40, { align: "center" })
      } catch (barcodeErr) {
        console.error("Error adding barcode:", barcodeErr)
        // Add text fallback
        doc.setFontSize(10)
        doc.text("Barcode:", 100, yPosition)
        doc.text(ticketId, 100, yPosition + 8)
      }

      yPosition += 60

      // Add important notes
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(44, 62, 80)
      doc.text("IMPORTANT NOTES", 20, yPosition)

      yPosition += 10

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(73, 80, 87)

      const notes = [
        "• Please present this ticket at the event entrance for admission.",
        "• This ticket is non-transferable and non-refundable.",
        "• Arrive at least 30 minutes before the event start time.",
        "• Keep this ticket safe and bring a valid ID for verification.",
        "• For support, contact us at support@xpresstickets.com",
      ]

      notes.forEach((note, index) => {
        doc.text(note, 20, yPosition + index * 6)
      })

      // Add footer
      doc.setFillColor(44, 62, 80) // #2c3e50 - dark blue
      doc.rect(0, pageHeight - 15, pageWidth, 15, "F")

      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(255, 255, 255) // White text for footer
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, pageHeight - 8)
      doc.text("Powered by XpressTicket", pageWidth - 10, pageHeight - 8, { align: "right" })

      // Save the PDF with sanitized filename
      try {
        const sanitizedEventName = eventName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "")
        const sanitizedAttendeeName = `${delegateInfo.name}_${delegateInfo.surname}`
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_]/g, "")
        doc.save(`${sanitizedEventName}_Ticket_${sanitizedAttendeeName}_${ticketId}.pdf`)
      } catch (error) {
        console.error("Error saving PDF with custom filename:", error)
        // Fallback to generic filename
        doc.save(`ticket_${ticketId}.pdf`)
      }

      setIsDownloading((prev) => ({ ...prev, [index]: false }))
    } catch (error) {
      console.error("Error generating PDF:", error)
      setIsDownloading((prev) => ({ ...prev, [index]: false }))
      alert("Error generating PDF. Please try again.")
    }
  }

  // Generate receipt date
  const receiptDate = new Date().toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Generate receipt number
  const receiptNumber = `XPT-${Date.now().toString().slice(-8)}`

  return (
    <div className="modern-dashboard-container" style={{ overflowX: "hidden" }}>
      {/* Modern Header */}
      <header className="modern-header no-print">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="modern-logo"
        />
        <div className="modern-header-actions">
          <button
            className="modern-logout-btn"
            onClick={() => {
              sessionStorage.removeItem("token")
              sessionStorage.removeItem("userId")
              sessionStorage.removeItem("userType")
              nav("/login")
            }}
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {/* Back Button */}
      <div className="modern-back-button-container no-print">
        <button className="modern-back-btn" onClick={() => nav("/customerdash")}>
          <FaArrowLeft /> Back to Dashboard
        </button>
      </div>

      {!isPaid ? (
        // Simple payment interface - shown before payment
        <div className="content-container">
          <div
            className="payment-container"
            style={{
              textAlign: "center",
              padding: "40px 20px",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              maxWidth: "600px",
              margin: "40px auto",
            }}
          >
            <h2 style={{ marginBottom: "20px", color: "#2c3e50" }}>Complete Your Purchase</h2>

            {/* Event Summary */}
            <div
              style={{
                marginBottom: "25px",
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                textAlign: "left",
              }}
            >
              <h3 style={{ fontSize: "18px", marginBottom: "15px" }}>{purchaseData.event?.name || "Event"}</h3>
              <div style={{ fontSize: "14px", color: "#495057" }}>
                <p style={{ margin: "5px 0" }}>
                  <strong>Location:</strong> {purchaseData.event?.location || "TBA"}
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Date:</strong>{" "}
                  {purchaseData.event?.formattedDate ||
                    purchaseData.event?.startdate ||
                    purchaseData.event?.start_date ||
                    purchaseData.event?.date ||
                    "TBA"}
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Time:</strong>{" "}
                  {purchaseData.event?.formattedTime ||
                    purchaseData.event?.time ||
                    purchaseData.event?.start_time ||
                    "TBA"}
                </p>
              </div>
            </div>

            {/* Package Summary */}
            <div style={{ marginBottom: "25px", textAlign: "left" }}>
              <h4 style={{ fontSize: "16px", marginBottom: "15px" }}>Your Tickets</h4>
              {purchaseData.packages.map((pkg, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "500" }}>{pkg.packageDetails}</div>
                    <div style={{ fontSize: "14px", color: "#6c757d" }}>Quantity: {pkg.tickets}</div>
                  </div>
                  <div style={{ fontWeight: "500" }}>{pkg.amount}</div>
                </div>
              ))}
            </div>

            {/* Total Amount */}
            <div
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#2c3e50",
                marginBottom: "30px",
                padding: "20px",
                backgroundColor: "#e9ecef",
                borderRadius: "8px",
              }}
            >
              Total: {formatCurrency(totals.total)}
            </div>

            {/* Pay Now Button */}
            <button
              className="pay-now-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "15px 40px",
                backgroundColor: isProcessingPayment ? "#cccccc" : "#4ca1af",
                background: isProcessingPayment ? "#cccccc" : "linear-gradient(135deg, #2c3e50, #4ca1af)",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "18px",
                fontWeight: "600",
                cursor: isProcessingPayment ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 3px 6px rgba(0,0,0,0.15)",
                minWidth: "200px",
              }}
              onClick={handlePayNow}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (
                <span>Processing...</span>
              ) : (
                <>
                  <FaCreditCard style={{ marginRight: "10px" }} />
                  Pay Now
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        // Detailed receipt card - shown after successful payment
        <div className="content-container">
          {paymentSuccessMessage && (
            <div
              style={{
                backgroundColor: "#d4edda",
                color: "#155724",
                padding: "15px 20px",
                borderRadius: "6px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <FaCheck style={{ marginRight: "10px" }} />
              {paymentSuccessMessage}
            </div>
          )}

          {/* Full Receipt Card */}
          <div
            className="payment-container"
            style={{
              textAlign: "center",
              padding: "40px 20px",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              maxWidth: "600px",
              margin: "40px auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#6c757d",
                    margin: "0",
                  }}
                >
                  Receipt from
                </p>
                <h2
                  style={{
                    fontSize: "18px",
                    color: "#2c3e50",
                    margin: "4px 0 0 0",
                    fontWeight: "600",
                  }}
                >
                  XpressTicket
                </h2>
              </div>
              <img
                src="/XPRESS TICKETS LOGO2.png"
                alt="XpressTicket Logo"
                style={{
                  height: "40px",
                }}
              />
            </div>

            {/* Large Price Display */}
            <div
              style={{
                marginBottom: "20px",
                borderBottom: "1px solid #eee",
                paddingBottom: "20px",
              }}
            >
              <h1
                style={{
                  fontSize: "38px",
                  fontWeight: "700",
                  margin: "0 0 5px 0",
                  color: "#2c3e50",
                }}
              >
                {formatCurrency(totals.total)}
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6c757d",
                  margin: "0",
                }}
              >
                Paid {receiptDate}
              </p>
            </div>

            {/* Receipt Details */}
            <div
              style={{
                marginBottom: "25px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  padding: "8px 0",
                  borderBottom: "1px solid #f5f5f5",
                }}
              >
                <span style={{ color: "#6c757d" }}>Receipt number</span>
                <span style={{ fontWeight: "500" }}>{receiptNumber}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  padding: "8px 0",
                  borderBottom: "1px solid #f5f5f5",
                }}
              >
                <span style={{ color: "#6c757d" }}>Event</span>
                <span style={{ fontWeight: "500" }}>{purchaseData.event?.name || "Event"}</span>
              </div>
            </div>

            {/* Event Summary */}
            <div
              style={{
                marginBottom: "25px",
                padding: "15px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  marginBottom: "15px",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    margin: "0 0 15px 0",
                  }}
                >
                  {purchaseData.event?.name || "Event"}
                </h3>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#495057",
                  }}
                >
                  <p style={{ margin: "5px 0" }}>
                    <span style={{ color: "#6c757d" }}>Location:</span> {purchaseData.event?.location || "TBA"}
                  </p>
                  <p style={{ margin: "5px 0" }}>
                    <span style={{ color: "#6c757d" }}>Date:</span>{" "}
                    {purchaseData.event?.formattedDate ||
                      purchaseData.event?.startdate ||
                      purchaseData.event?.start_date ||
                      purchaseData.event?.date ||
                      "TBA"}
                  </p>
                  <p style={{ margin: "5px 0" }}>
                    <span style={{ color: "#6c757d" }}>Time:</span>{" "}
                    {purchaseData.event?.formattedTime ||
                      purchaseData.event?.time ||
                      purchaseData.event?.start_time ||
                      "TBA"}
                  </p>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div style={{ marginBottom: "25px" }}>
              <h4
                style={{
                  fontSize: "14px",
                  margin: "0 0 10px 0",
                  fontWeight: "600",
                  color: "#2c3e50",
                }}
              >
                Items
              </h4>

              {purchaseData.packages.map((pkg, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    padding: "10px 0",
                    borderBottom: index < purchaseData.packages.length - 1 ? "1px solid #f5f5f5" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "500", marginBottom: "3px" }}>{pkg.packageDetails}</div>
                    <div style={{ fontSize: "13px", color: "#6c757d" }}>Quantity: {pkg.tickets}</div>
                  </div>
                  <div style={{ fontWeight: "500" }}>{pkg.amount}</div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ marginTop: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  marginBottom: "8px",
                  color: "#6c757d",
                }}
              >
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  marginBottom: "8px",
                  color: "#6c757d",
                }}
              >
                <span>VAT (15%)</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#2c3e50",
                  marginTop: "15px",
                  paddingTop: "15px",
                  borderTop: "1px solid #eee",
                }}
              >
                <span>Amount paid</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>

            {/* Contact Info */}
            <div
              style={{
                marginTop: "30px",
                textAlign: "center",
                fontSize: "14px",
                color: "#6c757d",
              }}
            >
              <p style={{ margin: "0" }}>
                Questions? Contact us at{" "}
                <span style={{ color: "#4ca1af", cursor: "pointer" }}>support@xpressticket.com</span>
              </p>
            </div>

            {/* Download Tickets Section */}
            <div style={{ marginTop: "30px" }}>
              <h4 style={{ fontSize: "16px", marginBottom: "15px", color: "#2c3e50" }}>Download Your Tickets</h4>
              {purchaseData.packages.map((pkg, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 15px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "6px",
                    marginBottom: "10px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "500" }}>{pkg.packageDetails}</div>
                    <div style={{ fontSize: "14px", color: "#6c757d" }}>
                      {pkg.tickets} ticket{pkg.tickets > 1 ? "s" : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(pkg, index)}
                    disabled={isDownloading[index]}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px 16px",
                      backgroundColor: isDownloading[index] ? "#cccccc" : "#4ca1af",
                      border: "none",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: "14px",
                      cursor: isDownloading[index] ? "not-allowed" : "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {isDownloading[index] ? (
                      <span>Downloading...</span>
                    ) : (
                      <>
                        <FaDownload style={{ marginRight: "5px" }} />
                        Download
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Receipt