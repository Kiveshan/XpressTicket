import React from "react";
import "../Organiser/TicketsEventList.css";
import { useNavigate } from "react-router-dom";

function TicketsEventList() {
  // Sample data for events
  const events = [
    {
      id: 1,
      eventName: "Tech Conference 2023",
      requests: 5,
    },
    {
      id: 2,
      eventName: "Music Festival",
      requests: 8,
    },
    {
      id: 3,
      eventName: "Art Expo",
      requests: 3,
    },
    {
      id: 4,
      eventName: "Food Carnival",
      requests: 10,
    },
  ];

  // Function to handle the "View" button click

  
    const nav = useNavigate(); // Initialize useNavigate for navigation

  return (
    <div className="tickets-event-list-container">
       <header className="dashboard-header1">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="dashboard-logo1"
        />
          <div className="profile-section">
              <button className="backbutton22" onClick={()=> nav('/')}>LogOut </button>
          </div>
      </header>

      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav("/requestcard")}>
          Back
        </button>
      </div>  
      <h2 className="tickets-event-list-title">Event Requests</h2>
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
              <td>{event.eventName}</td>
              <td>
                <span className="bell-icon">🔔</span> {event.requests}
              </td>
              <td>
                <button
                  className="view-button"
                  onClick={() => nav("/ticketsrequest")} // Navigate to the TicketsRequest page
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

export default TicketsEventList;
