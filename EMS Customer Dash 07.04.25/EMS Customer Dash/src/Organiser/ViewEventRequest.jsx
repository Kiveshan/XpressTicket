"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import "./EventForm.css"
import "./ViewEventRequest.css"
import "./ModernOrganizerStyles.css"
import "./ModernStyles.css"

// Helper function to handle package price display
const getPackagePrice = (pkg) => {
  // Check for price in different possible property names
  const price = pkg.price || pkg.package_price || pkg.cost || pkg.amount || pkg.fee;
  
  // If price is not available, return N/A
  if (!price && price !== 0) return "N/A";
  
  // Handle numeric price
  if (typeof price === 'number') {
    return `$${price.toFixed(2)}`;
  }
  
  // Handle string price that might be numeric
  if (typeof price === 'string') {
    // Check if the price already has a currency symbol
    if (price.startsWith('$') || price.startsWith('£') || price.startsWith('€')) {
      return price;
    }
    
    // Try to parse the price as a number
    const numericPrice = parseFloat(price);
    if (!isNaN(numericPrice)) {
      return `$${numericPrice.toFixed(2)}`;
    }
    
    // Return the original string if it's not a number
    return price;
  }
  
  // Fallback
  return "N/A";
};

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
        console.log("Fetched event data:", data)

        // Map backend fields to frontend state
        setEventData({
          event_name: data.name || "",
          location: data.location || "",
          start_date: data.start_date ? new Date(data.start_date).toISOString().split("T")[0] : "",
          end_date: data.end_date ? new Date(data.end_date).toISOString().split("T")[0] : "",
          start_time: data.start_time || "",
          end_time: data.end_time || "",
          deadline_date: data.registration_deadline_date
            ? new Date(data.registration_deadline_date).toISOString().split("T")[0]
            : "",
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
        // Log all packages to see their structure
        if (data.packages && data.packages.length > 0) {
          console.log('All packages:', data.packages)
          data.packages.forEach((pkg, index) => {
            console.log(`Package ${index} data:`, pkg)
            console.log(`Package ${index} keys:`, Object.keys(pkg))
            
            // Check for price-related fields
            const priceFields = ['price', 'cost', 'amount', 'value', 'fee', 'package_price']
            priceFields.forEach(field => {
              console.log(`Package ${index} ${field}:`, pkg[field])
            })
            
            // Check if there are any nested objects that might contain price
            Object.keys(pkg).forEach(key => {
              if (typeof pkg[key] === 'object' && pkg[key] !== null) {
                console.log(`Package ${index} nested object ${key}:`, pkg[key])
              }
            })
          })
        }
        // Parse package data from string format
        const parsedPackages = [];
        
        if (data.packages && Array.isArray(data.packages)) {
          data.packages.forEach(pkg => {
            // Check if the package is a string that needs parsing
            if (typeof pkg === 'string' && pkg.includes('pricing')) {
              try {
                // Extract pricing information using regex
                const pricingMatch = pkg.match(/\\"pricing\\":\\"([^\\"]+)\\"/);
                const nameMatch = pkg.match(/\\"packageType\\":\\"([^\\"]+)\\"/);
                const detailsMatch = pkg.match(/\\"details\\":\\"([^\\"]+)\\"/);
                const locationMatch = pkg.match(/\\"location\\":\\"([^\\"]+)\\"/);
                const durationMatch = pkg.match(/\\"duration\\":\\"([^\\"]+)\\"/);
                const dateChoicesMatch = pkg.match(/\\"dateChoices\\":\\"([^\\"]+)\\"/);
                
                // Create a structured package object
                const parsedPackage = {
                  package_name: nameMatch ? nameMatch[1] : 'Package',
                  package_type: nameMatch ? nameMatch[1] : 'Standard',
                  price: pricingMatch ? pricingMatch[1] : null,
                  details: detailsMatch ? detailsMatch[1] : 'No details available',
                  location: locationMatch ? locationMatch[1] : '',
                  duration: durationMatch ? durationMatch[1] : '',
                  dateChoices: dateChoicesMatch ? dateChoicesMatch[1] : ''
                };
                
                // Parse date information if available
                if (dateChoicesMatch) {
                  const dates = dateChoicesMatch[1].split('-');
                  if (dates.length === 2) {
                    parsedPackage.start_date = dates[0];
                    parsedPackage.end_date = dates[1];
                  }
                }
                
                parsedPackages.push(parsedPackage);
              } catch (err) {
                console.error('Error parsing package string:', err);
                // Add the original package as fallback
                parsedPackages.push(pkg);
              }
            } else {
              // Use the package as-is if it's already an object
              parsedPackages.push(pkg);
            }
          });
        }
        
        console.log('Parsed packages:', parsedPackages);
        setPackages(parsedPackages)
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
      <div className="modern-container">
        <div className="modern-loading">
          <div className="spinner"></div>
          <p>Loading event details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="modern-container">
        <div className="modern-content">
          <div className="modern-card">
            <div className="modern-error">
              <i className="fas fa-exclamation-triangle"></i>
              <h3>Error Loading Event</h3>
              <p>{error}</p>
              <button 
                className="modern-button" 
                onClick={() => navigate("/organiser-dash")}
              >
                <i className="fas fa-arrow-left"></i> Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modern-container">
      {/* Modern Header */}
      <header className="modern-header">
        <div className="header-left">
          <button className="modern-button" onClick={() => navigate("/organiser-dash")}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="header-logo" />
        </div>
        <h1 className="header-title">View Event Request</h1>
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
      </header>
      
      {/* Main Content */}
      <div className="modern-content">
        <div className="modern-card">
          {/* Modern Tabs */}
          <div className="modern-tabs">
            <button
              className={`modern-tab ${currentSection === "eventInfo" ? "active" : ""}`}
              onClick={showEventInfo}
            >
              <i className="fas fa-info-circle"></i>
              Event Information
            </button>
            <button
              className={`modern-tab ${currentSection === "clientTypes" ? "active" : ""}`}
              onClick={showClientTypes}
            >
              <i className="fas fa-users"></i>
              Client Types
            </button>
            <button
              className={`modern-tab ${currentSection === "packagesTabs" ? "active" : ""}`}
              onClick={showPackagesTabs}
            >
              <i className="fas fa-box-open"></i>
              Packages & Tabs
            </button>
            <button
              className={`modern-tab ${currentSection === "terms" ? "active" : ""}`}
              onClick={showTerms}
            >
              <i className="fas fa-file-contract"></i>
              Terms & Conditions
            </button>
          </div>

          {/* Section Content */}
          <div className="modern-content-section">
            {/* Section 1: Event Information */}
            {currentSection === "eventInfo" && (
              <div>
                <h2 className="modern-section-title">Event Information</h2>

                <div className="modern-event-showcase">
                  <div className="modern-event-image-container">
                    <img
                      src={eventData.file_url || "https://via.placeholder.com/400x280?text=Event+Image"}
                      alt={eventData.event_name}
                      className="modern-event-image"
                    />
                  </div>

                  <div className="modern-event-details-grid">
                    <div className="modern-info-card">
                      <div className="modern-info-label">Event Name</div>
                      <div className="modern-info-value">{eventData.event_name}</div>
                    </div>

                    <div className="modern-info-card">
                      <div className="modern-info-label">Event Type</div>
                      <div className="modern-info-value">{eventData.event_type}</div>
                    </div>

                    <div className="modern-info-card">
                      <div className="modern-info-label">Location</div>
                      <div className="modern-info-value">{eventData.location}</div>
                    </div>

                    <div className="modern-info-card">
                      <div className="modern-info-label">Start Date</div>
                      <div className="modern-info-value">{eventData.start_date}</div>
                    </div>

                    <div className="modern-info-card">
                      <div className="modern-info-label">End Date</div>
                      <div className="modern-info-value">{eventData.end_date}</div>
                    </div>

                    <div className="modern-info-card">
                      <div className="modern-info-label">Start Time</div>
                      <div className="modern-info-value">{eventData.start_time}</div>
                    </div>

                    <div className="modern-info-card">
                      <div className="modern-info-label">End Time</div>
                      <div className="modern-info-value">{eventData.end_time}</div>
                    </div>

                    <div className="modern-info-card">
                      <div className="modern-info-label">Registration Deadline</div>
                      <div className="modern-info-value">
                        {eventData.deadline_date} at {eventData.deadline_time}
                      </div>
                    </div>

                    <div className="modern-info-card">
                      <div className="modern-info-label">Maximum Capacity</div>
                      <div className="modern-info-value">{eventData.capacity}</div>
                    </div>
                  </div>
                </div>

                <div className="modern-description-card">
                  <div className="modern-description-title">
                    <i className="fas fa-file-alt"></i>
                    Event Description
                  </div>
                  <div className="modern-description-text">{eventData.event_details}</div>
                </div>

                <div className="modern-section-footer">
                  <div></div>
                  <button className="modern-button" onClick={showClientTypes}>
                    <span>Next: Client Types</span>
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Section 2: Client Types */}
            {currentSection === "clientTypes" && (
              <div>
                <h2 className="modern-section-title">Client Types Available</h2>

                <div className="modern-client-types-container">
                  {clientTypes.length === 0 ? (
                    <div className="modern-empty-state">
                      <i className="fas fa-users"></i>
                      <p>No client types available for this event</p>
                    </div>
                  ) : (
                    <div className="modern-badges-grid">
                      {clientTypes.map((type, index) => (
                        <div key={index} className="modern-badge client-type-badge">
                          {type}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modern-section-footer">
                  <button className="modern-button" onClick={showEventInfo}>
                    <i className="fas fa-arrow-left"></i>
                    <span>Back: Event Information</span>
                  </button>
                  <button className="modern-button" onClick={showPackagesTabs}>
                    <span>Next: Packages & Tabs</span>
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Section 3: Packages & Tabs */}
            {currentSection === "packagesTabs" && (
              <div>
                <h2 className="modern-section-title">Packages & Tabs</h2>

                <div className="modern-packages-container">
                  <h3 className="modern-subsection-title">
                    <i className="fas fa-box-open"></i>
                    Packages
                  </h3>
                  {packages.length === 0 ? (
                    <div className="modern-empty-state">
                      <i className="fas fa-box-open"></i>
                      <p>No packages available for this event</p>
                    </div>
                  ) : (
                    <div className="modern-packages-grid">
                      {packages.map((pkg, index) => (
                        <div key={index} className="modern-package-card">
                          <div className="modern-package-header">
                            <h4 className="modern-package-name">{pkg.name || pkg.package_name || 'Package'}</h4>
                            <span className="modern-badge">{pkg.type || pkg.package_type || 'Standard'}</span>
                          </div>
                          <div className="modern-package-content">
                            <div className="modern-package-item">
                              <div className="modern-package-item-label">PRICE</div>
                              <div className="modern-package-item-value">
                                {getPackagePrice(pkg)}
                              </div>
                            </div>
                            <div className="modern-package-item modern-package-dates">
                              <div className="modern-package-item-label">DATE CHOICES</div>
                              <div className="modern-package-date-range">
                                <div className="modern-package-date-item">
                                  <span className="modern-package-date-label">Start Date:</span>
                                  <span className="modern-package-date-value">
                                    {pkg.startDate || pkg.start_date ? new Date(pkg.startDate || pkg.start_date).toLocaleDateString() : "N/A"}
                                  </span>
                                </div>
                                <div className="modern-package-date-item">
                                  <span className="modern-package-date-label">End Date:</span>
                                  <span className="modern-package-date-value">
                                    {pkg.endDate || pkg.end_date ? new Date(pkg.endDate || pkg.end_date).toLocaleDateString() : "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="modern-package-description">
                              <div className="modern-package-description-title">Package Details</div>
                              <div className="modern-package-description-text">{pkg.details || pkg.package_details || 'No details available'}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modern-tabs-container">
                  <h3 className="modern-subsection-title">
                    <i className="fas fa-folder"></i>
                    Tabs
                  </h3>
                  {tabs.length === 0 ? (
                    <div className="modern-empty-state">
                      <i className="fas fa-folder"></i>
                      <p>No tabs available for this event</p>
                    </div>
                  ) : (
                    <div className="modern-tabs-grid">
                      {tabs.map((tab, index) => (
                        <div key={index} className="modern-tab-card">
                          <h4 className="modern-tab-name">
                            <i className="fas fa-clipboard-list"></i>
                            {tab.name}
                          </h4>
                          <div className="modern-tab-description">{tab.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modern-section-footer">
                  <button className="modern-button" onClick={showClientTypes}>
                    <i className="fas fa-arrow-left"></i>
                    <span>Back: Client Types</span>
                  </button>
                  <button className="modern-button" onClick={showTerms}>
                    <span>Next: Terms & Conditions</span>
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Section 4: Terms & Conditions */}
            {currentSection === "terms" && (
              <div>
                <h2 className="modern-section-title">
                  <i className="fas fa-file-contract"></i>
                  Terms & Conditions
                </h2>

                <div className="modern-terms-container">
                  <div className="modern-terms-card">
                    <div className="modern-terms-text">{eventData.terms_and_conditions}</div>
                  </div>
                </div>

                <div className="modern-section-footer">
                  <button className="modern-button" onClick={showPackagesTabs}>
                    <i className="fas fa-arrow-left"></i>
                    <span>Back: Packages & Tabs</span>
                  </button>
                  <div></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewEventRequest
