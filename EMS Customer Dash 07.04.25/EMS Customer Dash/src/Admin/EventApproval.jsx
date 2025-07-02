import React, { useState, useEffect } from 'react';
import '../Organiser/EventRequest.css';
import { useNavigate } from 'react-router-dom';

const EventApproval = () => {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set your base URL for images here if needed (or leave empty string if not)
  const baseImageUrl = 'https://your-bucket-or-server-url/';

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = sessionStorage.getItem('token');
        if (!token) {
          console.error('No token found in sessionStorage');
          nav('/login');
          return;
        }

        console.log('Fetching events with token:', token.slice(0, 10) + '...');
        const response = await fetch('http://localhost:5000/api/admin/events', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Fetch failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error || 'No error message provided',
          });
          if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            nav('/login');
            return;
          }
          throw new Error(`Failed to fetch events: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        console.log('Fetched events:', data);

        setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 10 * 60 * 1000); // Refresh every 10 minutes

    return () => clearInterval(interval);
  }, [nav]);

  // Helper function to get correct image URL
  const getImageUrl = (event) => {
    const url = event.file_url || event.coverimage || '';
    if (!url) return '/default-profile-picture.jpg';
    if (url.startsWith('http')) return url;
    return baseImageUrl + url;
  };

  return (
    <div className="container12">
      <header className="dashboard-header1">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="dashboard-logo1"
          onError={(e) => {
            console.error('Failed to load logo');
            e.target.src = '/fallback-logo.png';
          }}
        />
        <div className="profile-section">
          <button className="backbutton22" onClick={() => nav('/')}>
            Log Out
          </button>
        </div>
      </header>

      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav('/admin-dash')}>
          Back
        </button>
      </div>
      <h2 className="title">Event Approval</h2>

      {error && <p className="error">{error}</p>}
      {loading && <p className="loading">Loading events...</p>}

      {!loading && events.length === 0 && !error && (
        <p className="no-events">No events available for approval.</p>
      )}

      <div className="card-grid">
        {events.map((event) => (
          <div key={event.id} className="card">
            <div className="card-image-container">
              <img
                src={getImageUrl(event)}
                alt={event.event_name || event.name || 'Event'}
                className="card-image"
                loading="lazy"
                onError={(e) => {
                  console.error(`Failed to load image for event ${event.id}:`, e.target.src);
                  e.target.src = '/default-profile-picture.jpg';
                }}
              />
            </div>
            <h3 className="card-title">{event.event_name || event.name || 'Untitled Event'}</h3>
            <div className="card-details">
              <p>
                📍 {event.location || 'N/A'} <br />
                📅 {event.date ? new Date(event.date).toLocaleDateString() : 'N/A'} <br />
                💰 {event.paid_amount != null ? `R ${parseFloat(event.paid_amount).toFixed(2)}` : 'N/A'} <br />
                ⏰ {event.time ? new Date(`1970-01-01T${event.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </p>
            </div>
            <div className="card-footer">
              <span className={`status ${event.status ? event.status.replace(' ', '-').toLowerCase() : 'pending'}`}>
                Status: {event.status || 'Pending'}
              </span>
              <button
                className="view-btn"
                onClick={() => nav('/adminvieweventrequest', { state: { eventid: event.id } })}
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventApproval;
