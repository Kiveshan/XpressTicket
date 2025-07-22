"use client"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { format } from "date-fns"
import "./RehostEventDetails.css"

const RehostEventDetails = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { eventid } = location.state || {}
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    startdate: "",
    enddate: "",
    deadline_date: "",
    packages: [],
  })
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Helper function to format date using date-fns
  const formatDate = (dateString) => {
    if (!dateString) {
      console.warn("Date string is empty or null")
      return "Date not specified"
    }
    try {
      console.log("Received dateString:", dateString)
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date")
      }
      return format(date, "MMM dd, yyyy")
    } catch (error) {
      console.error("Date formatting error:", error, "Date string:", dateString)
      return "Date not specified"
    }
  }

  // Helper function to format time
  const formatTime = (timeString) => {
    if (!timeString) {
      console.warn("Time string is empty or null")
      return "Time not specified"
    }
    try {
      const timeParts = timeString.split(":")
      if (
        timeParts.length < 2 ||
        isNaN(Number.parseInt(timeParts[0], 10)) ||
        isNaN(Number.parseInt(timeParts[1], 10))
      ) {
        throw new Error("Invalid time format")
      }
      return timeString
    } catch (error) {
      console.error("Time formatting error:", error, "Time string:", timeString)
      return "Time not specified"
    }
  }

  // Calculate max package date (one week before registration deadline)
  const getMaxPackageDate = () => {
    if (!formData.deadline_date) return null
    const deadlineDate = new Date(formData.deadline_date + "T00:00:00Z")
    const maxDate = new Date(deadlineDate)
    maxDate.setDate(deadlineDate.getDate() - 7)
    return maxDate.toISOString().split("T")[0]
  }

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = sessionStorage.getItem("token")
        if (!token) {
          setError("No authentication token found. Please log in.")
          navigate("/login")
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
            navigate("/login")
            return
          }
          throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Event data received:", data)
        setEvent(data)

        setFormData({
          startdate: data.start_date ? new Date(data.start_date).toISOString().split("T")[0] : "",
          enddate: data.end_date ? new Date(data.end_date).toISOString().split("T")[0] : "",
          deadline_date: data.registration_deadline_date
            ? new Date(data.registration_deadline_date).toISOString().split("T")[0]
            : "",
          packages:
            data.packages && Array.isArray(data.packages)
              ? data.packages.map((pkg) => ({
                  startDate: pkg.startDate ? new Date(pkg.startDate).toISOString().split("T")[0] : "",
                  endDate: pkg.endDate ? new Date(pkg.endDate).toISOString().split("T")[0] : "",
                }))
              : [],
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
  }, [eventid, navigate])

  const handleInputChange = (e, index = null) => {
    const { name, value } = e.target
    if (index !== null) {
      setFormData((prev) => {
        const updatedPackages = [...prev.packages]
        updatedPackages[index] = {
          ...updatedPackages[index],
          [name]: value,
        }
        return { ...prev, packages: updatedPackages }
      })
    } else {
      setFormData((prev) => {
        const updatedData = { ...prev, [name]: value }
        if (name === "startdate" && value) {
          const deadlineDate = new Date(value)
          deadlineDate.setDate(deadlineDate.getDate() - 1)
          updatedData.deadline_date = deadlineDate.toISOString().split("T")[0]
        }
        return updatedData
      })
    }
    if (submitError) setSubmitError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)
    setIsSubmitting(true)

    try {
      const token = sessionStorage.getItem("token")
      if (!token) {
        setSubmitError("No authentication token found. Please log in.")
        navigate("/login")
        return
      }

      const currentDate = new Date().toISOString().split("T")[0]

      if (!formData.startdate || !formData.enddate || !formData.deadline_date) {
        setSubmitError("Please select event start, end, and registration deadline dates.")
        return
      }

      const startDateObj = new Date(formData.startdate)
      const endDateObj = new Date(formData.enddate)
      const deadlineDateObj = new Date(formData.deadline_date)

      if (startDateObj < new Date(currentDate)) {
        setSubmitError("Event start date must be today or in the future.")
        return
      }

      if (endDateObj < startDateObj) {
        setSubmitError("Event end date must be on or after the event start date.")
        return
      }

      if (deadlineDateObj >= startDateObj) {
        setSubmitError("Registration deadline must be one day before the event start date.")
        return
      }

      const maxPackageDate = getMaxPackageDate()
      for (let i = 0; i < formData.packages.length; i++) {
        const pkg = formData.packages[i]
        if (!pkg.startDate || !pkg.endDate) {
          setSubmitError(`Please select start and end dates for package ${i + 1}.`)
          return
        }

        const pkgStartDateObj = new Date(pkg.startDate)
        const pkgEndDateObj = new Date(pkg.endDate)

        if (pkgStartDateObj < new Date(currentDate)) {
          setSubmitError(`Package ${i + 1} start date must be today or in the future.`)
          return
        }

        if (pkgEndDateObj < pkgStartDateObj) {
          setSubmitError(`Package ${i + 1} end date must be on or after the package start date.`)
          return
        }

        if (
          maxPackageDate &&
          (pkgStartDateObj > new Date(maxPackageDate) || pkgEndDateObj > new Date(maxPackageDate))
        ) {
          setSubmitError(
            `Package ${i + 1} start and end dates must be at least one week before the registration deadline date (${formData.deadline_date}).`,
          )
          return
        }
      }

      console.log("Submitting rehost request:", {
        eventId: eventid,
        startdate: formData.startdate,
        enddate: formData.enddate,
        deadline_date: formData.deadline_date,
        packages: formData.packages,
        resetAttendees: false,
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
          deadline_date: formData.deadline_date,
          packages: formData.packages,
          resetAttendees: false,
        }),
      })

      console.log("Rehost response status:", response.status)
      if (!response.ok) {
        const errorData = await response.json()
        console.error("Rehost error:", errorData)
        let errorMessage = errorData.error || `Server error: ${response.status} ${response.statusText}`
        if (errorData.conflicts) {
          errorMessage +=
            ": " +
            errorData.conflicts
              .map(
                (c) =>
                  `${c.eventName} (ID: ${c.eventId}) from ${c.startDate} to ${c.endDate}, overlapping ${c.conflictingPeriod.start} to ${c.conflictingPeriod.end}`,
              )
              .join("; ")
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("Rehost success:", result)
      setSubmitSuccess("Event rehost request submitted successfully. Awaiting admin approval.")

      setTimeout(() => {
        navigate("/rehost-event")
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
        <header className="modern-header">
          <div className="header-left">
            <button className="backbutton20" onClick={() => navigate("/rehost-event")}>
              Back
            </button>
            <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="header-logo" />
          </div>
          <div className="profile-section">
            <button
              className="modern-button"
              onClick={() => {
                sessionStorage.removeItem("token")
                sessionStorage.removeItem("userId")
                sessionStorage.removeItem("user")
                navigate("/login")
              }}
            >
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </header>
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
        <header className="modern-header">
          <div className="header-left">
            <button className="backbutton20" onClick={() => navigate("/rehost-event")}>
              Back
            </button>
            <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="header-logo" />
          </div>
          <div className="profile-section">
            <button
              className="modern-button"
              onClick={() => {
                sessionStorage.removeItem("token")
                sessionStorage.removeItem("userId")
                sessionStorage.removeItem("user")
                navigate("/login")
              }}
            >
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </header>
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
        <header className="modern-header">
          <div className="header-left">
            <button className="backbutton20" onClick={() => navigate("/rehost-event")}>
              Back
            </button>
            <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="header-logo" />
          </div>
          <div className="profile-section">
            <button
              className="modern-button"
              onClick={() => {
                sessionStorage.removeItem("token")
                sessionStorage.removeItem("userId")
                sessionStorage.removeItem("user")
                navigate("/login")
              }}
            >
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </header>
        <div className="error-container">
          <p>No event data available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container12">
      <header className="modern-header">
        <div className="header-left">
          <button className="backbutton20" onClick={() => navigate("/rehost-event")}>
            Back
          </button>
          <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="header-logo" />
        </div>
        <div className="profile-section">
          <button
            className="modern-button"
            onClick={() => {
              sessionStorage.removeItem("token")
              sessionStorage.removeItem("userId")
              sessionStorage.removeItem("user")
              navigate("/login")
            }}
          >
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </header>

      <h2 className="title">Rehost Event: {event.name || "Unnamed Event"}</h2>

      <div className="main-content">
        <div className="event-details-card">
          <div className="card-details">
            <div className="card-details-header">
              <h3>Event Information</h3>
            </div>
            <div className="card-details-content">
              <div className="detail-column">
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
                  <strong>Capacity:</strong>
                  <span>{event.capacity || "Not specified"}</span>
                </div>
              </div>
              <div className="detail-column">
                <div className="detail-row">
                  <strong>Start Time:</strong>
                  <span>{formatTime(event.start_time)}</span>
                </div>
                <div className="detail-row">
                  <strong>End Time:</strong>
                  <span>{formatTime(event.end_time)}</span>
                </div>
                <div className="detail-row">
                  <strong>Current Registration Deadline:</strong>
                  <span>{formatDate(event.registration_deadline_date)}</span>
                </div>
                {event.description && (
                  <div className="detail-row description">
                    <strong>Description:</strong>
                    <span>{event.description}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rehost-form-card">
          <div className="card-details-header">
            <h3>Select New Dates</h3>
          </div>
          <div className="form-container">
            <form onSubmit={handleSubmit} className="rehost-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startdate">New Event Start Date:</label>
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
                  <label htmlFor="enddate">New Event End Date:</label>
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

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="deadline_date">New Registration Deadline Date:</label>
                  <input
                    type="date"
                    id="deadline_date"
                    name="deadline_date"
                    value={formData.deadline_date}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split("T")[0]}
                    max={formData.startdate ? new Date(formData.startdate).toISOString().split("T")[0] : ""}
                    disabled={isSubmitting || !formData.startdate}
                    className="date-input"
                  />
                </div>
              </div>

              {formData.packages.map((pkg, index) => (
                <div key={index} className="form-row">
                  <div className="form-group">
                    <label htmlFor={`packageStartDate-${index}`}>New Package {index + 1} Start Date:</label>
                    <input
                      type="date"
                      id={`packageStartDate-${index}`}
                      name="startDate"
                      value={pkg.startDate}
                      onChange={(e) => handleInputChange(e, index)}
                      required
                      min={new Date().toISOString().split("T")[0]}
                      max={getMaxPackageDate()}
                      disabled={isSubmitting || !formData.deadline_date}
                      className="date-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`packageEndDate-${index}`}>New Package {index + 1} End Date:</label>
                    <input
                      type="date"
                      id={`packageEndDate-${index}`}
                      name="endDate"
                      value={pkg.endDate}
                      onChange={(e) => handleInputChange(e, index)}
                      required
                      min={pkg.startDate || new Date().toISOString().split("T")[0]}
                      max={getMaxPackageDate()}
                      disabled={isSubmitting || !formData.deadline_date}
                      className="date-input"
                    />
                  </div>
                </div>
              ))}

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
    </div>
  )
}

export default RehostEventDetails