import React, { useState, useEffect } from 'react';
import './RehostEventForm.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RehostEventForm = () => {
  const [pastEvents, setPastEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({ startdate: '', enddate: '', resetAttendees: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPastEvents = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        const response = await axios.get('/api/events/past', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Ensure response.data.events is an array
        if (!Array.isArray(response.data.events)) {
          throw new Error('Invalid response format: events is not an array');
        }

        const eventsWithFormattedData = response.data.events.map((event) => ({
          ...event,
          event_id: event.event_id || '',
          event_name: event.name || 'Unnamed Event',
          location: event.location || 'Location not specified',
          date: event.startdate || 'Date not specified',
          time: event.time || 'Time not specified',
          price: event.paid_amount ? `R ${parseFloat(event.paid_amount).toFixed(2)}` : 'N/A',
          status: (event.status || 'Pending').toLowerCase(),
          file_url: event.coverimage || '/default-event-image.jpg',
        }));
        setPastEvents(eventsWithFormattedData);
        setError(null);
      } catch (error) {
        console.error('Error fetching past events:', error);
        setError(error.response?.data?.error || error.message || 'Failed to fetch past events');
      } finally {
        setLoading(false);
      }
    };

    fetchPastEvents();
  }, []);

  const handleSelectEvent = (event) => {
    if (event && event.event_id) {
      setSelectedEvent(event);
      setFormData({
        startdate: '',
        enddate: '',
        resetAttendees: true,
      });
      setSuccessMessage(null);
      setError(null);
    } else {
      setError('Invalid event selected');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEvent || !selectedEvent.event_id) {
      setError('No event selected');
      return;
    }

    // Client-side date validation
    const today = new Date().toISOString().split('T')[0];
    if (formData.startdate < today) {
      setError('Start date must be today or in the future');
      return;
    }
    if (formData.enddate < formData.startdate) {
      setError('End date must be on or after the start date');
      return; // Fixed: Added closing brace
    }

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const response = await axios.put(
        `/api/events/${selectedEvent.event_id}/rehost`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccessMessage(response.data.message);
      setError(null);
      setFormData({ startdate: '', enddate: '', resetAttendees: true });
      setSelectedEvent(null);
      // Refetch events
      const updatedResponse = await axios.get('/api/events/past', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!Array.isArray(updatedResponse.data.events)) {
        throw new Error('Invalid response format: events is not an array');
      }
      const eventsWithFormattedData = updatedResponse.data.events.map((event) => ({
        ...event,
        event_id: event.event_id || '',
        event_name: event.name || 'Unnamed Event',
        location: event.location || 'Location not specified',
        date: event.startdate || 'Date not specified',
        time: event.time || 'Time not specified',
        price: event.paid_amount ? `R ${parseFloat(event.paid_amount).toFixed(2)}` : 'N/A',
        status: (event.status || 'Pending').toLowerCase(),
        file_url: event.coverimage || '/default-event-image.jpg',
      }));
      setPastEvents(eventsWithFormattedData);
    } catch (error) {
      console.error('Error rehosting event:', error);
      setError(error.response?.data?.error || error.message || 'Failed to rehost event');
      setSuccessMessage(null);
    }
  };

  const handleCancel = () => {
    setSelectedEvent(null);
    setFormData({ startdate: '', enddate: '', resetAttendees: true });
    setError(null);
    setSuccessMessage(null);
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
          <button className="backbutton20" onClick={() => navigate('/organiser-dash')}>
            Back
          </button>
        </div>
        <div className="loading-container">
          <p className="loading">Loading past events...</p>
        </div>
      </div>
    );
  }

  if (error && !selectedEvent) {
    const isAuthError = error.includes('log in') || error.includes('expired') || error.includes('authentication token');
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
          <h3>{isAuthError ? 'Authentication Required' : 'Error Loading Events'}</h3>
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
      <h2 className="title">Rehost Past Events</h2>

      {successMessage && <p className="success-message">{successMessage}</p>}

      {!selectedEvent ? (
        pastEvents.length === 0 ? (
          <div className="no-events">
            <p>No past events available for rehosting.</p>
            <button
              className="create-event-button"
              onClick={() => navigate('/event-form')}
            >
              Create New Event
            </button>
          </div>
        ) : (
          <div className="card-grid">
            {pastEvents.map((event) => (
              <div
                key={event.event_id}
                className="card"
                onClick={() => handleSelectEvent(event)}
              >
                <div className="card-image-container">
                  <img
                    src={event.file_url}
                    alt={event.event_name}
                    className="card-image"
                    onError={(e) => {
                      if (e.target.src !== '/default-event-image.jpg') {
                        console.warn(`Failed to load image for event ${event.event_id}:`, event.file_url);
                        e.target.src = '/default-event-image.jpg';
                        e.target.classList.add('image-error');
                      }
                    }}
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
                    📅 {event.date} <br />
                    ⏰ {event.time} <br />
                    💰 {event.price}
                  </p>
                </div>
                <div className="card-footer">
                  <span className={`status ${event.status}`}>
                    Status: {event.status}
                  </span>
                  <button
                    className="view-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectEvent(event);
                    }}
                  >
                    Select to Rehost
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="rehost-form">
          {error && <p className="error-message">{error}</p>}
          <h3>Rehost: {selectedEvent.event_name}</h3>
          <div className="event-details">
            <p><strong>Description:</strong> {selectedEvent.description || 'No description'}</p>
            <p><strong>Location:</strong> {selectedEvent.location}</p>
            <p><strong>Original Date:</strong> {selectedEvent.date}</p>
            {selectedEvent.file_url && (
              <img
                src={selectedEvent.file_url}
                alt={selectedEvent.event_name}
                className="event-image"
                onError={(e) => {
                  if (e.target.src !== '/default-event-image.jpg') {
                    e.target.src = '/default-event-image.jpg';
                  }
                }}
              />
            )}
          </div>
          <form onSubmit={handleSubmit} className="rehost-form">
            <div className="form-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={formData.startdate}
                onChange={(e) => setFormData({ ...formData, startdate: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-group">
              <label>End Date:</label>
              <input
                type="date"
                value={formData.enddate}
                onChange={(e) => setFormData({ ...formData, enddate: e.target.value })}
                required
                min={formData.startdate || new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.resetAttendees}
                  onChange={(e) => setFormData({ ...formData, resetAttendees: e.target.checked })}
                />
                Reset Attendees
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                Rehost Event
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RehostEventForm;