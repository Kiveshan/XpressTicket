import React, { useState, useEffect } from "react";
import "../Organiser/TicketsEventList.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          nav("/");
          return;
        }

        const response = await fetch("http://localhost:5000/api/events/organizer", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("userId");
            nav("/");
            return;
          }
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setEvents(data);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again later.");
        toast.error("Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [nav]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="tickets-event-list-container">
      <header className="dashboard-header1">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="dashboard-logo1"
        />
        <div className="profile-section">
          <button className="backbutton22" onClick={() => nav('/')}>LogOut </button>
        </div>
      </header>

      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav("/organiser-dash")}>
          Back
        </button>
      </div>
      <table className="tickets-event-list-table">
        <thead>
          <tr>
            <th>Event Name</th>
            <th>Requests</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{event.name}</td>
              <td>
                {event.attendee_count || 0}
              </td>
              <td>
                <button
                  className="view-button"
                  onClick={() => nav(`/event-guest/${event.id}`)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EventList;
