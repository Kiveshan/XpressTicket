"use client"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { format } from 'date-fns'
import "./RehostEventDetails.css"
import "./ModernRehostDetailsStyles.css"

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
    deadline_date: "",
    packages: [], // Array to store { startDate, endDate } for each package
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
      // Handle ISO timestamp by extracting date part or parsing directly
      const date = new Date(dateString);
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
      if (timeParts.length < 2 || isNaN(Number.parseInt(timeParts[0], 10)) || isNaN(Number.parseInt(timeParts[1], 10))) {
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
    if (!formData.deadline_date) return null;
    const deadlineDate = new Date(formData.deadline_date + "T00:00:00Z");
    const maxDate = new Date(deadlineDate);
    maxDate.setDate(deadlineDate.getDate() - 7);
    return maxDate.toISOString().split("T")[0];
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

        // Initialize form data with event and package dates, ensuring date-only format
        setFormData({
          startdate: data.start_date ? new Date(data.start_date).toISOString().split("T")[0] : "",
          enddate: data.end_date ? new Date(data.end_date).toISOString().split("T")[0] : "",
          deadline_date: data.registration_deadline_date ? new Date(data.registration_deadline_date).toISOString().split("T")[0] : "",
          packages: data.packages && Array.isArray(data.packages) ? 
            data.packages.map(pkg => ({
              startDate: pkg.startDate ? new Date(pkg.startDate).toISOString().split("T")[0] : "",
              endDate: pkg.endDate ? new Date(pkg.endDate).toISOString().split("T")[0] : "",
            })) : [],
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

  const handleInputChange = (e, index = null) => {
    const { name, value } = e.target
    if (index !== null) {
      // Handle package date inputs
      setFormData(prev => {
        const updatedPackages = [...prev.packages]
        updatedPackages[index] = {
          ...updatedPackages[index],
          [name]: value,
        }
        return { ...prev, packages: updatedPackages }
      })
    } else {
      // Handle event date inputs
      setFormData(prev => {
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
        nav("/login")
        return
      }

      const currentDate = new Date().toISOString().split("T")[0]

      // Validate event dates
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

      // Validate package dates
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

        if (maxPackageDate && (pkgStartDateObj > new Date(maxPackageDate) || pkgEndDateObj > new Date(maxPackageDate))) {
          setSubmitError(`Package ${i + 1} start and end dates must be at least one week before the registration deadline date (${formData.deadline_date}).`)
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
          errorMessage += ": " + errorData.conflicts
            .map(c => `${c.eventName} (ID: ${c.eventId}) from ${c.startDate} to ${c.endDate}, overlapping ${c.conflictingPeriod.start} to ${c.conflictingPeriod.end}`)
            .join("; ")
        }
        throw new Error(errorMessage)
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
      <div className="modern-container">
        <header className="modern-header">
          <div className="header-left">
            <img
              src="/logo.png"
              alt="XpressTicket Logo"
              className="header-logo"
            />
            <h1 className="header-title">Rehost Event</h1>
          </div>
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
          <button className="modern-button" onClick={() => nav("/rehost-event")}>
            <i className="fas fa-arrow-left"></i> Back to Events
          </button>

          <div className="modern-loading">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading event details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="modern-container">
        <header className="modern-header">
          <div className="header-left">
            <img
              src="/logo.png"
              alt="XpressTicket Logo"
              className="header-logo"
            />
            <h1 className="header-title">Rehost Event</h1>
          </div>
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
          <button className="modern-button" onClick={() => nav("/rehost-event")}>
            <i className="fas fa-arrow-left"></i> Back to Events
          </button>

          <div className="modern-error">
            <div className="modern-error-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Error Loading Event Details</h3>
            <p className="modern-error-message">{error}</p>
            <button
              className="modern-submit-btn"
              onClick={() => {
                setError(null)
                setLoading(true)
                window.location.reload()
              }}
            >
              <i className="fas fa-sync"></i> Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="modern-container">
        <header className="modern-header">
          <div className="header-left">
            <img
              src="/logo.png"
              alt="XpressTicket Logo"
              className="header-logo"
            />
            <h1 className="header-title">Rehost Event</h1>
          </div>
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
          <button className="modern-button" onClick={() => nav("/rehost-event")}>
            <i className="fas fa-arrow-left"></i> Back to Events
          </button>

          <div className="modern-error">
            <div className="modern-error-icon">
              <i className="fas fa-info-circle"></i>
            </div>
            <h3>No Event Data</h3>
            <p className="modern-error-message">No event data is available.</p>
            <button
              className="modern-submit-btn"
              onClick={() => nav("/rehost-event")}
            >
              <i className="fas fa-list"></i> View All Events
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modern-container">
      <header className="modern-header">
        <div className="header-left">
          <img
            src="/logo.png"
            alt="XpressTicket Logo"
            className="header-logo"
          />
          <h1 className="header-title">Rehost Event</h1>
        </div>
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
        <button className="modern-button" onClick={() => nav("/rehost-event")}>
          <i className="fas fa-arrow-left"></i> Back to Events
        </button>

        <h2 className="modern-title">Rehost Event: {event.name || "Unnamed Event"}</h2>

        <div className="modern-card">
          <div className="modern-card-header">Event Information</div>
          <div className="modern-card-content">
            <div className="modern-details-grid">
              <div className="modern-detail-column">
                <div className="modern-detail-row">
                  <div className="modern-detail-label">Location</div>
                  <div className="modern-detail-value">{event.location || "Not specified"}</div>
                </div>
                <div className="modern-detail-row">
                  <div className="modern-detail-label">Current Start Date</div>
                  <div className="modern-detail-value">{formatDate(event.start_date)}</div>
                </div>
                <div className="modern-detail-row">
                  <div className="modern-detail-label">Current End Date</div>
                  <div className="modern-detail-value">{formatDate(event.end_date)}</div>
                </div>
                <div className="modern-detail-row">
                  <div className="modern-detail-label">Current Registration Deadline</div>
                  <div className="modern-detail-value">{formatDate(event.registration_deadline_date)}</div>
                </div>
              </div>
              
              <div className="modern-detail-column">
                <div className="modern-detail-row">
                  <div className="modern-detail-label">Start Time</div>
                  <div className="modern-detail-value">{formatTime(event.start_time)}</div>
                </div>
                <div className="modern-detail-row">
                  <div className="modern-detail-label">End Time</div>
                  <div className="modern-detail-value">{formatTime(event.end_time)}</div>
                </div>
                <div className="modern-detail-row">
                  <div className="modern-detail-label">Capacity</div>
                  <div className="modern-detail-value">{event.capacity || "Not specified"}</div>
                </div>
              </div>
              
              {event.description && (
                <div className="modern-detail-row modern-detail-description">
                  <div className="modern-detail-label">Description</div>
                  <div className="modern-detail-value">{event.description}</div>
                </div>
              )}
              
              {event.packages && Array.isArray(event.packages) && event.packages.length > 0 && (
                <div className="modern-detail-row modern-detail-description">
                  <div className="modern-detail-label">Current Package Dates</div>
                  <div className="modern-detail-value">
                    {event.packages.map((pkg, index) => (
                      <div key={index} className="modern-package-item">
                        <div className="modern-package-header">Package {index + 1}</div>
                        <div>Start Date: {formatDate(pkg.startDate)}</div>
                        <div>End Date: {formatDate(pkg.endDate)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modern-card">
          <div className="modern-card-header">Select New Dates</div>
          <div className="modern-form-container">
            <form onSubmit={handleSubmit} className="modern-form">
              <div className="modern-form-row">
                <div className="modern-form-group">
                  <label className="modern-form-label" htmlFor="startdate">New Event Start Date</label>
                  <input
                    type="date"
                    id="startdate"
                    name="startdate"
                    value={formData.startdate}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split("T")[0]}
                    disabled={isSubmitting}
                    className="modern-form-input"
                  />
                </div>
                <div className="modern-form-group">
                  <label className="modern-form-label" htmlFor="enddate">New Event End Date</label>
                  <input
                    type="date"
                    id="enddate"
                    name="enddate"
                    value={formData.enddate}
                    onChange={handleInputChange}
                    required
                    min={formData.startdate || new Date().toISOString().split("T")[0]}
                    disabled={isSubmitting}
                    className="modern-form-input"
                  />
                </div>
              </div>
              <div className="modern-form-row">
                <div className="modern-form-group">
                  <label className="modern-form-label" htmlFor="deadline_date">New Registration Deadline Date</label>
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
                    className="modern-form-input"
                  />
                </div>
              </div>

              {formData.packages.length > 0 && (
                <div className="modern-package-section">
                  <h4 className="modern-package-title">Package Dates</h4>
                  {formData.packages.map((pkg, index) => (
                    <div key={index} className="modern-package-item">
                      <div className="modern-package-header">Package {index + 1}</div>
                      <div className="modern-form-row">
                        <div className="modern-form-group">
                          <label className="modern-form-label" htmlFor={`packageStartDate-${index}`}>New Start Date</label>
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
                            className="modern-form-input"
                          />
                        </div>
                        <div className="modern-form-group">
                          <label className="modern-form-label" htmlFor={`packageEndDate-${index}`}>New End Date</label>
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
                            className="modern-form-input"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {submitError && (
                <div className="modern-alert modern-alert-error">
                  <span className="modern-alert-icon">
                    <i className="fas fa-exclamation-circle"></i>
                  </span>
                  <span className="modern-alert-text">{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="modern-alert modern-alert-success">
                  <span className="modern-alert-icon">
                    <i className="fas fa-check-circle"></i>
                  </span>
                  <span className="modern-alert-text">{submitSuccess}</span>
                </div>
              )}

              <div className="modern-form-actions">
                <button
                  type="submit"
                  className={`modern-submit-btn ${isSubmitting ? "modern-submitting" : ""}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="modern-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                      </span>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-calendar-check"></i>
                      <span>Submit Rehost Request</span>
                    </>
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