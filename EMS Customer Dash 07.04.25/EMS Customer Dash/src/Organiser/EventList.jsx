import React, { useState, useEffect } from "react";
import "../Organiser/TicketsEventList.css";
import "./ModernOrganizerStyles.css";
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
          <button className="modern-button" onClick={() => nav("/organiser-dash")}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="header-logo" />
        </div>
        <h1 className="header-title">Event List</h1>
        <button className="modern-button" onClick={() => nav('/')}>
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </header>
      
      <div className="modern-content">
        <div className="modern-card">
          <h2 className="modern-section-title">Your Events</h2>
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
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.name}</td>
                    <td>
                      <span className="modern-badge">{event.attendee_count || 0}</span>
                    </td>
                    <td>
                      <button
                        className="modern-button"
                        onClick={() => nav(`/event-guest/${event.id}`)}
                      >
                        <i className="fas fa-eye"></i> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventList;
