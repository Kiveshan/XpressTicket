"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import "./EventForm.css"
import "./ViewEventRequest.css"

const ViewEventRequest = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const eventid = location.state?.eventid || new URLSearchParams(location.search).get("eventid")

  const [eventData, setEventData] = useState({
    event_name: "",
    location: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    deadline_date: "",
    deadline_time: "",
    event_type: "",
    capacity: "",
    event_details: "",
    terms_and_conditions: "",
    duration: "",
    file_url: "/default-profile-picture.jpg",
  })

  const [packages, setPackages] = useState([])
  const [tabs, setTabs] = useState([])
  const [clientTypes, setClientTypes] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [currentSection, setCurrentSection] = useState("eventInfo")

  const formatDate = (dateString) => {
    if (!dateString) return "Date not specified";

    try {
      console.log("ViewEventRequest formatDate input:", dateString);
      
      // Handle both ISO timestamp and YYYY-MM-DD format
      if (dateString.includes('T')) {
        // If it's an ISO string, extract just the YYYY-MM-DD part
        dateString = dateString.split('T')[0];
      }

      // Handle cases where dateString might already be in DD/MM/YYYY format
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        if (day && month && year) {
          return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
        }
      }

      // Directly split the YYYY-MM-DD string (same as EventRequest.jsx)
      const [year, month, day] = dateString.split('-');
      
      if (!year || !month || !day || year.length !== 4) {
        throw new Error("Invalid date format");
      }

      // Format as DD/MM/YYYY without creating a Date object
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    } catch (error) {
      console.error("ViewEventRequest date formatting error:", error, "Input:", dateString);
      return "Date not specified";
    }
  };

  useEffect(() => {
    console.log("Event ID:", eventid)

    if (!eventid) {
      setError("No event ID provided. Redirecting to event requests...")
      setLoading(false)
      setTimeout(() => navigate("/event-request"), 2000)
      return
    }

    const fetchEvent = async () => {
      try {
        const token = sessionStorage.getItem("token")
        const userId = sessionStorage.getItem("userId")
        if (!token || !userId) {
          console.error("Missing token or userId:", { token, userId })
          navigate("/login")
          return
        }

        console.log("Fetching event with:", { token: token.slice(0, 10) + "...", userId, eventid })
        const response = await fetch(`http://localhost:5000/api/events/${eventid}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("Fetch failed:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error || "No error message provided",
          })
          if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem("token")
            sessionStorage.removeItem("userId")
            navigate("/login")
            return
          }
          throw new Error(`Failed to fetch event: ${errorData.error || response.statusText}`)
        }

        const data = await response.json()
        console.log("ViewEventRequest fetched event data:", JSON.stringify(data, null, 2))

        // Map backend fields to frontend state with formatted dates
        setEventData({
          event_name: data.name || "",
          location: data.location || "",
          start_date: data.start_date ? formatDate(data.start_date) : "Date not specified",
          end_date: data.end_date ? formatDate(data.end_date) : "Date not specified",
          start_time: data.start_time || "",
          end_time: data.end_time || "",
          deadline_date: data.registration_deadline_date ? formatDate(data.registration_deadline_date) : "Date not specified",
          deadline_time: data.registration_deadline_time || "",
          event_type: data.event_type || "",
          capacity: data.capacity || "",
          event_details: data.description || "",
          terms_and_conditions: data.terms_and_conditions || "",
          duration: data.duration || "",
          file_url: data.coverimage || "/default-profile-picture.jpg",
        })

        setClientTypes(data.attendees || [])
        setTabs(data.tabs || [])
        setPackages(data.packages || [])
      } catch (err) {
        console.error("Error fetching event:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventid, navigate])

  // Section navigation handlers
  const showEventInfo = () => setCurrentSection("eventInfo")
  const showClientTypes = () => setCurrentSection("clientTypes")
  const showPackagesTabs = () => setCurrentSection("packagesTabs")
  const showTerms = () => setCurrentSection("terms")

  if (loading) {
    return (
      <div className="modern-loading-overlay">
        <div className="view-empty-state-icon">⏳</div>
        <p>Loading event details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="view-event-container">
        <div className="view-event-card">
          <div className="view-empty-state">
            <div className="view-empty-state-icon">❌</div>
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="view-event-container">
      <div className="view-event-card">
        <div className="view-event-header">
          <button className="backbutton20" onClick={() => navigate("/event-request")}>
            <i className="fas fa-arrow-left"></i> Back to Events
          </button>
          <div className="view-section-nav">
            <button
              className={`view-nav-button ${currentSection === "eventInfo" ? "active" : ""}`}
              onClick={showEventInfo}
            >
              Event Information
            </button>
            <button
              className={`view-nav-button ${currentSection === "clientTypes" ? "active" : ""}`}
              onClick={showClientTypes}
            >
              Client Types
            </button>
            <button
              className={`view-nav-button ${currentSection === "packagesTabs" ? "active" : ""}`}
              onClick={showPackagesTabs}
            >
              Packages & Tabs
            </button>
            <button
              className={`view-nav-button ${currentSection === "terms" ? "active" : ""}`}
              onClick={showTerms}
            >
              Terms & Conditions
            </button>
          </div>
        </div>

        <div className="view-section-content">
          {/* Section 1: Event Information */}
          {currentSection === "eventInfo" && (
            <div>
              <h2 className="view-section-title">Event Information</h2>

              <div className="view-event-showcase">
                <div className="view-event-image-container">
                  <img
                    src={
                      imageError ? "/default-profile-picture.jpg" : eventData.file_url || "/default-profile-picture.jpg"
                    }
                    alt="Event Cover"
                    className="view-event-image"
                    onError={(e) => {
                      console.error("Image load error:", eventData.file_url)
                      setImageError(true)
                    }}
                    onLoad={() => console.log("Image loaded successfully:", eventData.file_url)}
                  />
                </div>

                <div className="view-event-details-grid">
                  <div className="view-info-card">
                    <div className="view-info-label">Event Name</div>
                    <div className="view-info-value">{eventData.event_name}</div>
                  </div>

                  <div className="view-info-card">
                    <div className="view-info-label">Location</div>
                    <div className="view-info-value">{eventData.location}</div>
                  </div>

                  <div className="view-info-card">
                    <div className="view-info-label">Start Date</div>
                    <div className="view-info-value">{eventData.start_date}</div>
                  </div>

                  <div className="view-info-card">
                    <div className="view-info-label">End Date</div>
                    <div className="view-info-value">{eventData.end_date}</div>
                  </div>

                  <div className="view-info-card">
                    <div className="view-info-label">Start Time</div>
                    <div className="view-info-value">{eventData.start_time}</div>
                  </div>

                  <div className="view-info-card">
                    <div className="view-info-label">End Time</div>
                    <div className="view-info-value">{eventData.end_time}</div>
                  </div>

                  <div className="view-info-card">
                    <div className="view-info-label">Registration Deadline</div>
                    <div className="view-info-value">
                      {eventData.deadline_date} at {eventData.deadline_time}
                    </div>
                  </div>

                  <div className="view-info-card">
                    <div className="view-info-label">Event Type</div>
                    <div className="view-info-value">{eventData.event_type}</div>
                  </div>

                  <div className="view-info-card">
                    <div className="view-info-label">Max Capacity</div>
                    <div className="view-info-value">{eventData.capacity}</div>
                  </div>
                </div>
              </div>

              <div className="view-description-card">
                <div className="view-description-title">Event Details</div>
                <div className="view-description-text">{eventData.event_details}</div>
              </div>

              <div className="view-section-footer">
                <div></div>
                <button className="view-nav-btn view-next-nav" onClick={showClientTypes}>
                  Next: Client Types →
                </button>
              </div>
            </div>
          )}

          {/* Section 2: Client Types */}
          {currentSection === "clientTypes" && (
            <div>
              <h2 className="view-section-title">Client Types Available</h2>

              <div className="view-client-types-container">
                {clientTypes.length === 0 ? (
                  <div className="view-empty-state">
                    <div className="view-empty-state-icon">👥</div>
                    <p>No client types available for this event</p>
                  </div>
                ) : (
                  <div className="view-badges-grid">
                    {clientTypes.map((type, index) => (
                      <div key={index} className="view-client-badge">
                        {type}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="view-section-footer">
                <button className="view-nav-btn view-back-nav" onClick={showEventInfo}>
                  ← Back: Event Information
                </button>
                <button className="view-nav-btn view-next-nav" onClick={showPackagesTabs}>
                  Next: Packages & Tabs →
                </button>
              </div>
            </div>
          )}

          {/* Section 3: Packages & Tabs */}
          {currentSection === "packagesTabs" && (
            <div>
              <h2 className="view-section-title">Packages & Tabs</h2>

              <div className="view-packages-tabs-layout">
                {/* Tabs Section */}
                <div className="view-section-card">
                  <div className="view-section-header">
                    <span className="view-section-icon">📋</span>
                    <h3>Event Tabs</h3>
                  </div>

                  {tabs.length === 0 ? (
                    <div className="view-empty-state">
                      <div className="view-empty-state-icon">📄</div>
                      <p>No tabs available</p>
                    </div>
                  ) : (
                    <div className="view-tabs-list">
                      {tabs.map((tab, idx) => (
                        <div key={idx} className="view-tab-card">
                          <div className="view-tab-header">{tab.name}</div>
                          <div className="view-tab-content">{tab.content}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Packages Section */}
                <div className="view-section-card">
                  <div className="view-section-header">
                    <span className="view-section-icon">📦</span>
                    <h3>Event Packages</h3>
                  </div>

                  {packages.length === 0 ? (
                    <div className="view-empty-state">
                      <div className="view-empty-state-icon">📦</div>
                      <p>No packages available</p>
                    </div>
                  ) : (
                    <div className="view-packages-list">
                      {packages.map((pkg, idx) => (
                        <div key={idx} className="view-package-card">
                          <div className="view-package-header">Package {idx + 1}</div>
                          <div className="view-package-details">
                            <div className="view-package-grid">
                              <div className="view-package-item">
                                <div className="view-package-item-label">Select Type</div>
                                <div className="view-package-item-value">{pkg.selectType}</div>
                              </div>
                              <div className="view-package-item">
                                <div className="view-package-item-label">Package Type</div>
                                <div className="view-package-item-value">{pkg.packageType}</div>
                              </div>
                              <div className="view-package-item">
                                <div className="view-package-item-label">Location</div>
                                <div className="view-package-item-value">{pkg.location}</div>
                              </div>
                              <div className="view-package-item">
                                <div className="view-package-item-label">Duration</div>
                                <div className="view-package-item-value">{pkg.duration}</div>
                              </div>
                              <div className="view-package-item view-package-dates">
                                <div className="view-package-item-label">Date Choices</div>
                                <div className="view-package-date-range">
                                  <div className="view-package-date-item">
                                    <span className="view-package-date-label">Start Date:</span>
                                    <span className="view-package-date-value">
                                      {pkg.startDate ? formatDate(pkg.startDate) : "N/A"}
                                    </span>
                                  </div>
                                  <div className="view-package-date-item">
                                    <span className="view-package-date-label">End Date:</span>
                                    <span className="view-package-date-value">
                                      {pkg.endDate ? formatDate(pkg.endDate) : "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="view-package-item">
                                <div className="view-package-item-label">Pricing</div>
                                <div className="view-package-item-value">R {pkg.pricing}</div>
                              </div>
                            </div>
                            <div className="view-package-description">
                              <div className="view-package-description-title">Package Details</div>
                              <div className="view-package-description-text">{pkg.details}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="view-section-footer">
                <button className="view-nav-btn view-back-nav" onClick={showClientTypes}>
                  ← Back: Client Types
                </button>
                <button className="view-nav-btn view-next-nav" onClick={showTerms}>
                  Next: Terms & Conditions →
                </button>
              </div>
            </div>
          )}

          {/* Section 4: Terms & Conditions */}
          {currentSection === "terms" && (
            <div>
              <h2 className="view-section-title">Terms & Conditions</h2>

              <div className="view-terms-container">
                <div className="view-terms-card">
                  <div className="view-terms-text">{eventData.terms_and_conditions}</div>
                </div>
              </div>

              <div className="view-section-footer">
                <button className="view-nav-btn view-back-nav" onClick={showPackagesTabs}>
                  ← Back: Packages & Tabs
                </button>
                <div></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ViewEventRequest