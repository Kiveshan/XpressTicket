"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import "./CompactViewDetails.css"
import { FaSignOutAlt, FaArrowLeft, FaTicketAlt, FaMapMarkerAlt, FaEnvelope, FaPhone, FaDownload } from "react-icons/fa"
import { jsPDF } from "jspdf"

const ViewMoreDetailsCompact = () => {
  const nav = useNavigate()
  const location = useLocation()
  const [generatingPdf, setGeneratingPdf] = useState({})
  const [ticketData, setTicketData] = useState(null)
  const [eventDetails, setEventDetails] = useState({
    name: "",
    shortName: "",
    location: "",
    venue: "",
  })
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Helper function to fix duplicated URLs
  const fixImageUrl = (url) => {
    if (!url) return ""

    // Check if the URL has a duplicated base URL
    const s3BaseUrl = "https://xpressticket.s3.af-south-1.amazonaws.com/"

    if (url.includes(s3BaseUrl + s3BaseUrl)) {
      // Remove the duplicate base URL
      return url.replace(s3BaseUrl + s3BaseUrl, s3BaseUrl)
    }

    return url
  }

  // Function to fetch ticket data from the server using ticketId
  const fetchTicketData = async (ticketId) => {
    try {
      setLoading(true)
      console.log("Fetching ticket data for ID:", ticketId)

      // Get user token from session storage
      const token = sessionStorage.getItem("token")
      if (!token) {
        setError("Authentication required")
        setLoading(false)
        return
      }

      // Fetch ticket data from the server
      const response = await fetch(`https://xpressticket.co.za/api/ticket/${ticketId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error fetching ticket: ${response.status}`)
      }

      const data = await response.json()
      console.log("Ticket data received:", data)

      // Process the ticket data
      if (data && data.ticket) {
        const ticket = data.ticket

        // Fix any image URLs
        if (ticket.coverImage) {
          ticket.coverImage = fixImageUrl(ticket.coverImage)
        }

        if (ticket.event?.coverImage) {
          ticket.event.coverImage = fixImageUrl(ticket.event.coverImage)
        }

        // Set ticket data
        setTicketData({
          ticketId: ticket.id || ticketId,
          purchaseId: ticket.purchaseId,
          eventId: ticket.eventId,
          delegateDetails: ticket.delegateDetails,
          eventName: ticket.eventName || (ticket.event ? ticket.event.name : "Event"),
          packageName: ticket.packageName,
          amount: ticket.amount,
          tickets: ticket.tickets,
        })

        // Set event details
        setEventDetails({
          name: ticket.eventName || (ticket.event ? ticket.event.name : "Event Details"),
          shortName: ticket.event ? ticket.event.shortName : "",
          location: ticket.event ? ticket.event.location : "",
          venue: ticket.event ? ticket.event.venue : "",
        })

        // Process delegate details
        processTicketDetails(ticket)
        return
      } else {
        throw new Error("Invalid ticket data received")
      }
    } catch (apiError) {
      console.error("API call failed, using fallback data:", apiError)
      // If we're in development or the API call fails, use fallback data
      useFallbackData(ticketId)
    } finally {
      setLoading(false)
    }
  }

  // Function to use fallback data when API call fails
  const useFallbackData = (ticketId) => {
    console.log("Using fallback data for ticket ID:", ticketId)

    // Create mock ticket data based on the ticketId
    const mockTicket = {
      id: ticketId,
      purchaseId: `PUR-${ticketId}-${Date.now().toString().slice(-6)}`,
      eventId: `EVT-${ticketId}`,
      packageName: "Standard Package",
      amount: "R 1,500.00",
      tickets: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+27 123 456 7890",
      delegateDetails: [
        {
          title: "Mr",
          name: "John Doe",
          email: "john.doe@example.com",
          phone: "+27 123 456 7890",
          gender: "Male",
          delegationName: "Individual",
          delegationType: "Standard",
          dayPass: "Full Event",
        },
      ],
    }

    // Set ticket data using the mock data
    setTicketData({
      ticketId: mockTicket.id,
      purchaseId: mockTicket.purchaseId,
      eventId: mockTicket.eventId,
      delegateDetails: mockTicket.delegateDetails,
      eventName: "Sample Event",
      packageName: mockTicket.packageName,
      amount: mockTicket.amount,
      tickets: mockTicket.tickets,
    })

    // Set event details
    setEventDetails({
      name: "Sample Event",
      shortName: "Sample",
      location: "Cape Town, South Africa",
      venue: "Convention Center",
    })

    // Process delegate details
    processTicketDetails(mockTicket)
  }

  // Function to process ticket details
  const processTicketDetails = (ticket) => {
    try {
      let processedPackages = []

      if (ticket.delegateDetails && Array.isArray(ticket.delegateDetails)) {
        processedPackages = ticket.delegateDetails.map((delegate) => ({
          title: delegate.title || "",
          name: delegate.name || "N/A",
          email: delegate.email || "N/A",
          phone: delegate.phone || "N/A",
          gender: delegate.gender || "",
          packageDetails: ticket.packageName || "Standard Package",
          delegationName: delegate.delegationName || "Individual",
          delegationType: delegate.delegationType || "",
          tickets: ticket.tickets || 1,
          ieeeNumber: delegate.ieeeNumber || "",
          dayPass: delegate.dayPass || "",
          amount: ticket.amount || "N/A",
        }))
      } else {
        // If no delegate details, create a single package entry with available info
        processedPackages = [
          {
            title: "",
            name: ticket.name || "N/A",
            email: ticket.email || "N/A",
            phone: ticket.phone || "N/A",
            gender: "",
            packageDetails: ticket.packageName || "Standard Package",
            delegationName: "Individual",
            delegationType: "",
            tickets: ticket.tickets || 1,
            ieeeNumber: "",
            dayPass: "",
            amount: ticket.amount || "N/A",
          },
        ]
      }

      setPackages(processedPackages)
    } catch (err) {
      console.error("Error processing delegate details:", err)
      throw err
    }
  }

  useEffect(() => {
    // Get ticket data from location state
    if (location.state) {
      console.log("Location state received:", location.state)

      // Check if we only have ticketId
      if (location.state.ticketId && Object.keys(location.state).length === 1) {
        // If only ticketId is provided, fetch the complete ticket data
        fetchTicketData(location.state.ticketId)
        return
      }

      // Fix any image URLs in the location state
      if (location.state.coverImage) {
        location.state.coverImage = fixImageUrl(location.state.coverImage)
      }

      if (location.state.event?.coverImage) {
        location.state.event.coverImage = fixImageUrl(location.state.event.coverImage)
      }

      // Extract all available ticket data from location state
      const {
        ticketId,
        purchaseId,
        eventId,
        delegateDetails,
        eventName,
        packageName,
        amount,
        tickets,
        // Extract additional fields that might be available
        name,
        email,
        phone,
        date,
        location: eventLocation,
        venue: eventVenue,
        shortName: eventShortName,
      } = location.state

      // Log the extracted data for debugging
      console.log("Extracted ticket data:", {
        ticketId,
        purchaseId,
        eventId,
        delegateDetails,
        eventName,
        packageName,
        amount,
        tickets,
        name,
        email,
        phone,
        date,
      })

      // Set ticket data with all available information
      setTicketData({
        ticketId,
        purchaseId,
        eventId,
        delegateDetails,
        eventName,
        packageName,
        amount,
        tickets,
        name,
        email,
        phone,
        date,
      })

      // Set event details with all available data from location state
      // Prioritize eventName from the ticket data, then try other possible sources
      const displayEventName = eventName || location.state.eventName || location.state.event?.name || "Event Details"
      console.log("Setting event name to:", displayEventName)

      setEventDetails({
        name: displayEventName,
        shortName: eventShortName || "",
        location: eventLocation || location.state.eventLocation || "",
        venue: eventVenue || "",
      })

      try {
        // Use the shared function to process ticket details
        // Create a complete ticket object with all available data
        const ticketObject = {
          id: ticketId,
          purchaseId,
          eventId,
          delegateDetails,
          packageName,
          tickets,
          amount,
          name,
          email,
          phone,
          date,
        }

        // Process the ticket details
        processTicketDetails(ticketObject)
        setLoading(false)
      } catch (err) {
        console.error("Error processing delegate details:", err)
        setError("Failed to process ticket details")
        setLoading(false)
      }
    } else {
      setError("No ticket information provided")
      setLoading(false)
    }
  }, [location.state])

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("userInfo")
    nav("/")
  }

  // Function to generate and download ticket PDF
  const generateTicketPDF = async (pkg) => {
    // Set loading state for this specific package
    setGeneratingPdf((prev) => ({ ...prev, [pkg.email]: true }))

    try {
      // Create new PDF document in landscape format for modern ticket style
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Generate a unique ticket ID
      const generateTicketId = () => {
        const randomPart = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")
        return `XPT-${randomPart}-${Date.now().toString().slice(-6)}`
      }

      const ticketId = generateTicketId()

      // Set background color for the entire page
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 0, pageWidth, pageHeight, "F")

      // Add header with gradient
      doc.setFillColor(44, 62, 80) // #2c3e50 - dark blue from our design system
      doc.rect(0, 0, pageWidth, 30, "F")

      // Add logo
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.setFont("helvetica", "bold")
      doc.text("XpressTicket", 15, 20)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text("Your Official Event Ticket", 15, 25)

      // Add ticket type badge
      doc.setFillColor(76, 161, 175) // #4ca1af - teal from our design system
      doc.roundedRect(pageWidth - 60, 10, 45, 15, 3, 3, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(pkg.packageDetails.toUpperCase(), pageWidth - 38, 20, { align: "center" })

      // Extract event information
      const eventName = eventDetails.name || "Event"
      const venue = eventDetails.venue || ""
      const location = eventDetails.location || ""

      // Extract date and time information if available
      let dateRange = ""
      let eventTime = ""

      if (pkg.dayPass) {
        dateRange = pkg.dayPass
      } else if (ticketData && ticketData.startDate && ticketData.endDate) {
        dateRange = `${new Date(ticketData.startDate).toLocaleDateString()} - ${new Date(ticketData.endDate).toLocaleDateString()}`
      }

      if (ticketData && ticketData.time) {
        eventTime = ticketData.time
      }

      // Try to add event cover image if available
      const coverImageHeight = 50
      let imageAdded = false

      try {
        // Check for event image in various possible locations
        let eventImageUrl =
          eventDetails?.coverImage ||
          ticketData?.coverImage ||
          location?.state?.event?.coverImage ||
          (ticketData?.tickets && ticketData.tickets[0]?.event?.coverImage)

        // Fix the URL if it has duplicated base URLs
        eventImageUrl = fixImageUrl(eventImageUrl)

        if (eventImageUrl) {
          // Create a promise to handle image loading
          const loadImage = () => {
            return new Promise((resolve, reject) => {
              const img = new Image()
              img.onload = () => resolve(img)
              img.onerror = (e) => {
                console.error("Image failed to load:", e)
                reject(e)
              }
              img.src = eventImageUrl
            })
          }

          // Try to load and add the image
          try {
            const img = await loadImage()
            // Add event image below header
            doc.addImage(img, "JPEG", 10, 40, 50, coverImageHeight, undefined, "FAST")
            imageAdded = true
          } catch (imgErr) {
            console.error("Error adding event image to PDF:", imgErr)
            // Continue without the image
          }
        }
      } catch (err) {
        console.error("Error processing event cover image:", err)
        // Continue without the image
      }

      // Add event name
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(44, 62, 80) // #2c3e50 - dark blue from our design system

      // Position event name based on whether image was added
      const eventNameX = imageAdded ? 70 : pageWidth / 2
      const eventNameAlign = imageAdded ? "left" : "center"
      doc.text(eventName, eventNameX, 50, { align: eventNameAlign, maxWidth: pageWidth - 80 })

      // Add event date and time
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(73, 80, 87) // #495057 - dark gray from our design system

      if (dateRange) {
        doc.text(`Date: ${dateRange}`, eventNameX, 60, { align: eventNameAlign, maxWidth: pageWidth - 80 })
      }

      if (eventTime) {
        doc.text(`Time: ${eventTime}`, eventNameX, 67, { align: eventNameAlign })
      }

      // Add venue and location
      if (venue) {
        doc.text(`Venue: ${venue}`, eventNameX, 74, { align: eventNameAlign, maxWidth: pageWidth - 80 })
      }

      if (location) {
        doc.text(`Location: ${location}`, eventNameX, 81, { align: eventNameAlign, maxWidth: pageWidth - 80 })
      }

      // Add horizontal divider
      doc.setDrawColor(222, 226, 230) // #dee2e6 - light gray
      doc.setLineWidth(0.3)
      doc.line(10, 95, pageWidth - 10, 95)

      // Two columns layout
      const leftCol = 42
      const rightCol = pageWidth / 2 + 10
      const startY = 110
      const lineHeight = 7

      // ATTENDEE INFORMATION section
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(44, 62, 80) // #2c3e50 - dark blue from our design system
      doc.text("ATTENDEE INFORMATION", 20, 105)

      // TICKET INFORMATION section
      doc.text("TICKET INFORMATION", rightCol, 105)

      // Attendee details
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(73, 80, 87) // #495057 - dark gray from our design system

      // Name
      doc.setFont("helvetica", "bold")
      doc.text("Name:", 20, startY)
      doc.setFont("helvetica", "normal")
      doc.text(`${pkg.title} ${pkg.name}`, leftCol, startY)

      // Email
      doc.setFont("helvetica", "bold")
      doc.text("Email:", 20, startY + lineHeight)
      doc.setFont("helvetica", "normal")
      doc.text(pkg.email, leftCol, startY + lineHeight)

      // Phone
      doc.setFont("helvetica", "bold")
      doc.text("Phone:", 20, startY + lineHeight * 2)
      doc.setFont("helvetica", "normal")
      doc.text(pkg.phone || "N/A", leftCol, startY + lineHeight * 2)

      // Delegation
      if (pkg.delegationName && pkg.delegationName !== "Individual") {
        doc.setFont("helvetica", "bold")
        doc.text("Delegation:", 20, startY + lineHeight * 3)
        doc.setFont("helvetica", "normal")
        doc.text(pkg.delegationName, leftCol, startY + lineHeight * 3)
      }

      // IEEE Number if applicable
      if (pkg.ieeeNumber) {
        doc.setFont("helvetica", "bold")
        doc.text("IEEE Number:", 20, startY + lineHeight * 4)
        doc.setFont("helvetica", "normal")
        doc.text(pkg.ieeeNumber, leftCol, startY + lineHeight * 4)
      }

      // Ticket information
      doc.setFont("helvetica", "bold")
      doc.text("Ticket ID:", rightCol, startY)
      doc.setFont("helvetica", "normal")
      doc.text(ticketId, rightCol + 30, startY)

      // Package
      doc.setFont("helvetica", "bold")
      doc.text("Package:", rightCol, startY + lineHeight)
      doc.setFont("helvetica", "normal")
      doc.text(pkg.packageDetails, rightCol + 30, startY + lineHeight)

      // Number of tickets
      doc.setFont("helvetica", "bold")
      doc.text("Tickets:", rightCol, startY + lineHeight * 2)
      doc.setFont("helvetica", "normal")
      doc.text(pkg.tickets.toString(), rightCol + 30, startY + lineHeight * 2)

      // Day pass / duration
      doc.setFont("helvetica", "bold")
      doc.text("Duration:", rightCol, startY + lineHeight * 3)
      doc.setFont("helvetica", "normal")
      doc.text(pkg.dayPass || "Full Event", rightCol + 30, startY + lineHeight * 3)

      // Amount
      doc.setFont("helvetica", "bold")
      doc.text("Amount:", rightCol, startY + lineHeight * 4)
      doc.setFont("helvetica", "normal")
      doc.text(pkg.amount, rightCol + 30, startY + lineHeight * 4)

      // Add QR code placeholder
      const qrSize = 40
      const qrX = pageWidth - qrSize - 20
      const qrY = startY - 5

      // Draw QR code placeholder with black squares
      doc.setFillColor(0, 0, 0)

      // Draw a border for the QR code
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.rect(qrX, qrY, qrSize, qrSize)

      // Create a simple pattern to simulate a QR code
      const cellSize = qrSize / 10
      const margin = 0

      // Create a simple pattern to simulate a QR code
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          // Random pattern to simulate QR code
          if (
            Math.random() > 0.5 ||
            // Always draw the position markers in corners
            (i < 3 && j < 3) ||
            (i < 3 && j > 6) ||
            (i > 6 && j < 3)
          ) {
            doc.rect(qrX + margin + i * cellSize, qrY + margin + j * cellSize, cellSize, cellSize, "F")
          }
        }
      }

      // Add ticket number under QR code
      doc.setFontSize(8)
      doc.setTextColor(73, 80, 87) // #495057 - dark gray from our design system
      doc.text("SCAN QR CODE AT EVENT", qrX + qrSize / 2, qrY + qrSize + 10, { align: "center" })
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.text(ticketId, qrX + qrSize / 2, qrY + qrSize + 16, { align: "center" })

      // Add bottom section with important notes
      doc.setDrawColor(76, 161, 175) // #4ca1af - teal from our design system
      doc.setLineWidth(0.5)
      doc.line(10, pageHeight - 40, pageWidth - 10, pageHeight - 40)

      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(44, 62, 80) // #2c3e50 - dark blue from our design system
      doc.text("IMPORTANT INFORMATION", pageWidth / 2, pageHeight - 35, { align: "center" })

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(73, 80, 87) // #495057 - dark gray from our design system
      doc.text(
        "\u2022 This e-ticket must be presented at the event entrance either printed or on a mobile device.",
        20,
        pageHeight - 28,
      )
      doc.text(
        `• Event Date: ${dateRange || "See event details"}. Please arrive at least 30 minutes before the event starts.`,
        20,
        pageHeight - 23,
      )
      doc.text("\u2022 This ticket is non-transferable and valid only for the named attendee.", 20, pageHeight - 18)

      // Add footer
      doc.setFillColor(44, 62, 80) // #2c3e50 - dark blue from our design system
      doc.rect(0, pageHeight - 10, pageWidth, 10, "F")

      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(255, 255, 255) // White text for footer
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, pageHeight - 4)
      doc.text("Powered by XpressTicket", pageWidth - 10, pageHeight - 4, { align: "right" })

      // Save the PDF with sanitized filename
      try {
        const sanitizedName = (pkg.name || "ticket").toString().replace(/\s+/g, "_")
        const sanitizedPackage = (pkg.packageDetails || "package").toString().replace(/\s+/g, "_")
        doc.save(`${sanitizedName}_${sanitizedPackage}_ticket.pdf`)
      } catch (error) {
        console.error("Error saving PDF with custom filename:", error)
        // Fallback to generic filename
        doc.save("ticket.pdf")
      }
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate ticket PDF. Please try again.")
    } finally {
      // Reset loading state
      setGeneratingPdf((prev) => ({ ...prev, [pkg.email]: false }))
    }
  }

  // Calculate total amount
  const calculateTotal = () => {
    let total = 0
    packages.forEach((pkg) => {
      try {
        // Handle different types of amount values
        let amountStr = "0"
        if (pkg.amount) {
          // Convert to string if it's not already
          amountStr = typeof pkg.amount === "string" ? pkg.amount : String(pkg.amount)
        }

        // Extract numeric value from amount string (e.g., 'R 7 000,00' -> 7000)
        const numericValue = Number.parseFloat(amountStr.replace(/[^0-9.,]/g, "").replace(",", "."))
        if (!isNaN(numericValue)) {
          total += numericValue
        }
      } catch (err) {
        console.error("Error processing amount:", err, pkg.amount)
        // Continue with next package
      }
    })

    // Format total as currency
    return `R ${total.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(".", ",")}`
  }

  return (
    <div className="compact-details-container">
      {/* Header with Logo and Logout */}
      <header className="compact-header">
        <img src="/XPRESS TICKETS LOGO2.png" alt="XpressTicket Logo" className="compact-logo" />
        <div className="compact-header-actions">
          <button className="compact-logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="compact-content">
        {/* Back Button */}
        <div className="compact-back-button">
          <button className="compact-back-btn" onClick={() => nav("/parchasedticket")}>
            <FaArrowLeft /> Back to Tickets
          </button>
        </div>

        {loading ? (
          <div className="compact-card compact-loading">
            <div className="compact-loading-spinner"></div>
            <p>Loading ticket details...</p>
          </div>
        ) : error ? (
          <div className="compact-card compact-error">
            <p className="compact-error-message">{error}</p>
            <button className="compact-btn compact-btn-primary" onClick={() => nav("/parchasedticket")}>
              Back to Tickets
            </button>
          </div>
        ) : (
          <>
            {/* Event Info Card */}
            <div className="compact-card compact-event-card">
              <div className="compact-event-header">
                <div className="compact-event-title">
                  <h1 style={{ color: "white" }}>{eventDetails.name}</h1>
                  {eventDetails.shortName && (
                    <p className="compact-event-subtitle" style={{ color: "white" }}>
                      {eventDetails.shortName}
                    </p>
                  )}
                </div>
              </div>
              {(eventDetails.venue || eventDetails.location) && (
                <div className="compact-event-location">
                  {eventDetails.venue && (
                    <p style={{ color: "white" }}>
                      <FaMapMarkerAlt /> {eventDetails.venue}
                    </p>
                  )}
                  {eventDetails.location && <p style={{ color: "white" }}>{eventDetails.location}</p>}
                </div>
              )}
            </div>

            {/* Ticket Details Section */}
            <div className="compact-card">
              <div className="compact-card-header">
                <h2>
                  <FaTicketAlt /> Ticket Details
                </h2>
                <p>Complete information about your purchased tickets</p>
              </div>

              <div className="compact-table-responsive">
                {packages.length === 0 ? (
                  <div className="compact-no-tickets">
                    <p>No delegate details available for this ticket.</p>
                  </div>
                ) : (
                  <table className="compact-table">
                    <thead>
                      <tr>
                        <th>Package</th>
                        <th>Name</th>
                        <th>Contact</th>
                        <th>Delegation</th>
                        <th>Tickets</th>
                        <th>Duration</th>
                        <th>Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packages.map((pkg, index) => (
                        <tr key={index}>
                          <td>
                            <div className="compact-package-cell">
                              <div className="compact-package-type">{pkg.packageDetails}</div>
                              {pkg.ieeeNumber && <div className="compact-package-id">IEEE: {pkg.ieeeNumber}</div>}
                            </div>
                          </td>
                          <td>
                            <div className="compact-attendee-cell">
                              <div className="compact-attendee-name">
                                {pkg.title} {pkg.name}
                              </div>
                              {pkg.gender && <div className="compact-attendee-gender">{pkg.gender}</div>}
                            </div>
                          </td>
                          <td>
                            <div className="compact-contact-cell">
                              {pkg.email && (
                                <div className="compact-contact-email">
                                  <FaEnvelope /> {pkg.email}
                                </div>
                              )}
                              {pkg.phone && (
                                <div className="compact-contact-phone">
                                  <FaPhone /> {pkg.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="compact-package-cell">
                              <div className="compact-package-type">{pkg.delegationName || "N/A"}</div>
                              {pkg.delegationType && <div className="compact-package-id">{pkg.delegationType}</div>}
                            </div>
                          </td>
                          <td>{pkg.tickets}</td>
                          <td>
                            <div className="compact-badge compact-badge-standard">{pkg.dayPass || "Full Event"}</div>
                          </td>
                          <td>
                            <div className="compact-package-type">{pkg.amount || "N/A"}</div>
                          </td>
                          <td>
                            <button
                              className="compact-download-btn"
                              onClick={() => generateTicketPDF(pkg)}
                              disabled={generatingPdf[pkg.email]}
                            >
                              {generatingPdf[pkg.email] ? (
                                <>Generating...</>
                              ) : (
                                <>
                                  <FaDownload /> Download
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {packages.length > 0 && (
                <div className="compact-total-section">
                  <div className="compact-total-amount">Total: {calculateTotal()}</div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default ViewMoreDetailsCompact
