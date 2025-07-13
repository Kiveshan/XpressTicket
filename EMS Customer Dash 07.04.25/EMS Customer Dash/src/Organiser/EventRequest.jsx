
"use client"

import { useState, useEffect } from "react"
import "./EventRequest.css"
import "./ModernOrganizerStyles.css"
import { useNavigate } from "react-router-dom"
import { ClipLoader } from "react-spinners"

const EventRequest = () => {
  const nav = useNavigate()
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")

  // Helper function to format date without timezone issues
 const formatDate = (dateString) => {
  if (!dateString) return "Date not specified";

  try {
    console.log("Received dateString:", dateString); // Debug log
    // Split and validate YYYY-MM-DD format
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day || year.length !== 4 || isNaN(Date.parse(`${year}-${month}-${day}`))) {
      throw new Error("Invalid date format");
    }

    // Create date without timezone offset
    const date = new Date(`${year}-${month}-${day}`);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }

    // Format without timezone adjustment
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Date not specified";
  }
};
  // Helper function to extract lowest price from packages array
  const extractLowestPrice = (packages) => {
    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      return "N/A"
    }

    try {
      // Parse packages if they are JSON strings and extract pricing
      const prices = packages
        .map(pkg => {
          try {
            // Handle both JSON string and object cases
            const parsedPkg = typeof pkg === 'string' ? JSON.parse(pkg) : pkg
            return parsedPkg.pricing ? parseFloat(parsedPkg.pricing.replace(/[^0-9.]/g, '')) : null
          } catch (e) {
            console.warn(`Failed to parse package: ${JSON.stringify(pkg)}`, e)
            return null
          }
        })
        .filter(price => price !== null && !isNaN(price))

      if (prices.length === 0) {
        return "N/A"
      }

      // Find the lowest price
      const lowestPrice = Math.min(...prices)
      return `R ${lowestPrice.toFixed(2)}`
    } catch (error) {
      console.error("Price extraction error:", error)
      return "N/A"
    }
  }

  useEffect(() => {
    let isMounted = true

    const fetchEvents = async () => {
      if (!isMounted) return

      try {
        setLoading(true)
        setError(null)

        const token = sessionStorage.getItem("token")
        let userId = sessionStorage.getItem("userId")

        if (!userId) {
          const userData = sessionStorage.getItem("user")
          if (userData) {
            try {
              const user = JSON.parse(userData)
              userId = user.id
              if (userId) {
                sessionStorage.setItem("userId", userId)
              }
            } catch (e) {
              console.error("Error parsing user data:", e)
            }
          }
        }

        if (!token || !userId) {
          console.warn("Authentication required - No token or user ID found")
          sessionStorage.removeItem("token")
          sessionStorage.removeItem("userId")
          sessionStorage.removeItem("user")
          nav("/login")
          return
        }

        let tokenPayload
        try {
          const tokenParts = token.split(".")
          if (tokenParts.length !== 3) {
            throw new Error("Invalid token format")
          }
          tokenPayload = JSON.parse(atob(tokenParts[1]))
          const now = Math.floor(Date.now() / 1000)
          if (tokenPayload.exp && tokenPayload.exp < now) {
            throw new Error("Token expired")
          }
        } catch (tokenError) {
          console.error("Token validation error:", tokenError)
          sessionStorage.removeItem("token")
          sessionStorage.removeItem("userId")
          sessionStorage.removeItem("user")
          nav("/login")
          return
        }

        const apiUrl = "http://localhost:5000/api/events"
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        })

        if (!response.ok) {
          const errorData = await response.json()
          if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem("token")
            sessionStorage.removeItem("userId")
            sessionStorage.removeItem("user")
            nav("/login")
            return
          }
          throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`)
        }

        if (!isMounted) return

        const data = await response.json()
        const eventsData = Array.isArray(data) ? data : []
        const eventsWithFormattedData = eventsData.map((event) => ({
          id: event.id || event.event_id,
          eventid: event.id || event.event_id,
          event_name: event.name || "Unnamed Event",
          location: event.location || "Location not specified",
          date: event.start_date || "Date not specified", // Use start_date
          time: event.start_time || "Time not specified", // Use start_time
          price: extractLowestPrice(event.packages), // Extract lowest price
          status: (event.status || "Pending").toLowerCase(),
          file_url: event.coverimage || "/default-event-image.jpg",
          description: event.description || "No description available",
        }))

        if (isMounted) {
          setEvents(eventsWithFormattedData)
          setFilteredEvents(eventsWithFormattedData)
          setError(null)
        }
      } catch (err) {
        console.error("Fetch error:", err)
        if (isMounted) {
          setError(err.message || "Failed to load events. Please try again later.")
          setEvents([])
          setFilteredEvents([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchEvents()
    const interval = setInterval(fetchEvents, 10 * 60 * 1000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [nav])

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredEvents(events)
    } else {
      setFilteredEvents(events.filter((event) => event.status === statusFilter))
    }
  }, [statusFilter, events])

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value)
  }

  const handleImageError = (e) => {
    if (e.target.src !== "/default-event-image.jpg") {
      console.warn(`Failed to load image: ${e.target.src}`)
      e.target.src = "/default-event-image.jpg"
      e.target.classList.add("image-error")
    }
  }

  if (loading) {
    return (
      <div className="modern-container">
        <header className="modern-header">
          <div className="header-left">
            <button className="modern-button" onClick={() => nav("/requestcard")}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
            <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="header-logo" />
          </div>
          <h1 className="header-title">Event Request</h1>
          <button 
            className="modern-button" 
            onClick={() => {
              sessionStorage.removeItem("token")
              sessionStorage.removeItem("userId")
              sessionStorage.removeItem("user")
              nav("/login")
            }}
          >
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </header>
        
        <div className="modern-content">
          <div className="modern-loading">
            <ClipLoader color="#4ca1af" loading={loading} size={50} />
            <p>Loading events...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    const isAuthError = error.includes("log in") || error.includes("expired")
    return (
      <div className="modern-container">
        <header className="modern-header">
          <div className="header-left">
            <button 
              className="modern-button" 
              onClick={() => (isAuthError ? nav("/login") : nav("/requestcard"))}
            >
              <i className="fas fa-arrow-left"></i> {isAuthError ? "Go to Login" : "Back"}
            </button>
            <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="header-logo" />
          </div>
          <h1 className="header-title">Event Request</h1>
          {!isAuthError && (
            <button
              className="modern-button"
              onClick={() => {
                sessionStorage.removeItem("token")
                sessionStorage.removeItem("userId")
                sessionStorage.removeItem("user")
                nav("/login")
              }}
            >
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          )}
        </header>
        
        <div className="modern-content">
          <div className="modern-card">
            <div className="modern-error">
              <i className="fas fa-exclamation-triangle"></i>
              <h3>{isAuthError ? "Authentication Required" : "Error Loading Events"}</h3>
              <p>{error}</p>
              {isAuthError ? (
                <button
                  className="modern-button"
                  onClick={() => {
                    sessionStorage.clear()
                    nav("/login")
                  }}
                >
                  <i className="fas fa-sign-in-alt"></i> Go to Login
                </button>
              ) : (
                <button
                  className="modern-button"
                  onClick={() => {
                    setError(null)
                    setLoading(true)
                    setEvents([])
                    setFilteredEvents([])
                  }}
                >
                  <i className="fas fa-redo"></i> Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modern-container">
      <header className="modern-header">
        <div className="header-left">
          <button className="modern-button" onClick={() => nav("/requestcard")}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="header-logo" />
        </div>
        <h1 className="header-title">Event Request</h1>
        <button 
          className="modern-button" 
          onClick={() => {
            sessionStorage.removeItem("token")
            sessionStorage.removeItem("userId")
            sessionStorage.removeItem("user")
            nav("/login")
          }}
        >
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </header>

      <div className="modern-content">
        <div className="modern-card">
          <div className="modern-card-header">
            <h2 className="modern-section-title">Event Requests</h2>
            <div className="modern-filter">
              <label htmlFor="status-filter" className="modern-filter-label">
                <i className="fas fa-filter"></i> Filter by Status:
              </label>
              <select 
                id="status-filter" 
                value={statusFilter} 
                onChange={handleStatusFilterChange} 
                className="modern-select"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="modern-empty-state">
              <i className="fas fa-calendar-times"></i>
              <p>
                No events found{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}. Create your first event to
                get started!
              </p>
              <button className="modern-button" onClick={() => nav("/create-event")}>
                <i className="fas fa-plus"></i> Create New Event
              </button>
            </div>
          ) : (
            <div className="modern-card-grid">
              {filteredEvents.map((event) => (
                <div key={event.id} className="modern-event-card">
                  <div className="modern-card-image-container">
                    <img
                      src={event.file_url}
                      alt={event.event_name}
                      className="modern-card-image"
                      onError={handleImageError}
                    />
                    {!event.file_url && (
                      <div className="modern-image-placeholder">
                        <i className="fas fa-image"></i>
                        <span>No Image</span>
                      </div>
                    )}
                  </div>
                  <h3 className="modern-card-title">{event.event_name}</h3>
                  <div className="modern-card-details">
                    <p>
                      <i className="fas fa-map-marker-alt"></i> {event.location} <br />
                      <i className="fas fa-calendar-day"></i> {formatDate(event.date)} <br />
                      <i className="fas fa-tag"></i> {event.price} <br />
                      <i className="fas fa-clock"></i> {event.time}
                    </p>
                  </div>
                  <div className="modern-card-footer">
                    <span className={`modern-badge ${event.status.replace(" ", "-").toLowerCase()}`}>
                      {event.status}
                    </span>
                    <button 
                      className="modern-button" 
                      onClick={() => nav("/viewerequest", { state: { eventid: event.id } })}
                    >
                      <i className="fas fa-eye"></i> View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventRequest

