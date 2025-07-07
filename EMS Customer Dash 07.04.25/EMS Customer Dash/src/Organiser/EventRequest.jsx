import React, { useState, useEffect } from 'react';
import './EventRequest.css';
import { useNavigate } from 'react-router-dom';

const EventRequest = () => {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchEvents = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);
        setError(null);

        console.log('Session Storage:', { ...sessionStorage });

        let token = sessionStorage.getItem('token');
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

        console.log('Auth check - Token exists:', !!token);
        console.log('Auth check - User ID exists:', userId);

        if (!token || !userId) {
          console.warn('Authentication required - No token or user ID found');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('userId');
          sessionStorage.removeItem('user');
          nav('/login');
          return;
        }

        let tokenPayload;
        try {
          const tokenParts = token.split('.');
          if (3 !== tokenParts.length) {
            throw new Error('Invalid token format');
          }
          tokenPayload = JSON.parse(atob(tokenParts[1]));
          console.log('Token payload:', tokenPayload);

          const now = Math.floor(Date.now() / 1000);
          if (tokenPayload.exp && tokenPayload.exp < now) {
            console.error('Token expired at:', new Date(tokenPayload.exp * 1000));
            throw new Error('Token expired');
          }

          console.log('Token valid, expires at:', new Date(tokenPayload.exp * 1000));
          console.log('User ID from session:', userId);
        } catch (tokenError) {
          console.error('Token validation error:', tokenError);
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('userId');
          sessionStorage.removeItem('user');
          nav('/login');
          return;
        }

        const apiUrl = 'http://localhost:5000/api/events';
        console.log('Making request to:', apiUrl);
        console.log('With headers:', {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.substring(0, 10)}...`
        });

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Server responded with error:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            error: errorData
          });

          if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userId');
            sessionStorage.removeItem('user');
            nav('/login');
            return;
          }

          throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
        }

        if (!isMounted) return;

        const data = await response.json();
        console.log('Fetched events:', data);

        const eventsData = Array.isArray(data) ? data : [];

        const eventsWithStatus = eventsData.map((event) => {
          // Debug the packages array
          console.log(`Event ${event.id} packages:`, event.packages);

          // Format date to remove time portion
          const formattedDate = event.start_date
            ? new Date(event.start_date).toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Date not specified';

          // Get price from the first package
          let price = 'N/A';
          try {
            if (event.packages && Array.isArray(event.packages) && event.packages.length > 0) {
              const firstPackage = event.packages[0];
              console.log(`First package for event ${event.id}:`, firstPackage);
              if (firstPackage && firstPackage.price != null) {
                const parsedPrice = parseFloat(firstPackage.price);
                if (!isNaN(parsedPrice)) {
                  price = `R ${parsedPrice.toFixed(2)}`;
                } else {
                  console.warn(`Invalid price format for event ${event.id}:`, firstPackage.price);
                }
              } else {
                console.warn(`No price field in first package for event ${event.id}`);
              }
            } else {
              console.warn(`No packages or empty packages array for event ${event.id}`);
            }
          } catch (e) {
            console.error(`Error processing packages for event ${event.id}:`, e);
          }

          return {
            id: event.id,
            eventid: event.id,
            event_name: event.name || 'Unnamed Event',
            location: event.location || 'Location not specified',
            date: formattedDate,
            time: event.start_time || 'Time not specified',
            price: price,
            status: (event.status || 'Pending').toLowerCase(),
            file_url: event.coverimage || '/default-event-image.jpg',
          };
        });

        if (isMounted) {
          setEvents(eventsWithStatus);
          setError(null);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load events. Please try again later.');
          setEvents([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 10 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [nav]);

  if (loading) {
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
                nav('/login');
              }}
            >
              LogOut
            </button>
          </div>
        </header>
        <div className="back-button-container1">
          <button className="backbutton20" onClick={() => nav('/requestcard')}>
            Back
          </button>
        </div>
        <div className="loading-container">
          <p className="loading">Loading events...</p>
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
                  nav('/login');
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
            onClick={() => isAuthError ? nav('/login') : nav('/requestcard')}
          >
            {isAuthError ? 'Go to Login' : 'Back'}
          </button>
        </div>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>{isAuthError ? 'Authentication Required' : 'Error Loading Events'}</h3>
          <p className="error-message">{error}</p>
          <div className="action-buttons">
            {isAuthError ? (
              <button 
                className="login-button"
                onClick={() => {
                  sessionStorage.clear();
                  nav('/login');
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
                  fetchEvents();
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
              nav('/login');
            }}
          >
            LogOut
          </button>
        </div>
      </header>
      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav('/requestcard')}>
          Back
        </button>
      </div>
      <h2 className="title">Event Request</h2>
      {events.length === 0 ? (
        <div className="no-events">
          <p>No events found. Create your first event to get started!</p>
          <button 
            className="create-event-button" 
            onClick={() => nav('/create-event')}
          >
            Create New Event
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {events.map((event) => (
            <div key={event.id} className="card">
              <div className="card-image-container">
                <img
                  src={event.file_url}
                  alt={event.event_name}
                  className="card-image"
                  onError={(e) => {
                    if (e.target.src !== '/default-event-image.jpg') {
                      console.warn(`Failed to load image for event ${event.id}:`, event.file_url);
                      e.target.src = '/default-event-image.jpg';
                      e.target.classList.add('image-error');
                    }
                  }}
                  loading="lazy"
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
                  📍 {event.location} 📅 {event.date} 💰 {event.price} ⏰ {event.time}
                </p>
              </div>
              <div className="card-footer">
                <span className={`status ${event.status.replace(' ', '-').toLowerCase()}`}>
                  Status: {event.status}
                </span>
                <button
                  className="view-btn"
                  onClick={() => nav('/viewerequest', { state: { eventid: event.id } })}
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

export default EventRequest;