import React, { useState, useEffect } from 'react';
import './EventMenu.css';
import { useNavigate } from 'react-router-dom';

function EventMenu() {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch approved events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:5000/api/public/approved-events', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const data = await response.json();
        // Map the fetched events to match the expected format
        const formattedEvents = data.map(event => ({
          id: event.id,
          name: event.name,
          location: event.location,
          date: new Date(event.start_date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
          }), // Format as "DD MMM"
          price: event.paid_amount ? `R ${parseFloat(event.paid_amount).toFixed(2)}` : 'N/A',
          time: event.start_time ? event.start_time.slice(0, 5) : 'N/A', // Format time as "HH:MM"
          image: event.coverimage || '/default-profile-picture.jpg',
          link: `/customerviewevent/${event.id}`, // Dynamic link to event details
        }));

        setEvents(formattedEvents);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="dashboard-logo"
        />
        <div className="profile-section">
          <button className="backbutton22" onClick={() => nav('/')}>
            LogOut
          </button>
        </div>
      </header>

      {/* Back Button */}
      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav('/customerdash')}>
          Back
        </button>
      </div>

      <main className="dashboard-main1">
        {loading ? (
          <p>Loading events...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : events.length === 0 ? (
          <p>No approved events available.</p>
        ) : (
          <div className="event-grid">
            {events.map((event) => (
              <div
                key={event.id}
                className="event-card"
                onClick={() => nav(event.link)}
              >
                <img src={event.image} alt={event.name} className="event-image" />
                <div className="event-details">
                  <h3
                    className="eventname"
                    style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}
                  >
                    {event.name}
                  </h3>
                  <p className="event-infor">
                    📍 {event.location} | 📅 {event.date} | 💰 {event.price} | ⏰ {event.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default EventMenu;