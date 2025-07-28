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
  FaFileInvoice,
} from "react-icons/fa"
import "../shared/ModernDashboard.css"

const TicketsList = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [generatingInvoice, setGeneratingInvoice] = useState({})
  const [generatingTicket, setGeneratingTicket] = useState({})

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

      purchases.forEach((purchase, purchaseIndex) => {
        console.log(`Processing purchase ${purchaseIndex + 1}:`, purchase)

        // Handle different data structures for delegates
        let delegates = []

        // Check for delegates array first
        if (purchase.delegates && Array.isArray(purchase.delegates)) {
          delegates = purchase.delegates
        }
        // Check for delegateDetails (could be array or object)
        else if (purchase.delegateDetails) {
          if (Array.isArray(purchase.delegateDetails)) {
            delegates = purchase.delegateDetails
          } else if (typeof purchase.delegateDetails === "object") {
            delegates = [purchase.delegateDetails]
          }
        }
        // Check for delegate_details (from database)
        else if (purchase.delegate_details) {
          try {
            const parsedDetails =
              typeof purchase.delegate_details === "string"
                ? JSON.parse(purchase.delegate_details)
                : purchase.delegate_details

            delegates = Array.isArray(parsedDetails) ? parsedDetails : [parsedDetails]
          } catch (e) {
            console.error("Error parsing delegate_details:", e)
          }
        }
        // Fallback: create delegate from purchase data
        else {
          delegates = [
            {
              name: purchase.customerName || purchase.name || purchase.attendeeName || "Guest",
              surname: purchase.customerSurname || purchase.surname || purchase.attendeeSurname || "",
              email: purchase.customerEmail || purchase.email || purchase.attendeeEmail || "No email provided",
              phone: purchase.customerPhone || purchase.phone || purchase.attendeePhone || "",
              title: purchase.title || "",
              gender: purchase.gender || "",
            },
          ]
        }

        console.log(`Found ${delegates.length} delegates for purchase ${purchase.id}:`, delegates)

        // Process each delegate
        delegates.forEach((delegate, delegateIndex) => {
          // Extract price - try multiple possible fields
          let ticketPrice = 0
          if (delegate.amount) {
            ticketPrice = Number.parseFloat(delegate.amount) || 0
          } else if (purchase.amount) {
            ticketPrice = Number.parseFloat(purchase.amount) || 0
          } else if (purchase.totalAmount) {
            ticketPrice = Number.parseFloat(purchase.totalAmount) || 0
          } else if (purchase.price) {
            ticketPrice = Number.parseFloat(purchase.price) || 0
          }

          // If we have multiple delegates, divide the total amount
          if (delegates.length > 1 && purchase.totalAmount) {
            ticketPrice = Number.parseFloat(purchase.totalAmount) / delegates.length || 0
          }

          const ticket = {
            id: `${purchase.id || purchase.purchase_id}-${delegateIndex + 1}`,
            purchaseId: purchase.id || purchase.purchase_id,
            eventName: purchase.eventName || eventInfo?.eventName || purchase.event_name || "Event",
            eventDate: purchase.eventDate || eventInfo?.eventDate || purchase.event_date,
            eventLocation: purchase.eventLocation || eventInfo?.eventLocation || purchase.event_location,
            eventImage: purchase.eventImage || eventInfo?.eventImage || purchase.event_image,
            ticketType: purchase.ticketType || purchase.package || purchase.ticket_type || "General Admission",
            price: ticketPrice,
            status: purchase.status || purchase.purchase_status || "Active",
            purchaseDate: purchase.purchaseDate || purchase.createdAt || purchase.purchase_date || purchase.created_at,
            delegate: {
              name: delegate.name || delegate.firstName || "Guest",
              surname: delegate.surname || delegate.lastName || "",
              email: delegate.email || "No email provided",
              phone: delegate.phone || delegate.phoneNumber || "",
              title: delegate.title || "",
              gender: delegate.gender || "",
            },
            qrCode: `QR-${purchase.id}-${delegateIndex + 1}-${Date.now()}`,
            barcode: `BC${purchase.id}${String(delegateIndex + 1).padStart(3, "0")}`,
            // Store original data for debugging
            originalPurchase: purchase,
            originalDelegate: delegate,
          }

          console.log(`Created ticket ${delegateIndex + 1} for purchase ${purchase.id}:`, ticket)
          processedTickets.push(ticket)
        })
      })

      console.log("TicketsList - All processed tickets:", processedTickets)
      setTickets(processedTickets)
    } catch (err) {
      console.error("Error processing tickets:", err)
      setError(`Failed to process tickets: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [location.state])

  const handleBackToReview = () => {
    navigate("/reviewpurchase")
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

  const handleDownloadTicket = async (ticket) => {
    setGeneratingTicket((prev) => ({ ...prev, [ticket.id]: true }))

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
      doc.text(`Ticket ID: ${ticket.id || "undefined-1"}`, pageWidth / 2, 25, { align: "center" })

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
      doc.text(`Ticket Type: ${ticket.ticketType || "General Admission"}`, 25, currentY + 34)

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

      const attendeeName = ticket.delegate
        ? `${ticket.delegate.name || ""} ${ticket.delegate.surname || ""}`.trim() || "Guest Attendee"
        : "Guest Attendee"
      const attendeeEmail = ticket.delegate?.email || "No email provided"
      const attendeePhone = ticket.delegate?.phone || ""

      doc.text(`Name: ${attendeeName}`, 25, attendeeBoxY + 18)
      doc.text(`Email: ${attendeeEmail}`, 25, attendeeBoxY + 26)
      if (attendeePhone) {
        doc.text(`Phone: ${attendeePhone}`, 25, attendeeBoxY + 34)
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
      setGeneratingTicket((prev) => ({ ...prev, [ticket.id]: false }))
    }
  }

  const handleDownloadInvoice = async (ticket) => {
    setGeneratingInvoice((prev) => ({ ...prev, [ticket.id]: true }))

    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import("jspdf")

      // Create new PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Generate invoice number
      const invoiceNumber = `INV-${ticket.purchaseId}-${Date.now().toString().slice(-6)}`
      const invoiceDate = new Date().toLocaleDateString("en-ZA")

      // Modern gradient background
      doc.setFillColor(248, 250, 252) // Very light blue-gray background
      doc.rect(0, 0, pageWidth, pageHeight, "F")

      // Header section with modern design
      const headerHeight = 40
      doc.setFillColor(30, 41, 59) // Dark slate blue
      doc.rect(0, 0, pageWidth, headerHeight, "F")

      // Invoice title
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(28)
      doc.setFont("helvetica", "bold")
      doc.text("INVOICE", 20, 25)

      // Invoice number and date in header
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(`#${invoiceNumber}`, pageWidth - 20, 20, { align: "right" })
      doc.text(`Date: ${invoiceDate}`, pageWidth - 20, 30, { align: "right" })

      // Company/Event organizer section
      let currentY = headerHeight + 20
      doc.setTextColor(30, 41, 59)
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("Bill To:", 20, currentY)

      currentY += 10
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      const attendeeName = `${ticket.delegate.name} ${ticket.delegate.surname}`.trim() || "Guest Attendee"
      doc.text(attendeeName, 20, currentY)

      currentY += 6
      doc.text(ticket.delegate.email, 20, currentY)

      if (ticket.delegate.phone) {
        currentY += 6
        doc.text(ticket.delegate.phone, 20, currentY)
      }

      // Event details section
      currentY += 20
      doc.setFillColor(241, 245, 249) // Light gray background
      doc.roundedRect(20, currentY - 5, pageWidth - 40, 35, 5, 5, "F")

      doc.setTextColor(30, 41, 59)
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("Event Details", 25, currentY + 5)

      currentY += 15
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(`Event: ${ticket.eventName}`, 25, currentY)

      currentY += 6
      if (ticket.eventDate) {
        doc.text(`Date: ${formatDate(ticket.eventDate)}`, 25, currentY)
        currentY += 6
      }

      if (ticket.eventLocation) {
        doc.text(`Location: ${ticket.eventLocation}`, 25, currentY)
      }

      // Invoice items table
      currentY += 25
      doc.setFillColor(30, 41, 59)
      doc.rect(20, currentY, pageWidth - 40, 12, "F")

      // Table headers
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("Description", 25, currentY + 8)
      doc.text("Qty", pageWidth - 80, currentY + 8, { align: "center" })
      doc.text("Amount", pageWidth - 25, currentY + 8, { align: "right" })

      // Table row
      currentY += 12
      doc.setFillColor(255, 255, 255)
      doc.rect(20, currentY, pageWidth - 40, 15, "F")
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.5)
      doc.rect(20, currentY, pageWidth - 40, 15, "S")

      doc.setTextColor(30, 41, 59)
      doc.setFont("helvetica", "normal")
      doc.text(`${ticket.ticketType} - ${ticket.eventName}`, 25, currentY + 8)
      doc.text("1", pageWidth - 80, currentY + 8, { align: "center" })
      doc.text(formatPrice(ticket.price), pageWidth - 25, currentY + 8, { align: "right" })

      // Calculate VAT and totals
      const subtotal = Number.parseFloat(ticket.price) || 0
      const vatRate = 0.15 // 15% VAT
      const vatAmount = subtotal * vatRate
      const totalAmount = subtotal + vatAmount

      // Subtotal and total section
      currentY += 25
      const totalSectionY = currentY

      // Subtotal
      doc.setFont("helvetica", "normal")
      doc.text("Subtotal:", pageWidth - 80, totalSectionY)
      doc.text(formatPrice(subtotal), pageWidth - 25, totalSectionY, { align: "right" })

      // VAT (15%)
      currentY += 8
      doc.text("VAT (15%):", pageWidth - 80, currentY)
      doc.text(formatPrice(vatAmount), pageWidth - 25, currentY, { align: "right" })

      // Total line
      currentY += 8
      doc.setDrawColor(30, 41, 59)
      doc.setLineWidth(1)
      doc.line(pageWidth - 100, currentY, pageWidth - 20, currentY)

      // Total amount
      currentY += 10
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Total:", pageWidth - 80, currentY)
      doc.text(formatPrice(totalAmount), pageWidth - 25, currentY, { align: "right" })

      // Payment information - moved higher
      currentY += 20
      doc.setFillColor(241, 245, 249)
      doc.roundedRect(20, currentY - 5, pageWidth - 40, 25, 5, 5, "F")

      doc.setTextColor(30, 41, 59)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Payment Information", 25, currentY + 5)

      currentY += 12
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Payment Status: Paid`, 25, currentY)
      doc.text(`Transaction ID: ${ticket.purchaseId}`, 25, currentY + 6)

      // Terms and conditions - moved higher to prevent cutoff
      currentY += 25
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Terms & Conditions", 20, currentY)

      currentY += 8
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.text("• This invoice serves as proof of purchase for the event ticket.", 20, currentY)
      currentY += 5
      doc.text("• Tickets are non-refundable unless the event is cancelled.", 20, currentY)
      currentY += 5
      doc.text("• Please present this invoice along with valid ID at the event entrance.", 20, currentY)
      currentY += 5
      doc.text("• VAT registration number: 1234567890", 20, currentY)

      // Footer - ensure it fits on page
      const footerY = Math.min(pageHeight - 20, currentY + 20)
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.5)
      doc.line(20, footerY - 5, pageWidth - 20, footerY - 5)

      doc.setTextColor(107, 114, 128)
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, footerY)
      doc.text("Thank you for your business!", pageWidth - 20, footerY, { align: "right" })

      // Save the PDF
      const sanitizedName = attendeeName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "")
      const sanitizedEvent = ticket.eventName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "")
      doc.save(`${sanitizedEvent}_${sanitizedName}_Invoice.pdf`)
    } catch (error) {
      console.error("Error generating invoice PDF:", error)
      alert("Failed to generate invoice PDF. Please try again.")
    } finally {
      setGeneratingInvoice((prev) => ({ ...prev, [ticket.id]: false }))
    }
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
    if (price === null || price === undefined || price === "N/A") return "R 0.00"

    // Handle string prices that might contain currency symbols
    if (typeof price === "string") {
      // Remove currency symbols and spaces, then parse
      const cleanPrice = price.replace(/[R\s,]/g, "").replace(/[^\d.]/g, "")
      const numPrice = Number.parseFloat(cleanPrice)
      return isNaN(numPrice) ? "R 0.00" : `R ${numPrice.toFixed(2)}`
    }

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
          <p style={{ color: "#4ca1af", margin: "0", fontSize: "1.1rem" }}>Loading tickets...</p>
        </div>
      </div>
    )
  }

  if (error) {
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
          <button className="modern-back-btn" onClick={handleBackToReview}>
            <FaArrowLeft /> Back
          </button>
        </div>

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
        <button className="modern-back-btn" onClick={handleBackToReview}>
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
                      {`${ticket.delegate.name} ${ticket.delegate.surname}`.trim() || "Guest Attendee"}
                    </div>
                    <div style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                      {ticket.delegate.email || "No email provided"}
                    </div>
                    {ticket.delegate.phone && (
                      <div style={{ color: "#6b7280", fontSize: "0.8rem" }}>{ticket.delegate.phone}</div>
                    )}
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
                      gap: "8px",
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
                        padding: "8px 16px",
                        borderRadius: "6px",
                        fontSize: "0.85rem",
                        fontWeight: "500",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
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
                      onClick={() => handleDownloadTicket(ticket)}
                      disabled={generatingTicket[ticket.id]}
                      style={{
                        flex: "1",
                        backgroundColor: generatingTicket[ticket.id] ? "#9ca3af" : "#7c3aed",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        fontSize: "0.85rem",
                        fontWeight: "500",
                        cursor: generatingTicket[ticket.id] ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        transition: "background-color 0.2s ease",
                        opacity: generatingTicket[ticket.id] ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!generatingTicket[ticket.id]) {
                          e.target.style.backgroundColor = "#6d28d9"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!generatingTicket[ticket.id]) {
                          e.target.style.backgroundColor = "#7c3aed"
                        }
                      }}
                    >
                      <FaTicketAlt /> {generatingTicket[ticket.id] ? "Generating..." : "Ticket"}
                    </button>

                    <button
                      onClick={() => handleDownloadInvoice(ticket)}
                      disabled={generatingInvoice[ticket.id]}
                      style={{
                        flex: "1",
                        backgroundColor: generatingInvoice[ticket.id] ? "#9ca3af" : "#059669",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        fontSize: "0.85rem",
                        fontWeight: "500",
                        cursor: generatingInvoice[ticket.id] ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        transition: "background-color 0.2s ease",
                        opacity: generatingInvoice[ticket.id] ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!generatingInvoice[ticket.id]) {
                          e.target.style.backgroundColor = "#047857"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!generatingInvoice[ticket.id]) {
                          e.target.style.backgroundColor = "#059669"
                        }
                      }}
                    >
                      <FaFileInvoice /> {generatingInvoice[ticket.id] ? "Generating..." : "Invoice"}
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
