import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipLoader } from "react-spinners";
import './RehostEventForm.css';
 
const RehostEventForm = () => {
  const navigate = useNavigate();
  const [pastEvents, setPastEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
 
  // Helper function to format date without timezone issues
  const formatDate = (dateString) => {
    if (!dateString) {
      console.warn("Date string is empty or null");
      return "Date not specified";
    }
 
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
      console.error("Date formatting error:", error, "Date string:", dateString);
      return "Date not specified";
    }
  };
 
  // Helper function to extract lowest price from packages array
  const extractLowestPrice = (packages) => {
    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      console.warn("No valid packages found");
      return "N/A";
    }
 
    try {
      // Parse packages if they are JSON strings and extract pricing
      const prices = packages
        .map(pkg => {
          try {
            // Handle both JSON string and object cases
            const parsedPkg = typeof pkg === 'string' ? JSON.parse(pkg) : pkg;
            return parsedPkg.pricing ? parseFloat(parsedPkg.pricing.replace(/[^0-9.]/g, '')) : null;
          } catch (e) {
            console.warn(`Failed to parse package: ${JSON.stringify(pkg)}`, e);
            return null;
          }
        })
        .filter(price => price !== null && !isNaN(price));
 
      if (prices.length === 0) {
        console.warn("No valid prices found in packages");
        return "N/A";
      }
 
      // Find the lowest price
      const lowestPrice = Math.min(...prices);
      return `R ${lowestPrice.toFixed(2)}`;
    } catch (error) {
      console.error("Price extraction error:", error);
      return "N/A";
    }
  };
 
  useEffect(() => {
    let isMounted = true;
 
    const fetchPastEvents = async () => {
      if (!isMounted) return;
 
      try {
        setLoading(true);
        setError(null);
 
        const token = sessionStorage.getItem('token');
        let userId = sessionStorage.getItem('userId');
 
        if (!userId) {
          const userData = sessionStorage.getItem('user');
          if (userData) {
            try {
              const user = JSON.parse(userData);
              userId = user.id;
              if (userId) {
                sessionStorage.setItem('userId', userId);
              }
            } catch (e) {
              console.error('Error parsing user data:', e);
            }
          }
        }
 
        if (!token || !userId) {
          console.warn('Authentication required - No token or user ID found');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('userId');
          sessionStorage.removeItem('user');
          navigate('/login');
          return;
        }
 
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            throw new Error('Invalid token format');
          }
          const tokenPayload = JSON.parse(atob(tokenParts[1]));
          const now = Math.floor(Date.now() / 1000);
          if (tokenPayload.exp && tokenPayload.exp < now) {
            throw new Error('Token expired');
          }
        } catch (tokenError) {
          console.error('Token validation error:', tokenError);
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('userId');
          sessionStorage.removeItem('user');
          navigate('/login');
          return;
        }
 
        const apiUrl = 'http://localhost:5000/api/events-past';
        console.log('Making request to:', apiUrl);
        console.log('Request headers:', {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.substring(0, 10)}...`,
        });
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });
 
        console.log('Response status:', response.status, response.statusText);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
 
        if (!response.ok) {
          let errorData = {};
          try {
            errorData = await response.json();
          } catch (e) {
            console.warn('Failed to parse error response:', e);
          }
          console.error('Server responded with error:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            error: errorData,
          });
          if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userId');
            sessionStorage.removeItem('user');
            navigate('/login');
            return;
          }
          throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`);
        }
 
        let data = [];
        try {
          data = await response.json();
          console.log('Raw API response:', data); // Log raw response for debugging
        } catch (e) {
          console.error('Failed to parse response JSON:', e);
          data = [];
        }
 
        const eventsData = Array.isArray(data) ? data : [];
 
        const eventsWithFormattedData = eventsData.map((event) => {
          console.log('Processing event:', event); // Log each event for debugging
          return {
            id: event.id || event.event_id || '',
            eventid: event.id || event.event_id || '',
            event_name: event.name || 'Unnamed Event',
            location: event.location || 'Location not specified',
            date: event.startdate || 'Date not specified', // Match original field name
            time: event.time || 'Time not specified', // Match original field name
            price: extractLowestPrice(event.packages),
            status: (event.status || 'Pending').toLowerCase(),
            file_url: event.coverimage || '/default-event-image.jpg',
            description: event.description || 'No description available',
          };
        });
 
        if (isMounted) {
          setPastEvents(eventsWithFormattedData);
          setFilteredEvents(eventsWithFormattedData);
          setError(null);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load past events. Please try again later.');
          setPastEvents([]);
          setFilteredEvents([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
 
    fetchPastEvents();
    const interval = setInterval(fetchPastEvents, 10 * 60 * 1000);
 
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [navigate]);
 
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredEvents(pastEvents);
    } else {
      setFilteredEvents(pastEvents.filter((event) => event.status === statusFilter));
    }
  }, [statusFilter, pastEvents]);
 
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };
 
  const handleImageError = (e) => {
    if (e.target.src !== '/default-event-image.jpg') {
      console.warn(`Failed to load image: ${e.target.src}`);
      e.target.src = '/default-event-image.jpg';
      e.target.classList.add('image-error');
    }
  };
 
  if (loading) {
    return (
      <div className="container12">
        <header className="dashboard-header1">
          <img
            src="/XPRESS TICKETS LOGO2.png"
            alt="EventXpress Logo"
            className="dashboard-logo1"
          />
        </header>
        <div className="back-button-container1">
          <button className="backbutton20" onClick={() => navigate('/organiser-dash')}>
            Back
          </button>
        </div>
        <div className="loading-container">
          <ClipLoader color="#123abc" loading={loading} size={50} />
          <p className="loading">Loading past events...</p>
        </div>
      </div>
    );
  }
 
  if (error) {
    const isAuthError = error.includes('log in') || error.includes('expired');
 
    return (
      <div className="container12">
        <header className="dashboard-header1">
          <img
            src="/XPRESS TICKETS LOGO2.png"
            alt="EventXpress Logo"
            className="dashboard-logo1"
          />
          <div className="profile-section">
            {!isAuthError && (
              <button
                className="backbutton22"
                onClick={() => {
                  sessionStorage.removeItem('token');
                  sessionStorage.removeItem('userId');
                  sessionStorage.removeItem('user');
                  navigate('/login');
                }}
              >
                LogOut
              </button>
            )}
          </div>
        </header>
        <div className="back-button-container1">
          <button
            className="backbutton20"
            onClick={() => (isAuthError ? navigate('/login') : navigate('/organiser-dash'))}
          >
            {isAuthError ? 'Go to Login' : 'Back'}
          </button>
        </div>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>{isAuthError ? 'Authentication Required' : 'Error Loading Past Events'}</h3>
          <p className="error-message">{error}</p>
          <div className="action-buttons">
            {isAuthError ? (
              <button
                className="login-button"
                onClick={() => {
                  sessionStorage.clear();
                  navigate('/login');
                }}
              >
                Go to Login
              </button>
            ) : (
              <button
                className="retry-button"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  setPastEvents([]);
                  setFilteredEvents([]);
                }}
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
 
  return (
    <div className="container12">
      <header className="dashboard-header1">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="dashboard-logo1"
        />
        <div className="profile-section">
          <button
            className="backbutton22"
            onClick={() => {
              sessionStorage.removeItem('token');
              sessionStorage.removeItem('userId');
              sessionStorage.removeItem('user');
              navigate('/login');
            }}
          >
            LogOut
          </button>
        </div>
      </header>
      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => navigate('/organiser-dash')}>
          Back
        </button>
      </div>
      <h2 className="title">Past Events</h2>
      <div className="filter-container">
        <label htmlFor="status-filter" className="filter-label">Filter by Status:</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          className="filter-select"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </select>
      </div>
      {filteredEvents.length === 0 ? (
        <div className="no-events">
          <p>No past events found{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}. Create a new event to get started!</p>
          <button
            className="create-event-button"
            onClick={() => navigate('/create-event')}
          >
            Create New Event
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {filteredEvents.map((event) => (
            <div key={event.id} className="card">
              <div className="card-image-container">
                <img
                  src={event.file_url}
                  alt={event.event_name}
                  className="card-image"
                  onError={handleImageError}
                />
                {!event.file_url && (
                  <div className="image-placeholder">
                    <span>No Image</span>
                  </div>
                )}
              </div>
              <h3 className="card-title">{event.event_name}</h3>
              <div className="card-details">
                <p>
                  📍 {event.location} <br />
                  📅 {formatDate(event.date)} <br />
                  💰 {event.price} <br />
                  ⏰ {event.time}
                </p>
              </div>
              <div className="card-footer">
                <span className={`status ${event.status.replace(' ', '-').toLowerCase()}`}>
                  Status: {event.status}
                </span>
                <button
                  className="view-btn"
                  onClick={() => navigate('/view-past-event', { state: { eventid: event.id } })}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
 
export default RehostEventForm;
 