"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import "./CustomerUploadPOP.css"

const TicketsList = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [ticketData, setTicketData] = useState([])
  const [eventInfo, setEventInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get data passed from ReviewPurchase component
  const passedData = location.state || {}
  const { eventId, eventName, purchases = [] } = passedData

  useEffect(() => {
    const fetchEventAndProcessTickets = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("Processing ticket data for event:", eventId)
        console.log("Purchases data:", purchases)

        // Fetch fresh event details from database
        const token = sessionStorage.getItem("token")
        if (!token) {
          setError("No authentication token found")
          return
        }

        // Fetch event information
        let eventData = null
        if (eventId) {
          try {
            const eventResponse = await fetch(`http://localhost:5000/api/events/${eventId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            })

            if (eventResponse.ok) {
              eventData = await eventResponse.json()
              setEventInfo({
                name: eventData.name,
                coverimage: eventData.coverimage,
                location: eventData.location,
                date: eventData.start_date,
                description: eventData.description,
              })
            } else {
              console.warn("Could not fetch event details, using passed data")
              setEventInfo({
                name: eventName || "Event Details",
                coverimage: null,
                location: null,
                date: null,
              })
            }
          } catch (err) {
            console.error("Error fetching event details:", err)
            setEventInfo({
              name: eventName || "Event Details",
              coverimage: null,
              location: null,
              date: null,
            })
          }
        }

        // Process purchases to extract individual tickets/delegates
        const allTickets = []

        purchases.forEach((purchase, purchaseIndex) => {
          console.log(`Processing purchase ${purchaseIndex + 1}:`, purchase)

          // Parse delegate details from JSONB
          let delegates = []
          if (purchase.delegate_details) {
            try {
              const delegateData =
                typeof purchase.delegate_details === "string"
                  ? JSON.parse(purchase.delegate_details)
                  : purchase.delegate_details

              if (Array.isArray(delegateData)) {
                delegates = delegateData
              } else if (typeof delegateData === "object" && delegateData !== null) {
                // If it's a single object, convert to array
                delegates = [delegateData]
              }

              console.log("Parsed delegates for purchase:", delegates)
            } catch (e) {
              console.error("Error parsing delegate details:", e, purchase.delegate_details)
              // Create a default delegate entry if parsing fails
              delegates = [
                {
                  name: "Unknown Delegate",
                  email: "N/A",
                  phone: "N/A",
                  title: "N/A",
                  gender: "N/A",
                  delegation: "N/A",
                  ieeeNumber: "N/A",
                },
              ]
            }
          }

          // If no delegates found, create default entries
          if (delegates.length === 0) {
            const ticketCount = purchase.number_of_tickets || 1
            for (let i = 0; i < ticketCount; i++) {
              delegates.push({
                name: `Ticket Holder ${i + 1}`,
                email: "N/A",
                phone: "N/A",
                title: "N/A",
                gender: "N/A",
                delegation: "N/A",
                ieeeNumber: "N/A",
              })
            }
          }

          // Parse package information
          let packageInfo = "Standard Package"
          try {
            if (purchase.package) {
              if (typeof purchase.package === "string") {
                // Try to parse as JSON first
                try {
                  const parsedPackage = JSON.parse(purchase.package)
                  packageInfo =
                    parsedPackage.selectType ||
                    parsedPackage.packageType ||
                    parsedPackage.name ||
                    parsedPackage.type ||
                    "Standard Package"
                } catch {
                  // If not JSON, use as string
                  packageInfo = purchase.package
                }
              } else if (typeof purchase.package === "object") {
                packageInfo =
                  purchase.package.selectType ||
                  purchase.package.packageType ||
                  purchase.package.name ||
                  purchase.package.type ||
                  "Standard Package"
              }
            }
          } catch (e) {
            console.warn("Could not parse package info:", purchase.package)
            packageInfo = "Standard Package"
          }

          // Add each delegate as a separate ticket entry
          delegates.forEach((delegate, delegateIndex) => {
            allTickets.push({
              id: `${purchase.purchase_id}-${delegateIndex}`,
              purchaseId: purchase.purchase_id,
              packageDetails: packageInfo,
              title: delegate.title || "N/A",
              name: delegate.name || "N/A",
              gender: delegate.gender || "N/A",
              email: delegate.email || "N/A",
              phone: delegate.phone || "N/A",
              delegation: delegate.delegation || "N/A",
              ieeeNumber: delegate.ieeeNumber || "N/A",
              dayPass: delegate.dayPass || "N/A",
              purchaseAmount: purchase.amount,
              purchaseStatus: purchase.purchase_status,
              purchaseDate: purchase.purchase_date,
            })
          })
        })

        console.log("Processed tickets:", allTickets)
        setTicketData(allTickets)
      } catch (err) {
        console.error("Error processing ticket data:", err)
        setError(`Failed to process ticket data: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    if (purchases.length > 0) {
      fetchEventAndProcessTickets()
    } else {
      setError("No ticket purchase data available")
      setLoading(false)
    }
  }, [eventId, eventName, purchases])

  const handleViewTicket = (ticket) => {
    console.log("Viewing ticket:", ticket)
    navigate("/viewtickets", {
      state: {
        ticketData: ticket,
        eventInfo: eventInfo,
      },
    })
  }

  const handleLogout = () => {
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("userInfo")
    navigate("/")
  }

  if (loading) {
    return (
      <div className="receipt-container2">
        <header className="dashboard-header">
          <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="dashboard-logo" />
          <div className="profile-section">
            <button className="backbutton22" onClick={handleLogout}>
              LogOut
            </button>
          </div>
        </header>

        <div className="back-button-container1">
          <button className="backbutton20" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            flexDirection: "column",
            gap: "20px",
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
            }}
          ></div>
          <p>Loading ticket details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="receipt-container2">
        <header className="dashboard-header">
          <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="dashboard-logo" />
          <div className="profile-section">
            <button className="backbutton22" onClick={handleLogout}>
              LogOut
            </button>
          </div>
        </header>

        <div className="back-button-container1">
          <button className="backbutton20" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            flexDirection: "column",
            gap: "20px",
            color: "#dc2626",
          }}
        >
          <h3>Error Loading Tickets</h3>
          <p>{error}</p>
          <button
            onClick={() => navigate(-1)}
            style={{
              backgroundColor: "#4ca1af",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="receipt-container2">
      <header className="dashboard-header">
        <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="dashboard-logo" />
        <div className="profile-section">
          <button className="backbutton22" onClick={handleLogout}>
            LogOut
          </button>
        </div>
      </header>

      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
      <br />

      <div className="conference-info">
        {eventInfo?.coverimage ? (
          <img
            src={eventInfo.coverimage || "/placeholder.svg"}
            alt="Event Logo"
            className="ictas-logo"
            onError={(e) => {
              e.target.src = "/placeholder.svg?height=100&width=100"
            }}
          />
        ) : (
          <div
            className="ictas-logo"
            style={{
              backgroundColor: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#666",
              fontSize: "12px",
              border: "2px dashed #ccc",
            }}
          >
            No Image
          </div>
        )}
        <h3>{eventInfo?.name || eventName || "Event Details"}</h3>
        {eventInfo?.location && (
          <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}>
            <strong>Location:</strong> {eventInfo.location}
          </p>
        )}
        {eventInfo?.date && (
          <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}>
            <strong>Date:</strong>{" "}
            {new Date(eventInfo.date).toLocaleDateString("en-ZA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      <div className="table-container5">
        {ticketData.length > 0 ? (
          <table className="table">
            <thead>
              <tr className="bg-teal-100 text-sm">
                <th className="p-2 border">Package Details</th>
                <th className="p-2 border">Title</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Gender</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Phone Number</th>
                <th className="p-2 border">Delegation</th>
                <th className="p-2 border">IEEE Number</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>

            <tbody>
              {ticketData.map((ticket, index) => (
                <tr key={ticket.id} className="bg-white">
                  <td className="p-2 border">{ticket.packageDetails}</td>
                  <td className="p-2 border">{ticket.title}</td>
                  <td className="p-2 border">{ticket.name}</td>
                  <td className="p-2 border">{ticket.gender}</td>
                  <td className="p-2 border">{ticket.email}</td>
                  <td className="p-2 border">{ticket.phone}</td>
                  <td className="p-2 border">{ticket.delegation}</td>
                  <td className="p-2 border">{ticket.ieeeNumber}</td>
                  <td className="p-2 border">
                    <button className="viewticket" onClick={() => handleViewTicket(ticket)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#666",
            }}
          >
            <h3>No Tickets Found</h3>
            <p>No ticket data available for this event.</p>
          </div>
        )}
      </div>

      {ticketData.length > 0 && (
        <div style={{ margin: "20px 0", textAlign: "center", color: "#666" }}>
          <p>
            <strong>Total Tickets:</strong> {ticketData.length} | <strong>Event:</strong> {eventInfo?.name || eventName}
          </p>
        </div>
      )}

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
