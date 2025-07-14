import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ParchasedTicketModern.css';
import { FaTicketAlt, FaSearch, FaEye, FaCalendarAlt, FaMapMarkerAlt, FaArrowLeft, FaSignOutAlt } from 'react-icons/fa';

const ParchasedTicketNew = () => {
  const nav = useNavigate();
  const location = useLocation();
  const [ticketData, setTicketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState(null);
  
  // Get event data from navigation state or use default values
  const eventData = location.state || {
    eventId: 'default',
    eventName: 'HOD Party Celebration',
    eventDate: '2023-12-31',
    eventLocation: 'Johannesburg, South Africa'
  };

  useEffect(() => {
    // Get user ID from session storage
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    if (userInfo && userInfo.id) {
      setUserId(userInfo.id);
    }

    // Simulate fetching ticket data
    const fetchTickets = async () => {
      try {
        setLoading(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulated data
        const simulatedTickets = [
          {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@example.com',
            packageName: 'Standard',
            amount: '1000.00',
            date: '2023-12-01'
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            packageName: 'Premium',
            amount: '1500.00',
            date: '2023-12-01'
          },
          {
            id: 3,
            name: 'Alice Green',
            email: 'alice.green@example.com',
            packageName: 'Standard',
            amount: '1000.00',
            date: '2023-12-01'
          }
        ];
        
        setTicketData(simulatedTickets);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError('Failed to load ticket information. Please try again.');
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredTickets = ticketData.filter(ticket => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      ticket.name.toLowerCase().includes(searchTermLower) ||
      ticket.email.toLowerCase().includes(searchTermLower)
    );
  });

  const handleViewDetails = (ticketId) => {
    nav(`/viewmoredetails/${ticketId}`, { state: { ticketId } });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userInfo');
    nav('/');
  };

  return (
    <div className="modern-dashboard-container">
      {/* Header with Logo and Logout */}
      <header className="modern-header">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="XpressTicket Logo"
          className="modern-logo"
        />
        <div className="modern-header-actions">
          <button className="modern-logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      <main className="modern-dashboard-content">
        {/* Back Button */}
        <div className="modern-back-button">
          <button className="modern-back-btn" onClick={() => nav('/customerdash')}>
            <FaArrowLeft /> Back to Dashboard
          </button>
        </div>

        {/* Page Title */}
        <div className="modern-dashboard-page-title">
          <h1><FaTicketAlt /> Your Approved Tickets</h1>
          <p>View and manage your approved event tickets</p>
        </div>

        {/* Event Info Card */}
        <div className="modern-card event-info-card">
          <div className="event-info-header">
            <h2>{eventData.eventName}</h2>
            <div className="event-meta">
              <span><FaCalendarAlt /> {eventData.eventDate}</span>
              <span><FaMapMarkerAlt /> {eventData.eventLocation}</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="modern-card">
          <div className="search-container">
            <div className="search-input-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="modern-search-input"
              />
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="modern-card">
          {loading ? (
            <div className="loading-container">
              <p>Loading ticket information...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-text">{error}</p>
              <button 
                className="modern-btn modern-btn-primary" 
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="no-tickets-container">
              <p>No matching tickets found.</p>
            </div>
          ) : (
            <div>
              <div className="modern-table-container">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Package</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map(ticket => (
                      <tr key={ticket.id}>
                        <td>{ticket.name}</td>
                        <td>{ticket.email}</td>
                        <td>
                          <span className="package-badge">
                            {ticket.packageName || 'Standard'}
                          </span>
                        </td>
                        <td>
                          <span className="amount-text">
                            {ticket.amount ? `R ${parseFloat(ticket.amount).toFixed(2)}` : 'N/A'}
                          </span>
                        </td>
                        <td>{ticket.date}</td>
                        <td>
                          <button
                            className="modern-btn modern-btn-primary"
                            onClick={() => handleViewDetails(ticket.id)}
                          >
                            <FaEye /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ParchasedTicketNew;
