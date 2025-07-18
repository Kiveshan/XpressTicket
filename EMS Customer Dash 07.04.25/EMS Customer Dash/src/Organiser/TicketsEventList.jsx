import React, { useState, useEffect } from 'react';
import './TicketsEventList.css';
import { useNavigate } from 'react-router-dom';

function TicketsEventList() {
  const navigate = useNavigate();
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
          navigate('/');
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
  }, [navigate]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="tickets-event-list-container">
      <header className="modern-header">
        <div className="header-left">
          <button className="modern-button" onClick={() => navigate('/requestcard')}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <img
            src="/XPRESS TICKETS LOGO2.png"
            alt="EventXpress Logo"
            className="header-logo"
          />
        </div>
        <h1 className="header-title"></h1> {/* Empty to maintain layout */}
        <button
          className="modern-button"
          onClick={() => {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("userId");
            sessionStorage.removeItem("user");
            navigate("/");
          }}
        >
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </header>
      <h2 className="tickets-event-list-title">Event Requests</h2>
      <div className="tickets-event-list-table">
        <table>
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
                    <span className="bell-icon">🔔</span> {event.request_count}
                  </td>
                  <td>
                    <button
                      className="view-button"
                      onClick={() => navigate(`/ticketsrequest/${event.event_id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TicketsEventList;