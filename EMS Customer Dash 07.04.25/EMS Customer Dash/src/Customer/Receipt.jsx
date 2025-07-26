"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { FaSignOutAlt, FaArrowLeft, FaEye, FaCreditCard, FaCheck } from "react-icons/fa"
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

  // Get delegate information from the package
  const getDelegateInfo = (pkg) => {
    // First try to get delegate info directly from the package
    if (pkg.name || pkg.email || pkg.phone) {
      return {
        name: pkg.name || "",
        surname: "", // Surname might not be a separate field
        email: pkg.email || "",
        phone: pkg.phone || ""
      };
    }
    
    // Then try to get from delegate_details if it's a string (JSON)
    if (pkg.delegate_details && typeof pkg.delegate_details === 'string') {
      try {
        const delegateDetails = JSON.parse(pkg.delegate_details);
        return {
          name: delegateDetails.name || "",
          surname: "",
          email: delegateDetails.email || "",
          phone: delegateDetails.phone || ""
        };
      } catch (e) {
        console.error('Error parsing delegate_details:', e);
      }
    }
    
    // Then try to get from delegate_details if it's an object
    if (pkg.delegate_details && typeof pkg.delegate_details === 'object') {
      return {
        name: pkg.delegate_details.name || "",
        surname: "",
        email: pkg.delegate_details.email || "",
        phone: pkg.delegate_details.phone || ""
      };
    }
    
    // Fallback to empty strings if no delegate info is available
    return {
      name: "",
      surname: "",
      email: "",
      phone: ""
    };
  }

  // Handle view ticket - Navigate to ViewTickets page with ticket and event data
  const handleViewTicket = (pkg, index) => {
    if (!purchaseData || !purchaseData.packages || purchaseData.packages.length === 0) {
      alert("No ticket information available")
      return
    }

    setIsDownloading((prev) => ({ ...prev, [index]: true }))

    try {
      // Get delegate information
      const delegateInfo = getDelegateInfo(pkg)
      
      // Create ticket object in the format expected by ViewTickets
      const ticketData = {
        id: pkg.ticketId || `TKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ticketType: pkg.packageDetails || "Standard Ticket",
        price: parseFloat(pkg.amount?.replace(/[^0-9.]/g, '')) || 0,
        status: "Approved",
        delegate: {
          name: delegateInfo.name || "",
          surname: delegateInfo.surname || "",
          email: delegateInfo.email || "",
          phone: delegateInfo.phone
        },
        eventName: purchaseData.event?.name || "Event",
        eventDate: purchaseData.event?.startdate || purchaseData.event?.start_date || purchaseData.event?.date,
        eventLocation: purchaseData.event?.location || "TBA",
        eventImage: purchaseData.event?.eventImage || "",
        quantity: pkg.tickets || 1
      };

      // Create event info object
      const eventInfo = {
        ...purchaseData.event,
        date: purchaseData.event?.startdate || purchaseData.event?.start_date || purchaseData.event?.date,
        time: purchaseData.event?.formattedTime || purchaseData.event?.time || purchaseData.event?.start_time,
        location: purchaseData.event?.location || "TBA"
      };

      // Navigate to ViewTickets with the ticket and event data
      nav('/viewtickets', { 
        state: { 
          ticket: ticketData,
          eventInfo: eventInfo
        } 
      });
      
    } catch (error) {
      console.error("Error preparing ticket data:", error);
      alert("Error loading ticket. Please try again.")
    } finally {
      setIsDownloading((prev) => ({ ...prev, [index]: false }));
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
                    onClick={() => handleViewTicket(pkg, index)}
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
                      <span>Loading...</span>
                    ) : (
                      <>
                        <FaEye style={{ marginRight: "5px" }} />
                        View
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