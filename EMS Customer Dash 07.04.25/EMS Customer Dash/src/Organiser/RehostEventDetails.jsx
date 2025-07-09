"use client"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import "./RehostEventDetails.css"

const RehostEventDetails = () => {
  const nav = useNavigate()
  const location = useLocation()
  const { eventid } = location.state || {}

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    startdate: "",
    enddate: "",
  })
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Helper function to format date without timezone issues (from EventRequest.jsx)
  const formatDate = (dateString) => {
    if (!dateString) {
      console.warn("Date string is empty or null")
      return "Date not specified"
    }

    try {
      console.log("Received dateString:", dateString) // Debug log
      // Split and validate YYYY-MM-DD format
      const [year, month, day] = dateString.split('-')
      if (!year || !month || !day || year.length !== 4 || isNaN(Date.parse(`${year}-${month}-${day}`))) {
        throw new Error("Invalid date format")
      }

      // Create date without timezone offset
      const date = new Date(`${year}-${month}-${day}`)
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date")
      }

      // Format without timezone adjustment
      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
      return date.toLocaleDateString("en-US", options)
    } catch (error) {
      console.error("Date formatting error:", error, "Date string:", dateString)
      return "Date not specified"
    }
  }

  // Helper function to format time (aligned with EventRequest.jsx)
  const formatTime = (timeString) => {
    if (!timeString) {
      console.warn("Time string is empty or null")
      return "Time not specified"
    }

    try {
      // Validate HH:MM format
      const timeParts = timeString.split(":")
      if (timeParts.length < 2 || isNaN(Number.parseInt(timeParts[0], 10)) || isNaN(Number.parseInt(timeParts[1], 10))) {
        throw new Error("Invalid time format")
      }
      return timeString // Return as is, matching EventRequest.jsx
    } catch (error) {
      console.error("Time formatting error:", error, "Time string:", timeString)
      return "Time not specified"
    }
  }

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = sessionStorage.getItem("token")
        if (!token) {
          setError("No authentication token found. Please log in.")
          nav("/login")
          return
        }

        console.log("Fetching event details for ID:", eventid)

        const response = await fetch(`http://localhost:5000/api/events/${eventid}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        })

        console.log("Response status:", response.status)

        if (!response.ok) {
          const errorData = await response.json()
          console.error("API Error:", errorData)

          if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem("token")
            sessionStorage.removeItem("userId")
            sessionStorage.removeItem("user")
            nav("/login")
            return
          }
          throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Event data received:", data)

        setEvent(data)

        // Set form data with aliased names from API
        setFormData({
          startdate: data.start_date ? data.start_date.split("T")[0] : "", // Extract YYYY-MM-DD
          enddate: data.end_date ? data.end_date.split("T")[0] : "", // Extract YYYY-MM-DD
        })
      } catch (err) {
        console.error("Fetch error:", err)
        setError(err.message || "Failed to load event details.")
      } finally {
        setLoading(false)
      }
    }

    if (eventid) {
      fetchEventDetails()
    } else {
      setError("No event ID provided.")
      setLoading(false)
    }
  }, [eventid, nav])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (submitError) setSubmitError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)
    setIsSubmitting(true)

    try {
      const token = sessionStorage.getItem("token") // Fixed typo: getAmbient -> getItem
      if (!token) {
        setSubmitError("No authentication token found. Please log in.")
        nav("/login")
        return
      }

      const currentDate = new Date().toISOString().split("T")[0]

      if (!formData.startdate || !formData.enddate) {
        setSubmitError("Please select both start and end dates.")
        return
      }

      if (new Date(formData.startdate) < new Date(currentDate)) {
        setSubmitError("Start date must be today or in the future.")
        return
      }

      if (new Date(formData.enddate) < new Date(formData.startdate)) {
        setSubmitError("End date must be on or after the start date.")
        return
      }

      console.log("Submitting rehost request:", {
        eventId: eventid,
        startdate: formData.startdate,
        enddate: formData.enddate,
      })

      const response = await fetch(`http://localhost:5000/api/events/${eventid}/rehost`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startdate: formData.startdate,
          enddate: formData.enddate,
          resetAttendees: true,
        }),
      })

      console.log("Rehost response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Rehost error:", errorData)
        throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log("Rehost success:", result)

      setSubmitSuccess("Event rehost request submitted successfully. Awaiting admin approval.")

      setTimeout(() => {
        nav("/rehost-event")
      }, 3000)
    } catch (err) {
      console.error("Submit error:", err)
      setSubmitError(err.message || "Failed to submit rehost request.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container12">
        <header className="dashboard-header1">
          <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="dashboard-logo1" />
          <div className="profile-section">
            <button
              className="backbutton22"
              onClick={() => {
                sessionStorage.removeItem("token")
                sessionStorage.removeItem("userId")
                sessionStorage.removeItem("user")
                nav("/login")
              }}
            >
              LogOut
            </button>
          </div>
        </header>
        <div className="back-button-container1">
          <button className="backbutton20" onClick={() => nav("/rehost-event")}>
            Back
          </button>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container12">
        <header className="dashboard-header1">
          <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="dashboard-logo1" />
          <div className="profile-section">
            <button
              className="backbutton22"
              onClick={() => {
                sessionStorage.removeItem("token")
                sessionStorage.removeItem("userId")
                sessionStorage.removeItem("user")
                nav("/login")
              }}
            >
              LogOut
            </button>
          </div>
        </header>
        <div className="back-button-container1">
          <button className="backbutton20" onClick={() => nav("/rehost-event")}>
            Back
          </button>
        </div>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Event Details</h3>
          <p className="error-message">{error}</p>
          <div className="action-buttons">
            <button
              className="retry-button"
              onClick={() => {
                setError(null)
                setLoading(true)
                window.location.reload()
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container12">
        <div className="error-container">
          <p>No event data available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container12">
      <header className="dashboard-header1">
        <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="dashboard-logo1" />
        <div className="profile-section">
          <button
            className="backbutton22"
            onClick={() => {
              sessionStorage.removeItem("token")
              sessionStorage.removeItem("userId")
              sessionStorage.removeItem("user")
              nav("/login")
            }}
          >
            LogOut
          </button>
        </div>
      </header>

      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav("/rehost-event")}>
          Back
        </button>
      </div>

      <h2 className="title">Rehost Event: {event.name || "Unnamed Event"}</h2>

      <div className="main-content">
        <div className="event-details-card">
          <div className="card-image-container">
            <img
              src={event.coverimage || "/default-event-image.jpg"}
              alt={event.name || "Event"}
              className="card-image"
              onError={(e) => {
                if (e.target.src !== "/default-event-image.jpg") {
                  e.target.src = "/default-event-image.jpg"
                  e.target.classList.add("image-error")
                }
              }}
            />
          </div>

          <div className="card-details">
            <div className="detail-row">
              <strong>Location:</strong>
              <span>{event.location || "Not specified"}</span>
            </div>
            <div className="detail-row">
              <strong>Current Start Date:</strong>
              <span>{formatDate(event.start_date)}</span>
            </div>
            <div className="detail-row">
              <strong>Current End Date:</strong>
              <span>{formatDate(event.end_date)}</span>
            </div>
            <div className="detail-row">
              <strong>Start Time:</strong>
              <span>{formatTime(event.start_time)}</span>
            </div>
            <div className="detail-row">
              <strong>End Time:</strong>
              <span>{formatTime(event.end_time)}</span>
            </div>
            <div className="detail-row">
              <strong>Capacity:</strong>
              <span>{event.capacity || "Not specified"}</span>
            </div>
            {event.description && (
              <div className="detail-row description">
                <strong>Description:</strong>
                <span>{event.description}</span>
              </div>
            )}
          </div>
        </div>

        <div className="rehost-form-card">
          <h3 className="form-title">Select New Dates</h3>
          <form onSubmit={handleSubmit} className="rehost-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startdate">New Start Date:</label>
                <input
                  type="date"
                  id="startdate"
                  name="startdate"
                  value={formData.startdate}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  disabled={isSubmitting}
                  className="date-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="enddate">New End Date:</label>
                <input
                  type="date"
                  id="enddate"
                  name="enddate"
                  value={formData.enddate}
                  onChange={handleInputChange}
                  required
                  min={formData.startdate || new Date().toISOString().split("T")[0]}
                  disabled={isSubmitting}
                  className="date-input"
                />
              </div>
            </div>

            {submitError && (
              <div className="message error-message">
                <span className="message-icon">❌</span>
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="message success-message">
                <span className="message-icon">✅</span>
                {submitSuccess}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className={`submit-btn ${isSubmitting ? "submitting" : ""}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Submitting...
                  </>
                ) : (
                  "Submit Rehost Request"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RehostEventDetails