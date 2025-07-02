import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EventGuestList.css";
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
    <>
      <header className="dashboard-header3">
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
        <button className="backbutton20" onClick={() => nav("/event-list")}>
          Back
        </button>
      </div>

      <div className="analytics-container">
        {/* Buttons to toggle views */}
        <div className="toggle-buttons">
          <button onClick={() => nav("/event-guest")}> Guest List</button>

          <button onClick={() => nav("/analytics")}>Analytics </button>
        </div>

        <div>
          <h2 className="table-title">{event?.name || 'Event'} - Guest List</h2>
          <div className="event-details">
            <p><strong>Date:</strong> {new Date(event?.start_date).toLocaleDateString()} - {new Date(event?.end_date).toLocaleDateString()}</p>
            <p><strong>Location:</strong> {event?.location}</p>
            <p><strong>Total Capacity:</strong> {event?.capacity}</p>
            <p><strong>Attendees:</strong> {attendees.length} / {event?.capacity}</p>
          </div>
          <table className="analytics-table">
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
                      <span className={`status-badge ${attendee.status?.toLowerCase() || 'pending'}`}>
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
    </>
  );
}
