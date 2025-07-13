import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EventGuestList.css";
import "./ModernOrganizerStyles.css";
import { toast } from "react-toastify";

export default function EventGuestList() {
  const nav = useNavigate();
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const fetchEventAttendees = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          nav("/");
          return;
        }

        // Fetch event details
        const eventResponse = await fetch(`http://localhost:5000/api/events/${eventId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!eventResponse.ok) {
          if (eventResponse.status === 401) {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("userId");
            nav("/");
            return;
          }
          throw new Error(`Failed to fetch event: ${eventResponse.status}`);
        }

        const eventData = await eventResponse.json();
        setEvent(eventData);

        // Fetch attendees for the event
        const attendeesResponse = await fetch(`http://localhost:5000/api/events/${eventId}/attendees`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!attendeesResponse.ok) {
          throw new Error(`Failed to fetch attendees: ${attendeesResponse.status}`);
        }

        const attendeesData = await attendeesResponse.json();
        setAttendees(attendeesData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load event data. Please try again later.");
        toast.error("Failed to load event data");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventAttendees();
    }
  }, [eventId, nav]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading event data...</p>
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
    <div className="modern-container">
      <header className="modern-header">
        <div className="header-left">
          <button className="modern-button" onClick={() => nav("/event-list")}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="header-logo" />
        </div>
        <h1 className="header-title">{event?.name || 'Event Guest List'}</h1>
        <button className="modern-button" onClick={() => nav('/')}>
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </header>

      <div className="modern-content">
        {/* Navigation tabs */}
        <div className="modern-tabs">
          <button className="modern-tab active" onClick={() => nav("/event-guest")}>
            <i className="fas fa-users"></i> Guest List
          </button>
          <button className="modern-tab" onClick={() => nav("/analytics")}>
            <i className="fas fa-chart-bar"></i> Analytics
          </button>
        </div>

        <div className="modern-card">
          <div className="event-summary-card">
            <div className="event-details">
              <div className="detail-item">
                <span className="detail-label">Date:</span> 
                <span className="detail-value">{new Date(event?.start_date).toLocaleDateString()} - {new Date(event?.end_date).toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Location:</span> 
                <span className="detail-value">{event?.location}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Capacity:</span> 
                <span className="detail-value">{attendees.length} / {event?.capacity}</span>
              </div>
            </div>
          </div>
          <div className="modern-table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Ticket Type</th>
                  <th>Status</th>
                  <th>Date Registered</th>
                </tr>
              </thead>
            <tbody>
              {attendees.length > 0 ? (
                attendees.map((attendee) => (
                  <tr key={attendee.id}>
                    <td>{`${attendee.first_name} ${attendee.last_name}`}</td>
                    <td>{attendee.email}</td>
                    <td>{attendee.phone || 'N/A'}</td>
                    <td>{attendee.ticket_type || 'General Admission'}</td>
                    <td>
                      <span className={`modern-badge ${attendee.status?.toLowerCase() || 'pending'}`}>
                        {attendee.status || 'Pending'}
                      </span>
                    </td>
                    <td>{new Date(attendee.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-attendees">
                    No attendees have registered for this event yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
}
