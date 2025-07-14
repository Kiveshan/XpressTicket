import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ParchasedTicketModern.css';
import { FaTicketAlt, FaSearch, FaEye, FaCalendarAlt, FaEnvelope, FaArrowLeft, FaSignOutAlt } from 'react-icons/fa';

// Ticket data will be fetched from the ticket_purchases table

const ParchasedTicket = () => {
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
    eventDate: '29 February 2025',
    eventLocation: 'Durban',
    eventPrice: 'R 12,000.00'
  };
  
  useEffect(() => {
    // Get user ID from session storage
    const getUserId = () => {
      const userInfo = sessionStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const parsedInfo = JSON.parse(userInfo);
          return parsedInfo.userId || parsedInfo.user_id;
        } catch (e) {
          console.error('Error parsing user info:', e);
          return null;
        }
      }
      return null;
    };

    const fetchTicketData = async () => {
      try {
        setLoading(true);
        
        // Get the authentication token from session storage
        const token = sessionStorage.getItem('token');
        const currentUserId = getUserId();
        setUserId(currentUserId);
        
        if (!token) {
          console.warn('No authentication token found in session storage');
          // Redirect to the Form component (root path) if no token is found
          nav('/');
          return;
        }
        
        if (!currentUserId) {
          console.warn('No user ID found in session storage');
          // Create a temporary user ID for testing purposes
          const tempUserId = 1; // Use a default user ID for testing
          console.log('Using temporary user ID for testing:', tempUserId);
          setUserId(tempUserId);
          // Continue with the temporary user ID instead of redirecting
        }

        // For testing purposes, we'll use demo data directly since the backend might not be ready
        console.log('Using demo data for testing purposes');
        console.log('Attempting to fetch tickets for event:', eventData);
        
        // Demo data for testing
        const demoTickets = [
          {
            id: 'fallback-1',
            name: 'John Doe',
            email: 'john.doe@example.com',
            tickets: 2,
            date: '2025-02-20',
            packageName: 'VIP',
            packageType: 'General',
            amount: 2000,
            purchaseId: 'purchase-123',
            delegateDetails: {
              name: 'John Doe',
              email: 'john.doe@example.com',
              phone: '1234567890',
              company: 'Example Inc.'
            }
          },
          {
            id: 'fallback-2',
            name: 'Jane Doe',
            email: 'jane.doe@example.com',
            tickets: 1,
            date: '2025-02-25',
            packageName: 'Standard',
            packageType: 'General',
            amount: 1000,
            purchaseId: 'purchase-456',
            delegateDetails: {
              name: 'Jane Doe',
              email: 'jane.doe@example.com',
              phone: '0987654321',
              company: 'Example Corp.'
            }
          },
          {
            id: 'fallback-3',
            name: 'Alice Smith',
            email: 'alice.smith@example.com',
            tickets: 3,
            date: '2025-03-01',
            packageName: 'Premium',
            packageType: 'VIP',
            amount: 3500,
            purchaseId: 'purchase-789',
            delegateDetails: {
              name: 'Alice Smith',
              email: 'alice.smith@example.com',
              phone: '5551234567',
              company: 'Tech Solutions'
            }
          }
        ];
        
        setTicketData(demoTickets);
        setLoading(false);
        
        /* Uncomment this when the backend API is ready
        
        const response = await fetch(`http://localhost:5000/api/ticket-purchases?event_id=${eventData.eventId}&user_id=${currentUserId}&status=approved`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const fallbackResponse = await fetch(`http://localhost:5000/api/ticket-purchases?user_id=${currentUserId}&status=approved`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!fallbackResponse.ok) {
            console.warn(`Failed to fetch ticket purchase data: ${fallbackResponse.statusText}`);
            setTicketData(demoTickets);
            setLoading(false);
            return;
          }
          
          // Process ticket purchases data based on the database schema
          const ticketPurchases = await fallbackResponse.json();
          console.log('Ticket purchases data:', ticketPurchases);
          
          // Transform the ticket purchases data to match our component's expectations
          const extractedTickets = [];
          
          if (Array.isArray(ticketPurchases) && ticketPurchases.length > 0) {
            console.log('Processing ticket purchases...');
            
            ticketPurchases.forEach((purchase, index) => {
              console.log(`Processing purchase ${index}:`, purchase);
              
              if (purchase.status && purchase.status.toLowerCase() === 'approved') {
                console.log(`Found approved purchase: ${purchase.purchase_id}`);
                
                if (purchase.delegate_details) {
                  let delegateDetails;
                  
                  if (typeof purchase.delegate_details === 'string') {
                    try {
                      delegateDetails = JSON.parse(purchase.delegate_details);
                    } catch (e) {
                      console.error('Error parsing delegate details:', e);
                      delegateDetails = null;
                    }
                  } else {
                    delegateDetails = purchase.delegate_details;
                  }
                  
                  if (Array.isArray(delegateDetails)) {
                    delegateDetails.forEach((delegate, delegateIndex) => {
                      extractedTickets.push({
                        id: `purchase-${purchase.purchase_id}-delegate-${delegateIndex}`,
                        name: delegate.name || delegate.fullName || (delegate.firstName && delegate.lastName ? `${delegate.firstName} ${delegate.lastName}` : 'Delegate'),
                        email: delegate.email || 'N/A',
                        tickets: purchase.number_of_tickets || 1,
                        date: new Date().toISOString().split('T')[0],
                        packageName: purchase.package || 'Standard',
                        packageType: 'Approved',
                        amount: purchase.amount,
                        purchaseId: purchase.purchase_id,
                        delegateDetails: delegate
                      });
                    });
                  } else if (delegateDetails && typeof delegateDetails === 'object') {
                    extractedTickets.push({
                      id: `purchase-${purchase.purchase_id}-delegate-single`,
                      name: delegateDetails.name || delegateDetails.fullName || (delegateDetails.firstName && delegateDetails.lastName ? `${delegateDetails.firstName} ${delegateDetails.lastName}` : 'Delegate'),
                      email: delegateDetails.email || 'N/A',
                      tickets: purchase.number_of_tickets || 1,
                      date: new Date().toISOString().split('T')[0],
                      packageName: purchase.package || 'Standard',
                      packageType: 'Approved',
                      amount: purchase.amount,
                      purchaseId: purchase.purchase_id,
                      delegateDetails: delegateDetails
                    });
                  }
                } else {
                  // No delegate details, create a generic ticket
                  extractedTickets.push({
                    id: `purchase-${purchase.purchase_id}-no-delegate`,
                    name: 'Unnamed Delegate',
                    email: 'N/A',
                    tickets: purchase.number_of_tickets || 1,
                    date: new Date().toISOString().split('T')[0],
                    packageName: purchase.package || 'Standard',
                    packageType: 'Approved',
                    amount: purchase.amount,
                    purchaseId: purchase.purchase_id,
                    delegateDetails: {}
                  });
                }
              }
            });
            
            console.log('Extracted tickets from specific endpoint:', extractedTickets);
            setTicketData(extractedTickets);
          } else {
            console.log('No ticket purchases found or invalid data structure');
            setTicketData([]);
          }
          
          setLoading(false);
        } else {
          // Process the response from the specific event endpoint
          const specificTickets = await response.json();
          console.log('Specific event tickets:', specificTickets);
          
          // Similar processing as above, but for the specific event endpoint
          const extractedTickets = [];
          
          // Process the tickets similar to above...
          
          console.log('Extracted tickets from specific endpoint:', extractedTickets);
          setTicketData(extractedTickets);
          setLoading(false);
        }
        */
        
      } catch (err) {
        console.error('Error fetching ticket data:', err);
        setError('Failed to load ticket data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchTicketData();
  }, [eventData.eventId, nav]);

  // Filter tickets based on search term
  const filteredTickets = ticketData.filter(ticket => {
    const searchLower = searchTerm.toLowerCase();
    return (
      ticket.name.toLowerCase().includes(searchLower) ||
      ticket.email.toLowerCase().includes(searchLower)
    );
  });

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle logout
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
              <span><FaEnvelope /> {eventData.eventLocation}</span>
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
              {/* Ticket count removed */}
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
                            onClick={() => nav("/view-more-details", { 
                              state: { 
                                ticketId: ticket.id,
                                purchaseId: ticket.purchaseId,
                                eventId: eventData.eventId,
                                delegateDetails: ticket.delegateDetails,
                                eventName: eventData.eventName,
                                packageName: ticket.packageName,
                                amount: ticket.amount,
                                tickets: ticket.tickets
                              } 
                            })}
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
          )}
        </div>
      </main>
    </div>
  );
};

export default ParchasedTicket;