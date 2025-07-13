import React, { useState, useEffect } from 'react';
import './TicketsEventList.css';
import './ModernOrganizerStyles.css';
import { useNavigate } from 'react-router-dom';

function TicketsEventList() {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = sessionStorage.getItem('token');
        console.log('Token:', token);
        if (!token) {
          setError('No authentication token found. Please log in.');
          setLoading(false);
          nav('/');
          return;
        }
        console.log('Fetching from: http://localhost:5000/api/organiser/events');
        const response = await fetch('http://localhost:5000/api/organiser/events', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        console.log('Events data:', data);
        setEvents(data);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchEvents();
  }, [nav]);
 
  if (loading) {
    return (
      <div className="modern-container">
        <div className="modern-loading">
          <div className="spinner"></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-container">
        <div className="modern-error">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button className="modern-button" onClick={() => window.location.reload()}>
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      </div>
    );
  }
 
  return (
    <div className="modern-container">
      <header className="modern-header">
        <div className="header-left">
          <button className="modern-button" onClick={() => nav('/requestcard')}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="header-logo" />
        </div>
        <h1 className="header-title">Event Requests</h1>
        <button className="modern-button" onClick={() => nav('/')}>
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </header>
      
      <div className="modern-content">
        <div className="modern-card">
          <h2 className="modern-section-title">Event Requests</h2>
          <div className="modern-table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Requests</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan="3">No events found</td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.event_id}>
                      <td>{event.event_name}</td>
                      <td>
                        <span className="modern-badge">
                          <i className="fas fa-bell"></i> {event.request_count}
                        </span>
                      </td>
                      <td>
                        <button
                          className="modern-button"
                          onClick={() => nav(`/ticketsrequest/${event.event_id}`)}
                        >
                          <i className="fas fa-eye"></i> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
 
export default TicketsEventList;
 