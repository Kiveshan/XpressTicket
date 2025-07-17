import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ParchasedTicketModern.css';
import { FaSearch, FaEye, FaCalendarAlt, FaEnvelope, FaArrowLeft, FaSignOutAlt, FaUser, FaDownload } from 'react-icons/fa';

// Helper function to format price
const formatPrice = (price) => {
  if (price === 'N/A' || price === undefined || price === null) return 'N/A';
  const numPrice = parseFloat(price);
  return isNaN(numPrice) ? 'N/A' : `R ${numPrice.toFixed(2)}`;
};

// Process ticket data from API response
const processTicketData = (purchases, eventId) => {
  if (!Array.isArray(purchases)) return [];
  
  return purchases.flatMap(purchase => {
    // Skip if not approved or doesn't match eventId
    if (purchase.status !== 'approved' || purchase.event_id?.toString() !== eventId?.toString()) {
      return [];
    }
    
    try {
      // Parse delegate_details if it's a string, otherwise use as is
      const delegateDetails = typeof purchase.delegate_details === 'string' 
        ? JSON.parse(purchase.delegate_details)
        : purchase.delegate_details;
      
      // Handle both array and single object formats
      const delegates = Array.isArray(delegateDetails) ? delegateDetails : [delegateDetails];
      
      return delegates.map((delegate, index) => ({
        id: `${purchase.purchase_id}-${index}`,
        purchaseId: purchase.purchase_id,
        eventId: purchase.event_id,
        eventName: purchase.event_name || 'Event',
        ticketType: purchase.ticket_type || 'General',
        status: purchase.status,
        purchaseDate: purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString() : 'N/A',
        ...delegate,
        // Ensure all required fields have fallbacks
        name: delegate.name || `${delegate.firstName || ''} ${delegate.lastName || ''}`.trim() || 'Guest',
        email: delegate.email || 'No email provided',
        ticketNumber: delegate.ticketNumber || `TKT-${purchase.purchase_id}-${index}`,
        amount: delegate.amount || purchase.amount || 0,
        // Include all delegate details for the PDF
        delegateDetails: delegate
      }));
    } catch (error) {
      console.error('Error processing delegate details:', error);
      return [];
    }
  });
};

const ParchasedTicket = () => {
  const nav = useNavigate();
  const location = useLocation();
  const [ticketData, setTicketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState(null);
  
  // Get event data from navigation state
  const eventData = location.state || {};
  const { 
    eventId, 
    eventName = 'Event', 
    eventDate = 'Date not specified', 
    eventLocation = 'Location not specified',
    eventPrice = 'N/A',
    numberOfTickets = 0,
    ticketType = 'Standard'
  } = eventData;
  
  // Log the received data for debugging
  useEffect(() => {
    console.log('Event data received:', eventData);
    console.log('Current eventId:', eventData.eventId);
  }, [eventData]);
  
  // Handle viewing ticket details - navigates to ticket details page
  const handleViewDetails = (ticket) => {
    console.log('Viewing ticket details:', ticket);
    nav("/view-more-details", { 
      state: { 
        ticketId: ticket.id,
        purchaseId: ticket.purchaseId,
        eventId: ticket.eventId,
        eventName: ticket.eventName,
        eventDate: ticket.purchaseDate,
        eventLocation: ticket.eventLocation,
        ticketType: ticket.ticketType,
        amount: ticket.amount,
        delegateDetails: ticket.delegateDetails
      } 
    });
  };

  // Handle downloading a ticket as PDF
  const handleDownloadTicket = async (ticket) => {
    try {
      console.log('Generating PDF for ticket:', ticket);
      // In a real implementation, this would generate and download a PDF
      alert('PDF download functionality will be implemented here');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  useEffect(() => {
    // Reset state when eventId changes
    setTicketData([]);
    setLoading(true);
    setError(null);
    
    // Get user ID from session storage
    const getCurrentUserId = () => {
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

    let isMounted = true;

    const fetchTicketData = async () => {
      if (!eventData.eventId) {
        console.error('No event ID provided');
        if (isMounted) {
          setError('Event information is missing');
          setLoading(false);
        }
        return;
      }
      
      try {
        setLoading(true);
        
        // Get the authentication token from session storage
        const token = sessionStorage.getItem('token');
        const currentUserId = getCurrentUserId();
        setUserId(currentUserId);
        
        if (!token) {
          console.warn('No authentication token found in session storage');
          nav('/');
          return;
        }
        
        if (!currentUserId) {
          console.error('No user ID found in session storage');
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        console.log(`Fetching tickets for user ${currentUserId}`);

        // Fetch all ticket purchases for this user
        const response = await fetch(`http://localhost:5000/api/user-ticket-purchases/${currentUserId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ticket data: ${response.statusText}`);
        }

        const ticketPurchases = await response.json();
        console.log('All ticket purchases data:', ticketPurchases);

        if (!Array.isArray(ticketPurchases) || ticketPurchases.length === 0) {
          console.warn('No ticket purchases found for this user');
          setTicketData([]);
          setLoading(false);
          return;
        }

        // Process the ticket purchases data
        const processedTickets = processTicketData(ticketPurchases);
        
        // Filter tickets for the current event
        const eventTickets = processedTickets.filter(ticket => 
          ticket.eventId === eventId || 
          ticket.eventId?.toString() === eventId?.toString()
        );

        console.log(`Found ${eventTickets.length} tickets for event ${eventId}`, eventTickets);
        
        if (isMounted) {
          setTicketData(eventTickets);
        }
        
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
        if (isMounted) {
          setError('Failed to load ticket data. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchTicketData();
  }, [eventId, nav]);

  // Process ticket data from the API response
  const processTicketData = (purchases) => {
    if (!Array.isArray(purchases)) return [];
    
    return purchases.flatMap(purchase => {
      // Skip if not approved
      if (purchase.status !== 'approved') return [];
      
      try {
        // Parse delegate_details if it's a string, otherwise use as is
        const delegateDetails = typeof purchase.delegate_details === 'string' 
          ? JSON.parse(purchase.delegate_details)
          : purchase.delegate_details;
        
        // Handle both array and single object formats
        const delegates = Array.isArray(delegateDetails) ? delegateDetails : [delegateDetails];
        
        return delegates.map((delegate, index) => ({
          id: `${purchase.purchase_id}-${index}`,
          purchaseId: purchase.purchase_id,
          eventId: purchase.event_id,
          eventName: purchase.event_name || 'Event',
          ticketType: purchase.ticket_type || 'General',
          status: purchase.status,
          purchaseDate: purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString() : 'N/A',
          ...delegate,
          // Ensure all required fields have fallbacks
          name: delegate.name || `${delegate.firstName || ''} ${delegate.lastName || ''}`.trim() || 'Guest',
          email: delegate.email || 'No email provided',
          ticketNumber: delegate.ticketNumber || `TKT-${purchase.purchase_id}-${index}`,
          amount: delegate.amount || purchase.amount || 0,
          // Include all delegate details for the PDF
          delegateDetails: delegate
        }));
      } catch (error) {
        console.error('Error processing delegate details:', error);
        return [];
      }
    });
  };
  
  // Filter tickets based on search term and ensure they belong to the current event
  const filteredTickets = Array.isArray(ticketData) ? ticketData.filter(ticket => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (ticket.name && ticket.name.toLowerCase().includes(searchLower)) ||
      (ticket.email && ticket.email.toLowerCase().includes(searchLower)) ||
      (ticket.ticketNumber && ticket.ticketNumber.toLowerCase().includes(searchLower))
    );
  }) : [];

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

  // Reusable button component
  const ActionButton = ({ icon: Icon, label, onClick, variant = 'primary', fullWidth = false }) => {
    const isPrimary = variant === 'primary';
    const baseStyle = {
      padding: '0.6rem 1rem',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s ease',
      width: fullWidth ? '100%' : 'auto',
      border: isPrimary ? '1px solid #4ca1af' : '1px solid #e5e7eb',
      background: isPrimary ? '#4ca1af' : 'transparent',
      color: isPrimary ? 'white' : '#4ca1af'
    };

    const hoverStyle = isPrimary 
      ? { background: '#3a7f8a', borderColor: '#3a7f8a' }
      : { background: 'rgba(76, 161, 175, 0.1)' };

    return (
      <button
        onClick={onClick}
        style={baseStyle}
        onMouseOver={(e) => Object.assign(e.currentTarget.style, hoverStyle, {
          color: isPrimary ? 'white' : '#3a7f8a'
        })}
        onMouseOut={(e) => {
          e.currentTarget.style.background = baseStyle.background;
          e.currentTarget.style.borderColor = baseStyle.border;
          e.currentTarget.style.color = baseStyle.color;
        }}
      >
        {Icon && <Icon />}
        {label}
      </button>
    );
  };

  return (
    <div className="modern-dashboard-container" style={{
      minHeight: '100vh',
      background: '#f3f4f6',
      padding: '1rem 0 2rem'
    }}>
      <header className="modern-header" style={{
        background: 'linear-gradient(135deg, #2c3e50, #4ca1af)',
        color: 'white',
        padding: '1rem 2rem',
        marginBottom: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="header-content" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Your Tickets for {eventData.eventName}</h1>
          <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
            <ActionButton 
              icon={FaArrowLeft} 
              label="Back to Events" 
              onClick={() => nav(-1)} 
              variant="secondary"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white'
              }}
            />
            <ActionButton 
              icon={FaSignOutAlt} 
              label="Logout" 
              onClick={handleLogout}
              variant="secondary"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white'
              }}
            />
          </div>
        </div>
      </header>

      <div className="main-content">
        {ticketData.length > 0 && (
          <div className="event-details-summary">
            <div className="modern-card">
              <h3 style={{
                margin: '0 0 1rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid #eee',
                color: '#2c3e50',
                fontSize: '1.25rem',
                fontWeight: 600
              }}>Event: {ticketData[0]?.eventName || 'Event'}</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Ticket Type:</strong> {ticketData[0]?.ticketType || 'General'}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Status:</strong> 
                    <span style={{
                      color: ticketData[0]?.status === 'approved' ? '#10B981' : '#EF4444',
                      fontWeight: 500,
                      marginLeft: '0.5rem',
                      textTransform: 'capitalize'
                    }}>
                      {ticketData[0]?.status || 'N/A'}
                    </span>
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Purchase Date:</strong> {ticketData[0]?.purchaseDate || 'N/A'}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Total Tickets:</strong> {ticketData.length} {ticketData.length === 1 ? 'ticket' : 'tickets'}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Total Amount:</strong> {formatPrice(
                      ticketData.reduce((sum, ticket) => sum + (parseFloat(ticket.amount) || 0), 0)
                    )}
                  </p>
                </div>
              </div>
          </div>
        </div>
      )}

        <main className="modern-dashboard-content" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem 2rem',
          position: 'relative'
        }}>
          {/* Search Bar */}
          <div className="modern-card" style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#f9fafb',
              borderRadius: '4px'
            }}>
              <FaSearch size={16} />
              <input 
                type="search" 
                value={searchTerm} 
                onChange={handleSearchChange} 
                placeholder="Search tickets by name, email, or ticket number"
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>
          
          {/* Tickets Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner">Loading...</div>
            </div>
          ) : error ? (
            <div className="error-message" style={{ 
              background: '#fee2e2', 
              color: '#b91c1c', 
              padding: '1rem', 
              borderRadius: '4px',
              marginBottom: '1.5rem'
            }}>
              {error}
            </div>
          ) : filteredTickets.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginTop: '1.5rem'
            }}>
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="modern-card" style={{
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ 
                    padding: '1.25rem',
                    borderBottom: '1px solid #eee',
                    flex: '1'
                  }}>
                    <h4 style={{ 
                      margin: '0 0 0.5rem',
                      color: '#2c3e50',
                      fontSize: '1.1rem'
                    }}>
                      {ticket.name || 'Ticket Holder'}
                    </h4>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      color: '#4b5563',
                      fontSize: '0.9rem'
                    }}>
                      <FaEnvelope size={14} />
                      <span>{ticket.email || 'No email provided'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#4b5563',
                      fontSize: '0.9rem',
                      marginBottom: '0.5rem'
                    }}>
                      <FaTicketAlt size={14} />
                      <span>Ticket #{ticket.ticketNumber || 'N/A'}</span>
                    </div>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#4b5563',
                      fontSize: '0.9rem',
                      marginBottom: '0.5rem'
                    }}>
                      <FaCalendarAlt size={14} />
                      <span>{ticket.purchaseDate || 'N/A'}</span>
                    </div>
                    
                    {/* Delegate Details Section */}
                    {ticket.delegateDetails && (
                      <div style={{ 
                        marginTop: '1rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px dashed #e5e7eb'
                      }}>
                        <p style={{ 
                          margin: '0 0 0.5rem',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: '#4b5563'
                        }}>
                          Delegate Information
                        </p>
                        
                        {/* Name */}
                        {(ticket.delegateDetails.firstName || ticket.delegateDetails.lastName) && (
                          <div style={{ 
                            display: 'flex',
                            gap: '0.5rem',
                            marginBottom: '0.25rem',
                            fontSize: '0.85rem',
                            color: '#6b7280'
                          }}>
                            <span style={{ minWidth: '80px', color: '#4b5563' }}>Name:</span>
                            <span>
                              {[ticket.delegateDetails.firstName, ticket.delegateDetails.lastName]
                                .filter(Boolean)
                                .join(' ')}
                            </span>
                          </div>
                        )}
                        
                        {/* Organization */}
                        {ticket.delegateDetails.organization && (
                          <div style={{ 
                            display: 'flex',
                            gap: '0.5rem',
                            marginBottom: '0.25rem',
                            fontSize: '0.85rem',
                            color: '#6b7280'
                          }}>
                            <span style={{ minWidth: '80px', color: '#4b5563' }}>Organization:</span>
                            <span>{ticket.delegateDetails.organization}</span>
                          </div>
                        )}
                        
                        {/* Job Title */}
                        {ticket.delegateDetails.jobTitle && (
                          <div style={{ 
                            display: 'flex',
                            gap: '0.5rem',
                            marginBottom: '0.25rem',
                            fontSize: '0.85rem',
                            color: '#6b7280'
                          }}>
                            <span style={{ minWidth: '80px', color: '#4b5563' }}>Position:</span>
                            <span>{ticket.delegateDetails.jobTitle}</span>
                          </div>
                        )}
                        
                        {/* Phone Number */}
                        {ticket.delegateDetails.phone && (
                          <div style={{ 
                            display: 'flex',
                            gap: '0.5rem',
                            marginBottom: '0.25rem',
                            fontSize: '0.85rem',
                            color: '#6b7280'
                          }}>
                            <span style={{ minWidth: '80px', color: '#4b5563' }}>Phone:</span>
                            <span>{ticket.delegateDetails.phone}</span>
                          </div>
                        )}
                        
                        {/* Dietary Requirements */}
                        {ticket.delegateDetails.dietaryRequirements && (
                          <div style={{ 
                            display: 'flex',
                            gap: '0.5rem',
                            fontSize: '0.85rem',
                            color: '#6b7280'
                          }}>
                            <span style={{ minWidth: '80px', color: '#4b5563' }}>Dietary:</span>
                            <span>{ticket.delegateDetails.dietaryRequirements}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ 
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    gap: '0.75rem',
                    borderTop: '1px solid #eee'
                  }}>
                    <ActionButton 
                      icon={FaEye} 
                      label="View" 
                      onClick={() => handleViewDetails(ticket)}
                      variant="secondary"
                      fullWidth
                    />
                    <ActionButton 
                      icon={FaDownload} 
                      label="Download" 
                      onClick={() => handleDownloadTicket(ticket)}
                      variant="primary"
                      fullWidth
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <NoTicketsFound />
          )}
        </main>
      </div>
    </div>
  );
};

// Helper component for displaying when no tickets are found
const NoTicketsFound = ({ message = 'No tickets found matching your search.' }) => (
  <div style={{
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '3rem 2rem',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
  }}>
    <div style={{ 
      maxWidth: '400px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '3rem',
        color: '#e5e7eb',
        marginBottom: '1rem'
      }}>
        <FaTicketAlt />
      </div>
      <h3 style={{
        color: '#374151',
        margin: '0 0 0.5rem',
        fontSize: '1.25rem'
      }}>
        No Tickets Found
      </h3>
      <p style={{
        color: '#6b7280',
        margin: '0 0 1.5rem',
        lineHeight: '1.5'
      }}>
        {message}
      </p>
      <button 
        onClick={() => window.location.reload()}
        style={{
          background: '#4ca1af',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1.5rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          transition: 'background-color 0.2s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = '#3a7f8a'}
        onMouseOut={(e) => e.currentTarget.style.background = '#4ca1af'}
      >
        Refresh Page
      </button>
    </div>
  </div>
);

export default ParchasedTicket;