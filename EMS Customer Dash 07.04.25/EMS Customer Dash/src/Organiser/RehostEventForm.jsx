import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipLoader } from "react-spinners";
import './RehostEventForm.css';
import './ModernRehostStyles.css';

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
      <div className="modern-container">
        <header className="modern-header">
          <div className="header-left">
            <img
              src="/XPRESS TICKETS LOGO2.png"
              alt="EventXpress Logo"
              className="header-logo"
            />
            <h1 className="header-title">Past Events</h1>
          </div>
          <button
            className="modern-button"
            onClick={() => navigate('/requestcard')}
          >
            <i className="fas fa-arrow-left"></i> Back
          </button>
        </header>
        <div className="modern-loading">
          <ClipLoader color="#4ca1af" loading={loading} size={50} />
          <p>Loading past events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes('log in') || error.includes('expired');

    return (
      <div className="modern-container">
        <header className="modern-header">
          <div className="header-left">
            <img
              src="/XPRESS TICKETS LOGO2.png"
              alt="EventXpress Logo"
              className="header-logo"
            />
            <h1 className="header-title">Past Events</h1>
          </div>
          {!isAuthError && (
            <button
              className="modern-button"
              onClick={() => {
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('userId');
                sessionStorage.removeItem('user');
                navigate('/login');
              }}
            >
              <i className="fas fa-sign-out-alt"></i> LogOut
            </button>
          )}
        </header>
        <button
          className="modern-button"
          style={{ margin: '20px 0', alignSelf: 'flex-start' }}
          onClick={() => (isAuthError ? navigate('/login') : navigate('/requestcard'))}
        >
          <i className="fas fa-arrow-left"></i> {isAuthError ? 'Go to Login' : 'Back'}
        </button>
        <div className="modern-error">
          <div className="modern-error-icon">⚠️</div>
          <h3>{isAuthError ? 'Authentication Required' : 'Error Loading Past Events'}</h3>
          <p className="modern-error-message">{error}</p>
          <div className="modern-action-buttons">
            {isAuthError ? (
              <button
                className="modern-login-button"
                onClick={() => {
                  sessionStorage.clear();
                  navigate('/login');
                }}
              >
                Go to Login
              </button>
            ) : (
              <button
                className="modern-retry-button"
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
    <div className="modern-container">
      <header className="modern-header">
        <div className="header-left">
          <img
            src="/XPRESS TICKETS LOGO2.png"
            alt="EventXpress Logo"
            className="header-logo"
          />
          <h1 className="header-title">Past Events</h1>
        </div>
        <button
          className="modern-button"
          onClick={() => {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userId');
            sessionStorage.removeItem('user');
            navigate('/login');
          }}
        >
          <i className="fas fa-sign-out-alt"></i> LogOut
        </button>
      </header>
      
      <button 
        className="modern-button" 
        style={{ margin: '20px 0', alignSelf: 'flex-start' }}
        onClick={() => navigate('/requestcard')}
      >
        <i className="fas fa-arrow-left"></i> Back
      </button>
      
      <div className="modern-filter-container">
        <label htmlFor="status-filter" className="modern-filter-label">Filter by Status:</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          className="modern-filter-select"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </select>
      </div>
      
      {filteredEvents.length === 0 ? (
        <div className="modern-no-events">
          <p>No past events found{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}. Create a new event to get started!</p>
          <button
            className="modern-create-event-button"
            onClick={() => navigate('/create-event')}
          >
            Create New Event
          </button>
        </div>
      ) : (
        <div className="modern-content">
          <div className="modern-card-grid">
            {filteredEvents.map((event) => (
              <div key={event.id} className="modern-card">
                <div className="modern-card-image-container">
                  <img
                    src={event.file_url}
                    alt={event.event_name}
                    className="modern-card-image"
                    onError={handleImageError}
                  />
                  {!event.file_url && (
                    <div className="modern-image-placeholder">
                      <i className="fas fa-image" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
                      <span>No Image</span>
                    </div>
                  )}
                </div>
                <div className="modern-card-content">
                  <h3 className="modern-card-title">{event.event_name}</h3>
                  <div className="modern-card-details">
                    <div className="modern-detail-item">
                      <span className="modern-detail-icon"><i className="fas fa-map-marker-alt"></i></span>
                      <span>{event.location}</span>
                    </div>
                    <div className="modern-detail-item">
                      <span className="modern-detail-icon"><i className="fas fa-calendar-alt"></i></span>
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="modern-detail-item">
                      <span className="modern-detail-icon"><i className="fas fa-money-bill-wave"></i></span>
                      <span>{event.price}</span>
                    </div>
                    <div className="modern-detail-item">
                      <span className="modern-detail-icon"><i className="fas fa-clock"></i></span>
                      <span>{event.time}</span>
                    </div>
                  </div>
                </div>
                <div className="modern-card-footer">
                  <span className={`modern-status ${event.status.replace(' ', '-').toLowerCase()}`}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </span>
                  <button
                    className="modern-view-btn"
                    onClick={() => navigate('/view-past-event', { state: { eventid: event.id } })}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RehostEventForm;