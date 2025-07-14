import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './CompactTicketStyles.css';
import { FaTicketAlt, FaSearch, FaEye, FaCalendarAlt, FaMapMarkerAlt, FaArrowLeft, FaSignOutAlt } from 'react-icons/fa';

const CompactTicketPage = () => {
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
    <div className="compact-container">
      {/* Header with Logo and Logout */}
      <header className="compact-header">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="XpressTicket Logo"
          className="compact-logo"
        />
        <div className="compact-header-actions">
          <button className="compact-logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      <main className="compact-content">
        {/* Back Button */}
        <div className="compact-back-button">
          <button className="compact-back-btn" onClick={() => nav('/customerdash')}>
            <FaArrowLeft /> Back to Dashboard
          </button>
        </div>

        {/* Page Title */}
        <div className="compact-page-title">
          <h1><FaTicketAlt /> Your Approved Tickets</h1>
          <p>View and manage your approved event tickets</p>
        </div>

        {/* Event Info Card */}
        <div className="compact-card compact-event-card">
          <div className="compact-event-header">
            <h2>{eventData.eventName}</h2>
            <div className="compact-event-meta">
              <span><FaCalendarAlt /> {eventData.eventDate}</span>
              <span><FaMapMarkerAlt /> {eventData.eventLocation}</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="compact-card">
          <div className="compact-search-container">
            <div className="compact-search-input-wrapper">
              <FaSearch className="compact-search-icon" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="compact-search-input"
              />
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="compact-card">
          {loading ? (
            <div className="compact-loading">
              <p>Loading ticket information...</p>
            </div>
          ) : error ? (
            <div className="compact-error">
              <p className="compact-error-text">{error}</p>
              <button 
                className="compact-btn compact-btn-primary" 
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="compact-no-tickets">
              <p>No matching tickets found.</p>
            </div>
          ) : (
            <div>
              <div className="compact-table-container">
                <table className="compact-table">
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
                          <span className="compact-package-badge">
                            {ticket.packageName || 'Standard'}
                          </span>
                        </td>
                        <td>
                          <span className="compact-amount-text">
                            {ticket.amount ? `R ${parseFloat(ticket.amount).toFixed(2)}` : 'N/A'}
                          </span>
                        </td>
                        <td>{ticket.date}</td>
                        <td>
                          <button
                            className="compact-btn compact-btn-primary"
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

export default CompactTicketPage;
