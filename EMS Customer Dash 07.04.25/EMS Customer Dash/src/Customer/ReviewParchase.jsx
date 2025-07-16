import React, { useState, useEffect } from 'react';
import "./ReviewParchase.css";
import { useNavigate } from 'react-router-dom';
import '../shared/ModernDashboard.css';
import { FaSignOutAlt, FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaClock, FaMoneyBillWave } from 'react-icons/fa';
import { DEFAULT_IMAGE_DATA_URI } from '../utils/imageUtils';

function ReviewParchase() {
  const nav = useNavigate();
  const [purchasedEvents, setPurchasedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPurchasedTickets = async () => {
      try {
        setLoading(true);
        
        const token = sessionStorage.getItem('token');
        
        if (!token) {
          console.warn('No authentication token found in session storage');
          nav('/login');
          return;
        }
        
        const timestamp = new Date().getTime();
        const eventsResponse = await fetch(`http://localhost:5000/api/events/available?_=${timestamp}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!eventsResponse.ok) {
          throw new Error(`Failed to fetch events: ${eventsResponse.statusText}`);
        }
        
        const eventsData = await eventsResponse.json();
        console.log('Available events data:', eventsData);
        
        let userId = 'current-user';
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          if (tokenPayload && tokenPayload.id) {
            userId = tokenPayload.id;
          }
        } catch (e) {
          console.warn('Could not parse token for user ID');
        }
        
        const simulatedPurchasedEvents = eventsData
          .slice(0, Math.min(3, eventsData.length))
          .map((event, index) => {
            const isPast = index === eventsData.length - 1;
            const eventDate = new Date(event.date || Date.now());
            
            console.log(`ReviewParchase - Event ${event.id || event._id} (${event.name}) image fields:`, {
              file_url: event.file_url,
              coverimage: event.coverimage,
              file_urlType: typeof event.file_url,
              coverimageType: typeof event.coverimage
            });
            
            return {
              ...event,
              ticketId: `ticket-${event._id || event.id || index}`,
              ticketType: index % 2 === 0 ? 'Standard' : 'VIP',
              ticketPrice: (1000 + (index * 500)).toFixed(2),
              purchaseDate: new Date(Date.now() - (index * 86400000)).toISOString(),
              status: isPast || eventDate < new Date() ? 'Past' : 'Active'
            };
          });
        
        setPurchasedEvents(simulatedPurchasedEvents);
      } catch (err) {
        console.error('Error fetching purchased tickets:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPurchasedTickets();
  }, [nav]);
  
  return (
    <div className="modern-dashboard-container">
      <header className="modern-header">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="modern-logo"
        />
        <div className="modern-header-actions">
          <button className="modern-logout-btn" onClick={() => nav('/')}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>
      
      <div className="modern-back-button">
        <button className="modern-back-btn" onClick={() => nav("/customerdash")}>
          <FaArrowLeft /> Back to Dashboard
        </button>
      </div>

      <main className="purchase-main-content">
        <h1 className="purchase-page-title">My Purchased Tickets</h1>
        <p className="purchase-page-description">View all events you've purchased tickets for</p>
        
        <div className="purchase-card-grid">
          {loading ? (
            <div className="purchase-loading">
              <p>Loading your tickets...</p>
            </div>
          ) : error ? (
            <div className="purchase-error">
              <p>Error loading your tickets: {error}</p>
              <button className="purchase-retry-btn" onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : purchasedEvents.length === 0 ? (
            <div className="purchase-no-tickets">
              <p>You haven't purchased any tickets yet.</p>
              <button className="purchase-browse-btn" onClick={() => nav('/eventmenu')}>Browse Events</button>
            </div>
          ) : (
            purchasedEvents.map((event, index) => (
              <div className="purchase-event-container" key={`event-${index}`} onClick={() => nav('/parchasedticket', { state: { eventId: event._id || event.id } })}>
                <div className="purchase-event-card">
                  <div className={`purchase-event-status ${event.status === 'Past' ? 'purchase-event-status-past' : ''}`}>
                    {event.status}
                  </div>
                  <div className="purchase-event-image-container">
                    <img
                      src={event.file_url || DEFAULT_IMAGE_DATA_URI}
                      alt={event.name}
                      className="purchase-event-image"
                      onError={(e) => {
                        if (e.target.src !== DEFAULT_IMAGE_DATA_URI) {
                          console.warn(`Failed to load image for event ${event.id || event._id}: ${e.target.src}`);
                          e.target.src = DEFAULT_IMAGE_DATA_URI;
                        }
                      }}
                    />
                  </div>
                  <div className="purchase-event-title-container">
                    <h3 className="purchase-event-title">{event.name}</h3>
                  </div>
                </div>
                
                <div className="purchase-event-details-card">
                  <div className="purchase-event-detail-item">
                    <FaMapMarkerAlt className="purchase-event-icon" />
                    <span>{event.location || 'TBA'}</span>
                  </div>
                  <div className="purchase-event-detail-item">
                    <FaCalendarAlt className="purchase-event-icon" />
                    <span>{event.date || 'TBA'}</span>
                  </div>
                  <div className="purchase-event-detail-item">
                    <FaClock className="purchase-event-icon" />
                    <span>{event.time || 'TBA'}</span>
                  </div>
                  <div className="purchase-event-detail-item purchase-event-price">
                    <FaMoneyBillWave className="purchase-event-icon" />
                    <span>R {event.ticketPrice || 'N/A'}</span>
                  </div>
                  <div className="purchase-button-group">
                    <button className="purchase-view-tickets-btn">View Tickets</button>
                    <button 
                      className="purchase-invoice-btn" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        nav('/invoice', { 
                          state: { 
                            eventId: event._id || event.id, 
                            eventName: event.name, 
                            eventDate: event.date, 
                            eventLocation: event.location, 
                            eventPrice: `R ${event.ticketPrice || 'N/A'}` 
                          } 
                        }); 
                      }}
                    >
                      Invoice
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default ReviewParchase;