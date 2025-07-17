"use client"

import { useState, useEffect } from "react"
import "./ReviewParchase.css"
import { useNavigate } from "react-router-dom"
import "../shared/ModernDashboard.css"
import { FaSignOutAlt, FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaClock, FaMoneyBillWave } from "react-icons/fa"
import { DEFAULT_IMAGE_DATA_URI } from "../utils/imageUtils"

function ReviewParchase() {
  const nav = useNavigate()
  const [purchasedEvents, setPurchasedEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPurchasedTickets = async () => {
      try {
        setLoading(true)

        const token = sessionStorage.getItem("token")

        if (!token) {
          console.warn("No authentication token found in session storage")
          nav("/login")
          return
        }

        // Get user ID from token
        let userId = null
        try {
          const tokenPayload = JSON.parse(atob(token.split(".")[1]))
          if (tokenPayload && tokenPayload.userId) {
            userId = tokenPayload.userId
          } else {
            throw new Error("User ID not found in token")
          }
        } catch (e) {
          console.error("Could not parse token for user ID:", e)
          nav("/login")
          return
        }

        console.log("Fetching purchased tickets for user ID:", userId)

        // Fetch user's approved ticket purchases
        const ticketPurchasesResponse = await fetch(`http://localhost:5000/api/user-ticket-purchases/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!ticketPurchasesResponse.ok) {
          throw new Error(`Failed to fetch ticket purchases: ${ticketPurchasesResponse.statusText}`)
        }

        const ticketPurchasesData = await ticketPurchasesResponse.json()
        console.log("User ticket purchases data:", ticketPurchasesData)

        // If no approved tickets, show empty state
        if (!ticketPurchasesData || ticketPurchasesData.length === 0) {
          setPurchasedEvents([])
          return
        }

        // Group purchases by event_id for the logged-in user
        const eventGroups = {}

        // First, filter to only include purchases for the current user
        const userPurchases = ticketPurchasesData.filter(purchase => 
          purchase.user_id === userId || purchase.userId === userId
        )

        console.log("Filtered user purchases:", userPurchases)

        // Process each purchase for the current user
        userPurchases.forEach((purchase) => {
          const eventId = purchase.event_id
          const purchaseId = purchase.purchase_id
          
          // Initialize event group if it doesn't exist
          if (!eventGroups[eventId]) {
            eventGroups[eventId] = {
              eventData: purchase,
              purchases: [],
              purchaseMap: new Map(), // Track unique purchases by purchase_id
              totalTickets: 0,
              totalAmount: 0,
              latestPurchaseDate: purchase.purchase_date,
            }
          }
          
          // Only process this purchase if we haven't seen this purchase_id before
          if (!eventGroups[eventId].purchaseMap.has(purchaseId)) {
            eventGroups[eventId].purchaseMap.set(purchaseId, true)
            eventGroups[eventId].purchases.push(purchase)
            
            // Update latest purchase date if this one is more recent
            if (new Date(purchase.purchase_date) > new Date(eventGroups[eventId].latestPurchaseDate)) {
              eventGroups[eventId].latestPurchaseDate = purchase.purchase_date
            }
            
            // Add to totals for this event
            const tickets = parseInt(purchase.number_of_tickets, 10) || 1
            eventGroups[eventId].totalTickets += tickets
            
            // Safely handle amount
            let amount = 0
            try {
              if (purchase.amount !== null && purchase.amount !== undefined) {
                const numericAmount = 
                  typeof purchase.amount === "string" ? Number.parseFloat(purchase.amount) : purchase.amount
                if (!isNaN(numericAmount)) {
                  amount = numericAmount
                }
              }
            } catch (amountError) {
              console.warn("Error processing amount for purchase:", purchase.purchase_id, amountError)
            }
            
            eventGroups[eventId].totalAmount += amount
          }
        })

        // Convert grouped data to display format
        const eventsWithPurchaseInfo = Object.values(eventGroups).map((group) => {
          const purchase = group.eventData
          const isPast = new Date(purchase.event_date) < new Date()

          console.log(
            `ReviewPurchase - Event ${purchase.event_id} (${purchase.event_name}) - Total tickets: ${group.totalTickets}, Total amount: ${group.totalAmount}`,
          )

          return {
            _id: purchase.event_id,
            id: purchase.event_id,
            name: purchase.event_name,
            location: purchase.location || "TBA",
            date: purchase.event_date || "TBA",
            time: purchase.event_time || "TBA",
            description: purchase.description || "Event description not available",
            capacity: purchase.capacity || 0,
            event_type: purchase.event_type || "Event",
            file_url: purchase.file_url || DEFAULT_IMAGE_DATA_URI,

            // Aggregated purchase information
            ticketId: `ticket-${purchase.purchase_id}`,
            ticketType: purchase.package_type || "Standard",
            ticketPrice: group.totalAmount.toFixed(2),
            numberOfTickets: group.totalTickets,
            purchaseDate: group.latestPurchaseDate || new Date().toISOString(),
            purchaseId: purchase.purchase_id,
            status: isPast ? "Past" : "Active",

            // Store all purchases for this event (in case needed for detailed view)
            allPurchases: group.purchases,
          }
        })

        // Sort by purchase date (most recent first)
        eventsWithPurchaseInfo.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))

        setPurchasedEvents(eventsWithPurchaseInfo)
      } catch (err) {
        console.error("Error fetching purchased tickets:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPurchasedTickets()
  }, [nav])

  return (
    <div className="modern-dashboard-container">
      <header className="modern-header">
        <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="modern-logo" />
        <div className="modern-header-actions">
          <button className="modern-logout-btn" onClick={() => nav("/")}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      <div className="modern-back-button">
        <button className="modern-back-btn" onClick={() => nav("/customerdash")}>
          <FaArrowLeft /> Back to Dashboard
        </button>
      </div>

      <main className="purchase-main-content">
        <h1 className="purchase-page-title">My Purchased Tickets</h1>
        <p className="purchase-page-description">View all events you've purchased tickets for</p>

        <div className="purchase-card-grid">
          {loading ? (
            <div className="purchase-loading">
              <p>Loading your tickets...</p>
            </div>
          ) : error ? (
            <div className="purchase-error">
              <p>Error loading your tickets: {error}</p>
              <button className="purchase-retry-btn" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          ) : purchasedEvents.length === 0 ? (
            <div className="purchase-no-tickets">
              <p>You haven't purchased any tickets yet.</p>
              <button className="purchase-browse-btn" onClick={() => nav("/eventmenu")}>
                Browse Events
              </button>
            </div>
          ) : (
            purchasedEvents.map((event, index) => (
              <div
                className="purchase-event-container"
                key={`event-${event.id}-${index}`}
                onClick={() =>
                  nav("/parchasedticket", {
                    state: {
                      eventId: event.id || event._id,
                      eventName: event.name,
                      eventDate: event.date,
                      eventLocation: event.location,
                      eventPrice: event.ticketPrice,
                      numberOfTickets: event.numberOfTickets,
                      ticketType: event.ticketType,
                      purchaseDate: event.purchaseDate,
                      purchaseId: event.purchaseId,
                    },
                  })
                }
              >
                <div className="purchase-event-card">
                  <div
                    className={`purchase-event-status ${event.status === "Past" ? "purchase-event-status-past" : ""}`}
                  >
                    {event.status}
                  </div>
                  <div className="purchase-event-image-container">
                    <img
                      src={event.file_url || DEFAULT_IMAGE_DATA_URI}
                      alt={event.name}
                      className="purchase-event-image"
                      onError={(e) => {
                        if (e.target.src !== DEFAULT_IMAGE_DATA_URI) {
                          console.warn(`Failed to load image for event ${event.id || event._id}: ${e.target.src}`)
                          e.target.src = DEFAULT_IMAGE_DATA_URI
                        }
                      }}
                    />
                  </div>
                  <div className="purchase-event-title-container">
                    <h3 className="purchase-event-title">{event.name}</h3>
                  </div>
                </div>

                <div className="purchase-event-details-card">
                  <div className="purchase-event-detail-item">
                    <FaMapMarkerAlt className="purchase-event-icon" />
                    <span>{event.location || "TBA"}</span>
                  </div>
                  <div className="purchase-event-detail-item">
                    <FaCalendarAlt className="purchase-event-icon" />
                    <span>{event.date || "TBA"}</span>
                  </div>
                  <div className="purchase-event-detail-item">
                    <FaClock className="purchase-event-icon" />
                    <span>{event.time || "TBA"}</span>
                  </div>
                  <div className="purchase-event-detail-item purchase-event-price">
                    <FaMoneyBillWave className="purchase-event-icon" />
                    <span>R {event.ticketPrice || "N/A"}</span>
                  </div>
                  <div className="purchase-event-detail-item">
                    <span className="purchase-ticket-count">
                      {event.numberOfTickets} ticket{event.numberOfTickets !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="purchase-button-group">
                    <button 
                      className="purchase-view-tickets-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        nav("/parchasedticket", {
                          state: {
                            eventId: event.id || event._id,
                            eventName: event.name,
                            eventDate: event.date,
                            eventLocation: event.location,
                            eventPrice: event.ticketPrice,
                            numberOfTickets: event.numberOfTickets,
                            ticketType: event.ticketType,
                            purchaseDate: event.purchaseDate,
                            purchaseId: event.purchaseId,
                          },
                        });
                      }}
                    >
                      View Tickets
                    </button>
                    <button
                      className="purchase-invoice-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        nav("/invoice", {
                          state: {
                            eventId: event.id || event._id,
                            eventName: event.name,
                            eventDate: event.date,
                            eventLocation: event.location,
                            eventPrice: `R ${event.ticketPrice || "N/A"}`,
                            numberOfTickets: event.numberOfTickets,
                            purchaseId: event.purchaseId,
                            ticketType: event.ticketType,
                          },
                        })
                      }}
                    >
                      Invoice
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}

export default ReviewParchase
