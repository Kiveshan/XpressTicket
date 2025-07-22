"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { FaSignOutAlt, FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaDownload, FaEnvelope } from "react-icons/fa"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

const InvoicePreview = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isGenerating, setIsGenerating] = useState(false)

  // Get event data from navigation state or use default values
  const eventData = location.state || {
    eventId: "default",
    eventName: "Event Name",
    eventDate: new Date().toLocaleDateString(),
    eventLocation: "Location",
    eventImage: "",
    eventPrice: "R 0.00",
    ticketData: [],
    delegateDetails: [],
  }

  // Initialize ticket data from location state
  const [ticketData, setTicketData] = useState([])

  useEffect(() => {
    if (eventData.ticketData && Array.isArray(eventData.ticketData)) {
      setTicketData(eventData.ticketData)
    } else if (eventData.delegateDetails && Array.isArray(eventData.delegateDetails)) {
      // Convert delegate details to ticket data format
      const processedTickets = eventData.delegateDetails.map((delegate, index) => ({
        type: "Standard Ticket",
        name: delegate.name || "N/A",
        surname: delegate.surname || "",
        email: delegate.email || "N/A",
        phone: delegate.phone || "N/A",
        quantity: 1,
        unitPrice: eventData.eventPrice || "R 0.00",
        total: eventData.eventPrice || "R 0.00",
      }))
      setTicketData(processedTickets)
    } else {
      // Default ticket data
      setTicketData([
        {
          type: "Standard Ticket",
          name: "Attendee",
          surname: "",
          email: "N/A",
          phone: "N/A",
          quantity: 1,
          unitPrice: eventData.eventPrice,
          total: eventData.eventPrice,
        },
      ])
    }
  }, [eventData])

  // Generate a unique invoice number
  const invoiceNumber = `INV-${eventData.eventId}-${Date.now().toString().slice(-6)}`
  const purchaseDate = new Date().toLocaleDateString("en-ZA")

  const handleGoBack = () => {
    navigate(-1)
  }

  const getEventImageUrl = (eventImage) => {
    if (!eventImage) return "/XPRESS TICKETS LOGO2.png"

    if (eventImage.startsWith("http://") || eventImage.startsWith("https://")) {
      return eventImage
    }

    return `http://localhost:5000${eventImage.startsWith("/") ? "" : "/"}${eventImage}`
  }

  const calculateTotal = () => {
    return ticketData.reduce((sum, ticket) => {
      const priceString = ticket.total || ticket.unitPrice || "0"
      const numericValue = Number.parseFloat(priceString.replace(/[^0-9.]/g, ""))
      return sum + (isNaN(numericValue) ? 0 : numericValue)
    }, 0)
  }

  const formatCurrency = (amount) => {
    const numAmount =
      typeof amount === "number" ? amount : Number.parseFloat(amount.toString().replace(/[^0-9.-]/g, ""))
    return `R ${numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
  }

  const generatePDF = async () => {
    setIsGenerating(true)

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
      doc.rect(0, 0, pageWidth, 20, "F")

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
        // Calculate logo dimensions and position
        const logoWidth = 40
        const logoHeight = (logoImg.height * logoWidth) / logoImg.width

        // Add logo to PDF header
        doc.addImage(logoImg, "PNG", 10, 3, logoWidth, 15)
      } catch (logoErr) {
        console.error("Error loading logo:", logoErr)
        // Continue without logo
      }

      // Add invoice title in header
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(255, 255, 255) // White text for header
      doc.text("INVOICE", pageWidth - 20, 13, { align: "right" })

      // Add invoice number and date
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Invoice #: ${invoiceNumber}`, 20, 30)
      doc.text(`Date: ${purchaseDate}`, pageWidth - 20, 30, { align: "right" })

      // Try to add event image if available
      let imageAdded = false
      const coverImageHeight = 40

      if (eventData.eventImage) {
        try {
          const coverImg = await loadImage(getEventImageUrl(eventData.eventImage))
          // Add event cover image
          doc.addImage(coverImg, "JPEG", 20, 40, 50, coverImageHeight, undefined, "FAST")
          imageAdded = true
        } catch (imgErr) {
          console.error("Error adding event cover image to PDF:", imgErr)
          // Continue without the image
        }
      }

      // Add event details
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(44, 62, 80) // #2c3e50 - dark blue

      // Position event name based on whether image was added
      const eventNameX = imageAdded ? 80 : pageWidth / 2
      const eventNameAlign = imageAdded ? "left" : "center"
      doc.text(eventData.eventName, eventNameX, 50, { align: eventNameAlign })

      // Add event date and location
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(73, 80, 87) // #495057 - dark gray

      doc.text(`Date: ${eventData.eventDate}`, eventNameX, 58, { align: eventNameAlign })
      doc.text(`Location: ${eventData.eventLocation}`, eventNameX, 65, { align: eventNameAlign })

      // Add line
      doc.setDrawColor(76, 161, 175) // #4ca1af - teal
      doc.setLineWidth(0.5)
      doc.line(20, 75, pageWidth - 20, 75)

      // Add ticket details table
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(44, 62, 80) // #2c3e50 - dark blue
      doc.text("TICKET DETAILS", 20, 85)

      // Create ticket table with comprehensive information
      const ticketTableHeaders = [["Attendee Information", "Contact Details", "Ticket Information", "Price"]]

      const ticketTableData = ticketData.map((ticket) => [
        // Attendee Information column
        `${ticket.name || "N/A"} ${ticket.surname || ""}`.trim(),

        // Contact Details column
        `Email: ${ticket.email || "N/A"}
Phone: ${ticket.phone || "N/A"}`,

        // Ticket Information column
        `Type: ${ticket.type || "Standard"}
Quantity: ${ticket.quantity || 1}`,

        // Price column
        `${ticket.unitPrice || "N/A"}`,
      ])

      // Use autoTable as a plugin with improved styling for better readability
      autoTable(doc, {
        head: ticketTableHeaders,
        body: ticketTableData,
        startY: 90,
        theme: "grid",
        headStyles: {
          fillColor: [76, 161, 175], // #4ca1af - teal
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          fontSize: 11,
        },
        styles: {
          fontSize: 9,
          cellPadding: 5,
          overflow: "linebreak",
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: "auto" },
          2: { cellWidth: "auto" },
          3: { cellWidth: 40, halign: "right" },
        },
        margin: { left: 20, right: 20 },
        didParseCell: (data) => {
          // Add some styling to make multiline text more readable
          if (data.section === "body") {
            data.cell.styles.lineWidth = 0.1
          }
        },
      })

      // Calculate total amount from all tickets
      const totalAmount = calculateTotal()

      // Format total amount with currency
      const formattedTotal = formatCurrency(totalAmount)

      // Add total amount
      // Get the final Y position after the table
      const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 100) + 10
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(44, 62, 80) // #2c3e50 - dark blue
      doc.text("Total Amount:", pageWidth - 70, finalY)
      doc.text(formattedTotal, pageWidth - 20, finalY, { align: "right" })

      // Add a subtle line above the total
      doc.setDrawColor(76, 161, 175) // #4ca1af - teal
      doc.setLineWidth(0.5)
      doc.line(pageWidth - 120, finalY - 5, pageWidth - 20, finalY - 5)

      // Add payment information
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("PAYMENT INFORMATION", 20, finalY + 20)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text("Payment Status: Paid", 20, finalY + 28)
      doc.text("Payment Date: " + purchaseDate, 20, finalY + 35)
      doc.text("Transaction ID: " + invoiceNumber, 20, finalY + 42)

      // Add notes section
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("NOTES", 20, finalY + 55)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.text("• This invoice serves as proof of purchase for the event tickets.", 20, finalY + 63)
      doc.text("• Please retain this invoice for your records and present it if required.", 20, finalY + 70)

      // Add footer
      doc.setFillColor(44, 62, 80) // #2c3e50 - dark blue
      doc.rect(0, pageHeight - 10, pageWidth, 10, "F")

      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(255, 255, 255) // White text for footer
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, pageHeight - 4)
      doc.text("Powered by XpressTicket", pageWidth - 10, pageHeight - 4, { align: "right" })

      // Save the PDF with sanitized filename
      try {
        const sanitizedName = eventData.eventName.replace(/\s+/g, "_")
        doc.save(`${sanitizedName}_Invoice_${invoiceNumber}.pdf`)
      } catch (error) {
        console.error("Error saving PDF with custom filename:", error)
        // Fallback to generic filename
        doc.save("invoice.pdf")
      }

      setIsGenerating(false)
    } catch (error) {
      console.error("Error generating PDF:", error)
      setIsGenerating(false)
      alert("Error generating PDF. Please try again.")
    }
  }

  const handleDownload = (e) => {
    e.preventDefault()
    generatePDF()
  }

  const handlePrint = () => {
    window.print()
  }

  const handleLogout = () => {
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("userInfo")
    navigate("/")
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        width: "100%",
        margin: 0,
        padding: 0,
      }}
    >
      {/* Header with Logo and Logout */}
      <header
        style={{
          background: "linear-gradient(135deg, #2c3e50, #4ca1af)",
          color: "white",
          padding: "15px 20px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          width: "100%",
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
              onClick={handleGoBack}
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

      <main style={{ padding: "20px 15px", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
        {/* Invoice Preview Card */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 5px 20px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
            marginBottom: "20px",
          }}
        >
          {/* Invoice Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #2c3e50, #4ca1af)",
              color: "white",
              padding: "30px",
              textAlign: "center",
              position: "relative",
            }}
          >
            <img
              src="/XPRESS TICKETS LOGO2.png"
              alt="XpressTicket Logo"
              style={{ height: "50px", marginBottom: "15px" }}
            />
            <h1 style={{ margin: "0", fontSize: "2rem", fontWeight: "600" }}>INVOICE</h1>
            <div style={{ marginTop: "15px", display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <span>Invoice #: {invoiceNumber}</span>
              <span>Date: {purchaseDate}</span>
            </div>
          </div>

          {/* Event Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, #20c997, #0ca678)",
              color: "white",
              padding: "25px",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px",
            }}
          >
            {eventData.eventImage && (
              <img
                src={getEventImageUrl(eventData.eventImage) || "/placeholder.svg"}
                alt="Event"
                style={{
                  height: "60px",
                  width: "60px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                }}
                onError={(e) => {
                  e.target.style.display = "none"
                }}
              />
            )}
            <div>
              <h2 style={{ margin: "0 0 10px", fontSize: "1.5rem", fontWeight: "600" }}>{eventData.eventName}</h2>
              <div style={{ display: "flex", justifyContent: "center", gap: "30px", fontSize: "0.9rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaCalendarAlt />
                  <span>{eventData.eventDate}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaMapMarkerAlt />
                  <span>{eventData.eventLocation}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Content */}
          <div style={{ padding: "30px" }}>
            <h3
              style={{
                fontSize: "1.2rem",
                color: "#2c3e50",
                margin: "0 0 20px",
                paddingBottom: "10px",
                borderBottom: "2px solid #20c997",
              }}
            >
              Ticket Details
            </h3>

            {/* Tickets Table */}
            <div style={{ marginBottom: "30px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8f9fa" }}>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        borderBottom: "2px solid #dee2e6",
                        color: "#495057",
                      }}
                    >
                      Attendee
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        borderBottom: "2px solid #dee2e6",
                        color: "#495057",
                      }}
                    >
                      Contact
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        borderBottom: "2px solid #dee2e6",
                        color: "#495057",
                      }}
                    >
                      Ticket Type
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        borderBottom: "2px solid #dee2e6",
                        color: "#495057",
                      }}
                    >
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ticketData.map((ticket, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #dee2e6" }}>
                      <td style={{ padding: "12px", color: "#495057" }}>
                        {ticket.name} {ticket.surname}
                      </td>
                      <td style={{ padding: "12px", color: "#495057", fontSize: "0.9rem" }}>
                        <div>{ticket.email}</div>
                        <div>{ticket.phone}</div>
                      </td>
                      <td style={{ padding: "12px", color: "#495057" }}>
                        <div>{ticket.type}</div>
                        <div style={{ fontSize: "0.8rem", color: "#6c757d" }}>Qty: {ticket.quantity}</div>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", color: "#059669", fontWeight: "600" }}>
                        {ticket.unitPrice}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Section */}
            <div
              style={{
                borderTop: "2px solid #dee2e6",
                paddingTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: "600", color: "#2c3e50", marginBottom: "5px" }}>
                  Total Amount: <span style={{ color: "#059669" }}>{formatCurrency(calculateTotal())}</span>
                </div>
                <div style={{ fontSize: "0.9rem", color: "#6c757d" }}>
                  Payment Status: <span style={{ color: "#28a745", fontWeight: "500" }}>Paid</span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div style={{ marginTop: "30px", padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
              <h4 style={{ margin: "0 0 10px", color: "#495057" }}>Notes:</h4>
              <ul style={{ margin: "0", paddingLeft: "20px", color: "#6c757d", fontSize: "0.9rem" }}>
                <li>This invoice serves as proof of purchase for the event tickets.</li>
                <li>Please retain this invoice for your records and present it if required.</li>
                <li>For any queries, please contact our support team.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons - Removed View Tickets button */}
        <div
          style={{
            display: "flex",
            gap: "15px",
            justifyContent: "center",
            marginBottom: "30px",
          }}
        >
          <button
            onClick={() => alert("Invoice sent to your email!")}
            style={{
              backgroundColor: "#6c757d",
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
              e.target.style.backgroundColor = "#5a6268"
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#6c757d"
            }}
          >
            <FaEnvelope /> Email Invoice
          </button>

          <button
            onClick={handleDownload}
            disabled={isGenerating}
            style={{
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "500",
              cursor: isGenerating ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "background-color 0.2s ease",
              opacity: isGenerating ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isGenerating) e.target.style.backgroundColor = "#218838"
            }}
            onMouseLeave={(e) => {
              if (!isGenerating) e.target.style.backgroundColor = "#28a745"
            }}
          >
            <FaDownload /> {isGenerating ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </main>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .invoice-preview, .invoice-preview * {
              visibility: visible;
            }
            .invoice-preview {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            header, .action-buttons {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  )
}

export default InvoicePreview
