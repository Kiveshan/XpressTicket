import React, { useState, useEffect } from "react";
import "./CustomerViewEvent.css";
import "../shared/ModernDashboard.css";
import { useNavigate, useParams } from 'react-router-dom';
import { FaSignOutAlt, FaArrowLeft, FaExclamationTriangle, FaHome, FaCalendarAlt, FaMapMarkerAlt, FaInfoCircle } from 'react-icons/fa';
import EventImage from '../utils/EventImage';

const CustomerViewEvent = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [packages, setPackages] = useState([]);
  const { eventId } = useParams();
  const nav = useNavigate();

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        console.log(`Fetching event details for ID: ${eventId}`);
        
        // Get the authentication token from session storage
        const token = sessionStorage.getItem('token');
        
        if (!token) {
          console.warn('No authentication token found in session storage');
          nav('/login');
          return;
        }
        
        console.log(`Making request to: http://localhost:5000/api/events/${eventId}`);
        
        const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized: Please log in again');
          } else if (response.status === 404) {
            throw new Error('Event not found: The requested event does not exist or has been removed');
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to fetch event details');
          }
        }
        
        const data = await response.json();
        setEvent(data.event);
        setPackages(data.packages || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError(err.message || 'An error occurred while fetching event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId, nav]);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    nav('/login');
  };

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading event details...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <FaExclamationTriangle className="error-icon" />
          <h2>Event Not Found</h2>
          <p>The event you're looking for doesn't exist or has been removed.</p>
          <div className="button-group">
            <button 
              onClick={() => nav(-1)} 
              className="back-button"
            >
              <FaArrowLeft /> Go Back
            </button>
            <button 
              onClick={() => nav('/events')} 
              className="primary-button"
            >
              <FaHome /> Browse Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Event details view
  return (
    <div className="customer-view-event">
      {/* Header */}
      <header className="event-header">
        <div className="container">
          <div className="header-content">
            <button onClick={() => nav(-1)} className="back-button">
              <FaArrowLeft /> Back
            </button>
            <h1>{event.name}</h1>
            <button onClick={handleLogout} className="logout-button">
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="event-main">
        <div className="container">
          {/* Event Image */}
          <div className="event-image-container">
            <EventImage eventType={event.event_type} className="event-image" />
          </div>

          {/* Event Details */}
          <div className="event-details">
            <div className="event-meta">
              <div className="meta-item">
                <FaCalendarAlt className="meta-icon" />
                <span>{new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</span>
              </div>
              <div className="meta-item">
                <FaMapMarkerAlt className="meta-icon" />
                <span>{event.location || 'Location not specified'}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 0 ? 'active' : ''}`}
                onClick={() => setActiveTab(0)}
              >
                About
              </button>
              <button 
                className={`tab ${activeTab === 1 ? 'active' : ''}`}
                onClick={() => setActiveTab(1)}
              >
                Packages
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 0 ? (
                <div className="about-tab">
                  <h3>Event Description</h3>
                  <p>{event.description || 'No description available.'}</p>
                  
                  {event.terms_and_conditions && (
                    <div className="terms-section">
                      <h4><FaInfoCircle /> Terms & Conditions</h4>
                      <p>{event.terms_and_conditions}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="packages-tab">
                  {packages.length > 0 ? (
                    <div className="packages-grid">
                      {packages.map((pkg, index) => (
                        <div key={index} className="package-card">
                          <h4>{pkg.name}</h4>
                          <p className="package-type">{pkg.type}</p>
                          <p className="package-details">{pkg.details}</p>
                          <div className="package-footer">
                            <span className="package-price">
                              {pkg.price ? `$${pkg.price.toFixed(2)}` : 'Free'}
                            </span>
                            <button className="select-package">
                              Select Package
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-packages">
                      <p>No packages available for this event.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerViewEvent;
          } else if (response.status === 403) {
            throw new Error('Forbidden: You do not have permission to view this event');
          } else if (response.status === 404) {
            throw new Error('Event not found: The requested event does not exist or has been removed');
          } else {
            throw new Error(`Failed to fetch event details: ${response.status} ${response.statusText}\n${responseData}`);
          }
        }
        
        const data = JSON.parse(responseData);
        console.log('Fetched event details:', data);
        
        // Process date and time from database fields
        let formattedDate = 'TBA';
        let formattedTime = 'TBA';
        
        // Debug the date fields coming from database
        console.log('Date fields from DB:', { 
          startdate: data.startdate, 
          start_date: data.start_date, 
          date: data.date 
        });
        
        // Format date from startdate field - handle different possible formats
        if (data.startdate) {
          // If startdate is already in YYYY-MM-DD format, use it directly
          if (typeof data.startdate === 'string' && data.startdate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = data.startdate;
          } else {
            // Otherwise try to parse it
            const dateObj = new Date(data.startdate);
            if (!isNaN(dateObj)) {
              formattedDate = dateObj.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            }
          }
        } else if (data.start_date) {
          // Try alternate field name
          if (typeof data.start_date === 'string' && data.start_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = data.start_date;
          } else {
            const dateObj = new Date(data.start_date);
            if (!isNaN(dateObj)) {
              formattedDate = dateObj.toISOString().split('T')[0];
            }
          }
        } else if (data.date) {
          // Fallback to date field if startdate is not available
          if (typeof data.date === 'string' && data.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = data.date;
          } else {
            const dateObj = new Date(data.date);
            if (!isNaN(dateObj)) {
              formattedDate = dateObj.toISOString().split('T')[0];
            }
          }
        }
        
        // Use time field directly if available
        formattedTime = data.time || data.start_time || 'TBA';
        
        // Add formatted date and time to event object
        setEvent({
          ...data,
          formattedDate,
          formattedTime
        });
        
        // Process packages from the event data
        if (data.packages && Array.isArray(data.packages)) {
          console.log('Raw packages from DB:', data.packages);
          
          const processedPackages = data.packages.map((pkg, index) => {
            // Parse the package string format from the database
            if (typeof pkg === 'string') {
              try {
                // First, try to parse it as JSON if it looks like a JSON string
                if (pkg.startsWith('{') && pkg.endsWith('}')) {
                  try {
                    // Clean up escaped quotes
                    const cleanedStr = pkg.replace(/\\|\\"/g, '"');
                    const parsedData = JSON.parse(cleanedStr);
                    
                    return {
                      name: parsedData.selectType?.replace(/\"/g, '') || `Package ${index + 1}`,
                      price: parsedData.pricing?.replace(/\"/g, '') || '0.00',
                      currency: 'R',
                      features: [
                        parsedData.selectType?.replace(/\"/g, '') || 'Full conference access',
                        parsedData.details?.replace(/\"/g, '') || 'Conference materials',
                        parsedData.Duration ? `Duration: ${parsedData.Duration.replace(/\"/g, '')}` : '',
                        parsedData.DateChoices ? `Date: ${parsedData.DateChoices.replace(/\"/g, '')}` : '',
                        parsedData.location ? `Location: ${parsedData.location.replace(/\"/g, '')}` : '',
                        parsedData.PackageType ? `Package Type: ${parsedData.PackageType.replace(/\"/g, '')}` : '',
                        parsedData.TypeOptions && parsedData.TypeOptions.replace(/\"/g, '') !== parsedData.selectType?.replace(/\"/g, '') ? 
                          `Type: ${parsedData.TypeOptions.replace(/\"/g, '')}` : '',
                        parsedData.Day ? `Day(s): ${parsedData.Day.replace(/\"/g, '')}` : ''
                      ].filter(item => item !== ''),
                      route: `/customerticketdetails1/${eventId}/${index}`
                    };
                  } catch (e) {
                    console.error('Error parsing JSON package:', e);
                  }
                }
                
                // If not JSON or parsing failed, try to extract data using regex
                const pricingMatch = pkg.match(/"pricing":"\\"([^\\]+)\\""/i);
                const typeMatch = pkg.match(/"selectType":"\\"([^\\]+)\\""/i);
                const durationMatch = pkg.match(/"Duration":"\\"([^\\]+)\\""/i);
                const dateMatch = pkg.match(/"DateChoices":"\\"([^\\]+)\\""/i);
                const locationMatch = pkg.match(/"location":"\\"([^\\]+)\\""/i);
                const detailsMatch = pkg.match(/"details":"\\"([^\\]+)\\""/i);
                const packageTypeMatch = pkg.match(/"PackageType":"\\"([^\\]+)\\""/i);
                const typeOptionsMatch = pkg.match(/"TypeOptions":"\\"([^\\]+)\\""/i);
                const dayMatch = pkg.match(/"Day":"\\"([^\\]+)\\""/i);
                
                // Extract all available information
                return {
                  name: typeMatch ? typeMatch[1] : `Package ${index + 1}`,
                  price: pricingMatch ? pricingMatch[1] : '0.00',
                  currency: 'R',
                  features: [
                    typeMatch ? typeMatch[1] : 'Full conference access',
                    detailsMatch ? detailsMatch[1] : 'Conference materials',
                    durationMatch ? `Duration: ${durationMatch[1]}` : '',
                    dateMatch ? `Date: ${dateMatch[1]}` : '',
                    locationMatch ? `Location: ${locationMatch[1]}` : '',
                    packageTypeMatch ? `Package Type: ${packageTypeMatch[1]}` : '',
                    typeOptionsMatch && typeOptionsMatch[1] !== typeMatch?.[1] ? `Type: ${typeOptionsMatch[1]}` : '',
                    dayMatch ? `Day(s): ${dayMatch[1]}` : ''
                  ].filter(item => item !== ''),
                  route: `/customerticketdetails1/${eventId}/${index}`
                };
              } catch (e) {
                console.error('Error extracting package data:', e);
                return {
                  name: `Package ${index + 1}`,
                  price: '0.00',
                  currency: 'R',
                  features: ['Full conference access', 'Conference materials', 'Daily lunch & snacks'],
                  route: `/customerticketdetails1/${eventId}/${index}`
                };
              }
            }
            
            // If it's already an object, use it directly
            return {
              name: pkg.selectType || pkg.name || `Package ${index + 1}`,
              price: pkg.pricing || pkg.price || '0.00',
              currency: 'R',
              features: [
                pkg.selectType || 'Full conference access',
                pkg.details || 'Conference materials',
                pkg.Duration ? `Duration: ${pkg.Duration}` : '',
                pkg.DateChoices ? `Date: ${pkg.DateChoices}` : '',
                pkg.location ? `Location: ${pkg.location}` : '',
                pkg.PackageType ? `Package Type: ${pkg.PackageType}` : '',
                pkg.TypeOptions && pkg.TypeOptions !== pkg.selectType ? `Type: ${pkg.TypeOptions}` : '',
                pkg.Day ? `Day(s): ${pkg.Day}` : ''
              ].filter(item => item !== ''),
              route: `/customerticketdetails1/${eventId}/${index}`
            };
          });
          
          console.log('Processed packages:', processedPackages);
          setPackages(processedPackages);
        } else {
          // Fallback to default packages if none found in database
          setPackages([{
            name: 'Standard Ticket',
            price: '80.00',
            currency: 'R',
            features: ['Event entry', 'Standard seating', 'Access to all areas'],
            route: `/customerticketdetails1/${eventId}/0`
          }]);
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);
  return (
    <div className="modern-dashboard-container">
      {/* Modern Header */}
      <header className="modern-header">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="modern-logo"
        />
        <div className="modern-header-actions">
          <button className="modern-logout-btn" onClick={() => nav('/')}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>
      
      {/* Back Button */}
      <div className="modern-back-button-container">
        <button className="modern-back-btn" onClick={() => nav("/eventmenu")}>
          <FaArrowLeft /> Back
        </button>
      </div>
    </div>
  );
}

return (
  <div className="modern-dashboard-container">
    {/* Modern Header */}
    <header className="modern-header">
      <img
        src="/XPRESS TICKETS LOGO2.png"
        alt="EventXpress Logo"
        className="modern-logo"
      />
      <div className="modern-header-actions">
        <button className="modern-logout-btn" onClick={() => nav('/')}>
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </header>
    
    {/* Back Button */}
    <div className="modern-back-button-container">
      <button className="modern-back-btn" onClick={() => nav("/eventmenu")}>
        <FaArrowLeft /> Back
      </button>
    </div>

    {/* Buttons removed as they are now available in the Review Purchase page */}
    
    {error ? (
      <div className="error-container">
        <p>Error loading event details: {error}</p>
      </div>
    ) : !event ? (
      <div className="error-container">
        <p>Event not found</p>
      </div>
    ) : (
      <>
        {/* Full-width hero image */}
        <div className="event-hero-image">
          <EventImage 
            image={event.image}
            coverimage={event.coverimage}
            alt={event.name} 
            className="hero-image" 
          />
        </div>
        
        <div className="event-content-container">
          {/* Left side - Event details and description */}
          <div className="event-left-content">
            <h1 className="event-title">{event.name}</h1>
        </div>
      ) : (
        <>
          {/* Full-width hero image */}
          <div className="event-hero-image">
            <EventImage 
              image={event.image}
              coverimage={event.coverimage}
              alt={event.name} 
              className="hero-image" 
            />
          </div>
          
          <div className="event-content-container">
            {/* Left side - Event details and description */}
            <div className="event-left-content">
              <h1 className="event-title">{event.name}</h1>
              
              <div className="event-meta">
                <p><strong>📍 {event.location || 'TBA'} | 📅 {event.formattedDate} | ⏰ {event.formattedTime}</strong></p>
              </div>
              
              <nav className="tabs">
                {event.tabs && event.tabs.length > 0 ? (
                  event.tabs.map((tab, index) => (
                    <button 
                      key={index} 
                      onClick={() => setActiveTab(index)}
                      className={activeTab === index ? 'active-tab' : ''}
                    >
                      {typeof tab === 'object' ? (tab.name || 'Tab') : tab}
                    </button>
                  ))
                ) : (
                  <button onClick={() => setActiveTab(0)} className="active-tab">About Event</button>
                )}
              </nav>
              
              <div className="event-description">
                {event.tabs && event.tabs.length > 0 ? (
                  <div className="tab-content">
                    <h3>
                      {typeof event.tabs[activeTab] === 'object' 
                        ? (event.tabs[activeTab].name || 'Tab') 
                        : event.tabs[activeTab]}
                    </h3>
                    <p>
                      {activeTab === 0 ? 
                        (event.description || 'No description available for this event.') : 
                        typeof event.tabs[activeTab] === 'object' ?
                          (event.tabs[activeTab].content || `Information about this tab will be provided by the event organizer.`) :
                          `Information about ${event.tabs[activeTab]} will be provided by the event organizer.`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="description">
                    <p>{event.description || 'No description available for this event.'}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right side - Packages */}
            <div className="event-right-content">
              <h2 className="packages-title">Tickets & Packages</h2>
              
              {packages.length === 0 ? (
                <div className="no-packages">
                  <p>No packages available for this event.</p>
                </div>
              ) : (
                <div className="package-list">
                  {packages.map((pkg, index) => (
                    <article key={index} className="package-card">
                      <div className="package-content">
                        <h4 className="package-name">{pkg.name}</h4>
                        <div className="price-container">
                          <span className="currency">{pkg.currency}</span>
                          <span className="package-price">{pkg.price}</span>
                        </div>
                        <ul className="package-features">
                          {pkg.features && pkg.features.map((feature, i) => (
                            <li key={i}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                      <button className="cta-button" onClick={()=> nav(pkg.route)}>
                        Select Package
                        <span className="arrow-icon">→</span>
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerViewEvent;
