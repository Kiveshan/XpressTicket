import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ParchasedTicket.css";
import '../shared/ModernDashboard.css';
import { FaSignOutAlt, FaArrowLeft, FaTicketAlt, FaCalendarAlt, FaEnvelope, FaSearch } from 'react-icons/fa';


const ticketData = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    tickets: 2,
    date: "2025-04-10",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    tickets: 4,
    date: "2025-04-12",
  },
];

const ParchasedTicket = () => {
  const nav = useNavigate();
  const location = useLocation();
  
  // Get event data from navigation state or use default values
  const eventData = location.state || {
    eventId: 'default',
    eventName: 'HOD Party Celebration',
    eventDate: '29 February 2025',
    eventLocation: 'Durban',
    eventPrice: 'R 12,000.00'
  };

  return (
    <div className="modern-dashboard-container">
      {/* Header */}
      <header className="modern-dashboard-header">
        <div className="modern-dashboard-logo-container">
          <img src="/XPRESS TICKETS LOGO2.png" alt="XpressTicket Logo" className="modern-dashboard-logo" />
        </div>
        <div className="modern-dashboard-header-actions">
          <button className="modern-dashboard-logout-btn" onClick={() => nav('/')}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="modern-dashboard-content">
        {/* Back Button */}
        <div className="modern-dashboard-back-btn-container">
          <button className="modern-dashboard-back-btn" onClick={() => nav('/customerdash')}>
            <FaArrowLeft /> Back to Dashboard
          </button>
        </div>

        {/* Page Title */}
        <div className="modern-dashboard-page-title">
          <h1><FaTicketAlt /> Your Purchased Tickets</h1>
          <p>View and manage your event tickets</p>
        </div>

        {/* Event Info Card */}
        <div className="modern-card event-info-card">
          <div className="event-info-header">
            <h2>{eventData.eventName}</h2>
            <div className="event-info-details">
              <span><FaCalendarAlt /> {eventData.eventDate}</span>
              <span><FaTicketAlt /> {eventData.eventLocation}</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="modern-search-container">
          <div className="modern-search-input-wrapper">
            <FaSearch className="modern-search-icon" />
            <input 
              type="text" 
              className="modern-search-input" 
              placeholder="Search tickets..." 
            />
          </div>
        </div>

        {/* Tickets Table Card */}
        <div className="modern-card">
          <div className="modern-table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Tickets</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ticketData.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>{ticket.name}</td>
                    <td>{ticket.email}</td>
                    <td><span className="ticket-count">{ticket.tickets}</span></td>
                    <td>{ticket.date}</td>
                    <td>
                      <button
                        className="modern-btn modern-btn-primary"
                        onClick={() => nav("/view-more-details")}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};


export default ParchasedTicket;
