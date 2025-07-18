import React, { useState, useEffect } from "react";
import "./CustomerViewEvent.css";
import "../shared/ModernDashboard.css";
import { useNavigate, useParams } from 'react-router-dom';
import { FaSignOutAlt, FaArrowLeft, FaExclamationTriangle, FaHome, FaCalendarAlt, FaMapMarkerAlt, FaInfoCircle } from 'react-icons/fa';
import EventImage from '../utils/EventImage';

const CustomerViewEvent = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [packages, setPackages] = useState([]);
  const { eventId } = useParams();
  const nav = useNavigate();

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        console.log(`Fetching event details for ID: ${eventId}`);
        
        // Get the authentication token from session storage
        const token = sessionStorage.getItem('token');
        
        if (!token) {
          console.warn('No authentication token found in session storage');
          nav('/login');
          return;
        }
        
        console.log(`Making request to: http://localhost:5000/api/events/${eventId}`);
        
        const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized: Please log in again');
          } else if (response.status === 403) {
            throw new Error('Forbidden: You do not have permission to view this event');
          } else if (response.status === 404) {
            throw new Error('Event not found: The requested event does not exist or has been removed');
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to fetch event details');
          }
        }
        
        const data = await response.json();
        setEvent(data.event || data); // Handle both response formats
        setPackages(data.packages || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError(err.message || 'An error occurred while fetching event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId, nav]);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    nav('/login');
  };

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading event details...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <FaExclamationTriangle className="error-icon" />
          <h2>Event Not Found</h2>
          <p>The event you're looking for doesn't exist or has been removed.</p>
          <div className="button-group">
            <button 
              onClick={() => nav(-1)} 
              className="back-button"
            >
              <FaArrowLeft /> Go Back
            </button>
            <button 
              onClick={() => nav('/events')} 
              className="primary-button"
            >
              <FaHome /> Browse Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Event details view
  return (
    <div className="customer-view-event">
      {/* Header */}
      <header className="event-header">
        <div className="container">
          <div className="header-content">
            <button onClick={() => nav(-1)} className="back-button">
              <FaArrowLeft /> Back
            </button>
            <h1>{event.name}</h1>
            <button onClick={handleLogout} className="logout-button">
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="event-main">
        <div className="container">
          {/* Event Image */}
          <div className="event-image-container">
            <EventImage eventType={event.event_type} className="event-image" />
          </div>

          {/* Event Details */}
          <div className="event-details">
            <div className="event-meta">
              <div className="meta-item">
                <FaCalendarAlt className="meta-icon" />
                <span>{new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</span>
              </div>
              <div className="meta-item">
                <FaMapMarkerAlt className="meta-icon" />
                <span>{event.location || 'Location not specified'}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 0 ? 'active' : ''}`}
                onClick={() => setActiveTab(0)}
              >
                About
              </button>
              <button 
                className={`tab ${activeTab === 1 ? 'active' : ''}`}
                onClick={() => setActiveTab(1)}
              >
                Packages
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 0 ? (
                <div className="about-tab">
                  <h3>Event Description</h3>
                  <p>{event.description || 'No description available.'}</p>
                  
                  {event.terms_and_conditions && (
                    <div className="terms-section">
                      <h4><FaInfoCircle /> Terms & Conditions</h4>
                      <p>{event.terms_and_conditions}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="packages-tab">
                  {packages.length > 0 ? (
                    <div className="packages-grid">
                      {packages.map((pkg, index) => (
                        <div key={index} className="package-card">
                          <h4>{pkg.name}</h4>
                          <p className="package-type">{pkg.type}</p>
                          <p className="package-details">{pkg.details}</p>
                          <div className="package-footer">
                            <span className="package-price">
                              {pkg.price ? `$${pkg.price.toFixed(2)}` : 'Free'}
                            </span>
                            <button className="select-package">
                              Select Package
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-packages">
                      <p>No packages available for this event.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerViewEvent;
