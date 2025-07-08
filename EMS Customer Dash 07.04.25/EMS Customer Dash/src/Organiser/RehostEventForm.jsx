import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ClipLoader } from 'react-spinners';
import './RehostEventForm.css';

function RehostEventForm() {
  const navigate = useNavigate();
  const [pastEvents, setPastEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    startdate: '',
    enddate: '',
    resetAttendees: true,
  });
  const [formErrors, setFormErrors] = useState({ startdate: '', enddate: '' });
  const [successMessage, setSuccessMessage] = useState(null);

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

        const response = await fetch('/api/events/past', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userId');
            sessionStorage.removeItem('user');
            navigate('/login');
            return;
          }
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        if (!isMounted) return;

        const data = await response.json();
        const eventsWithFormattedData = data.map((event) => ({
          id: event.event_id ? String(event.event_id) : '',
          event_name: event.name || 'Unnamed Event',
          location: event.location || 'Location not specified',
          start_date: event.startdate || 'Date not specified',
          end_date: event.enddate || 'Date not specified',
          time: event.time || 'Time not specified',
          status: (event.status || 'Pending').toLowerCase(),
          file_url: event.coverimage || '/default-event-image.jpg',
          description: event.description || 'No description available',
        }));

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
      setFilteredEvents(pastEvents.filter(event => event.status === statusFilter));
    }
  }, [statusFilter, pastEvents]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setFormData({
      startdate: '',
      enddate: '',
      resetAttendees: true,
    });
    setFormErrors({ startdate: '', enddate: '' });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFormErrors({ startdate: '', enddate: '' });

    if (!selectedEvent || !selectedEvent.id) {
      setError('Please select an event to rehost');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (formData.startdate < today) {
      setFormErrors((prev) => ({ ...prev, startdate: 'Start date must be today or in the future' }));
      return;
    }
    if (formData.enddate < formData.startdate) {
      setFormErrors((prev) => ({ ...prev, enddate: 'End date must be on or after the start date' }));
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/events/${selectedEvent.id}/rehost`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      setSuccessMessage(data.message || 'Event rehost request submitted successfully');
      setFormData({ startdate: '', enddate: '', resetAttendees: true });
      setSelectedEvent(null);

      // Refresh past events
      const pastEventsResponse = await fetch('/api/events/past', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (pastEventsResponse.ok) {
        const newData = await pastEventsResponse.json();
        const updatedEvents = newData.map((event) => ({
          id: event.event_id ? String(event.event_id) : '',
          event_name: event.name || 'Unnamed Event',
          location: event.location || 'Location not specified',
          start_date: event.startdate || 'Date not specified',
          end_date: event.enddate || 'Date not specified',
          time: event.time || 'Time not specified',
          status: (event.status || 'Pending').toLowerCase(),
          file_url: event.coverimage || '/default-event-image.jpg',
          description: event.description || 'No description available',
        }));
        setPastEvents(updatedEvents);
        setFilteredEvents(statusFilter === 'all' ? updatedEvents : updatedEvents.filter(event => event.status === statusFilter));
      }
    } catch (err) {
      console.error('Rehost error:', err);
      setError(err.message || 'Error rehosting event. Please try again.');
    }
  };

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  const handleImageError = (e) => {
    if (e.target.src !== '/default-event-image.jpg') {
      console.warn('Image failed to load:', e.target.src);
      e.target.src = '/default-event-image.jpg';
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
          <button className="backbutton20" onClick={() => navigate('/requestcard')}>
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
            onClick={() => isAuthError ? navigate('/login') : navigate('/requestcard')}
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
        <button className="backbutton20" onClick={() => navigate('/requestcard')}>
          Back
        </button>
      </div>
      <h2 className="title">Rehost Past Events</h2>
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
      {successMessage && (
        <div className="success-message">
          <p>{successMessage}</p>
        </div>
      )}
      {filteredEvents.length === 0 ? (
        <div className="no-events">
          <p>No past events found{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}.</p>
          <button
            className="create-event-button"
            onClick={() => navigate('/create-event')}
          >
            Create New Event
          </button>
        </div>
      ) : (
        <>
          <div className="card-grid">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className={`card ${selectedEvent && selectedEvent.id === event.id ? 'selected' : ''}`}
                onClick={() => handleEventSelect(event)}
              >
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
                    📅 Start: {formatDate(event.start_date)} <br />
                    📅 End: {formatDate(event.end_date)} <br />
                    ⏰ {event.time}
                  </p>
                </div>
                <div className="card-footer">
                  <span className={`status ${event.status.replace(' ', '-').toLowerCase()}`}>
                    Status: {event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {selectedEvent && (
            <div className="rehost-form">
              <h2>Rehost Event: {selectedEvent.event_name}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Start Date:</label>
                  <input
                    type="date"
                    value={formData.startdate}
                    onChange={(e) =>
                      setFormData({ ...formData, startdate: e.target.value })
                    }
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className={formErrors.startdate ? 'error-input' : ''}
                  />
                  {formErrors.startdate && (
                    <p className="error-message">{formErrors.startdate}</p>
                  )}
                </div>
                <div className="form-group">
                  <label>End Date:</label>
                  <input
                    type="date"
                    value={formData.enddate}
                    onChange={(e) =>
                      setFormData({ ...formData, enddate: e.target.value })
                    }
                    required
                    min={formData.startdate || new Date().toISOString().split('T')[0]}
                    className={formErrors.enddate ? 'error-input' : ''}
                  />
                  {formErrors.enddate && (
                    <p className="error-message">{formErrors.enddate}</p>
                  )}
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.resetAttendees}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          resetAttendees: e.target.checked,
                        })
                      }
                      title="Checking this will clear the attendee list for the rehosted event"
                    />
                    Reset Attendees
                  </label>
                </div>
                <button type="submit">Submit Rehost Request</button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default RehostEventForm;