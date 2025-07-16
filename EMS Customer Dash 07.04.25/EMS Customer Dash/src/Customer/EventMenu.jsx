import React, { useState, useEffect } from 'react';
import "./EventMenu.css";
import "../shared/ModernDashboard.css";
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaSignOutAlt, FaArrowLeft } from 'react-icons/fa';
import EventImage from '../utils/EventImage';
import { fixS3ImageUrl, DEFAULT_IMAGE_DATA_URI } from '../utils/imageUtils';

function EventMenu() {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('all');
  // City filter removed as requested
  const [dateFilter, setDateFilter] = useState('');
  
  // Event types for filters
  const eventTypes = ['Conference', 'Workshop', 'Seminar', 'Exhibition', 'Concert', 'Festival', 'Corporate Event', 'Sports Event'];
  const [showCustomDates, setShowCustomDates] = useState(false);

  // Filter events based on search query and filters
  useEffect(() => {
    if (!events.length) return;
    
    let filtered = [...events];
    
    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.name?.toLowerCase().includes(query) || 
        event.location?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply event type filter
    if (selectedEventType !== 'all') {
      filtered = filtered.filter(event => 
        event.event_type?.toLowerCase() === selectedEventType.toLowerCase()
      );
    }
    
    // City filter logic removed as requested
    
    // Apply date filter if available
    if (dateFilter) {
      filtered = filtered.filter(event => {
        // Simple date comparison - would need to be improved for real implementation
        return event.date?.includes(dateFilter);
      });
    }
    
    setFilteredEvents(filtered);
  }, [events, searchQuery, selectedEventType, dateFilter]);

 useEffect(() => {
  const fetchEvents = async () => {
    try {
      setLoading(true);
      console.log('Fetching events from API...');
      const timestamp = new Date().getTime();
      const response = await fetch(`http://localhost:5000/api/events/available?_=${timestamp}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Fetched events:', data);
      const eventsWithImageInfo = data.map(event => {
        console.log(`Event ${event.id} (${event.name}) image fields:`, {
          file_url: event.file_url,
          coverimage: event.coverimage
        });
        return {
          ...event,
          file_url: event.file_url || DEFAULT_IMAGE_DATA_URI
        };
      });
      setEvents(eventsWithImageInfo);
      setFilteredEvents(eventsWithImageInfo);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
      const fallbackEvents = [
        {
          id: 999,
          name: 'Fallback Event (API Error)',
          location: 'Error Recovery Mode',
          date: 'Today',
          time: 'Now',
          file_url: DEFAULT_IMAGE_DATA_URI,
          link: '/customerviewevent/999',
          description: 'This is a fallback event shown because the API request failed.',
          capacity: 100,
          event_type: 'Error'
        }
      ];
      setEvents(fallbackEvents);
      setFilteredEvents(fallbackEvents);
    } finally {
      setLoading(false);
    }
  };
  fetchEvents();
}, []);

  return (
    <div className="modern-dashboard-container">
      {/* Modern Header */}
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
      
      {/* Back Button */}
      <div className="modern-back-button-container">
        <button className="modern-back-btn" onClick={() => nav("/customerdash")}>
          <FaArrowLeft /> Back
        </button>
      </div>

      <div className="event-page-container">
        {/* Left sidebar with filters */}
        <div className="event-sidebar">
          <div className="search-container">
            <div className="search-input-wrapper">
              <input 
                type="text" 
                placeholder="Search" 
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FaSearch className="search-icon" />
            </div>
          </div>

          <div className="filter-section">
            <h3>Upcoming Events</h3>
            
            <div className="filter-group">
              <h4>Dates</h4>
              <div className="date-filter">
                <div className="custom-select">
                  <select 
                    value={dateFilter} 
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setShowCustomDates(true);
                      } else {
                        setDateFilter(e.target.value);
                        setShowCustomDates(false);
                      }
                    }}
                  >
                    <option value="">Filter by Date</option>
                    <option value="2025-07">July 2025</option>
                    <option value="2025-08">August 2025</option>
                    <option value="2025-09">September 2025</option>
                    <option value="custom">Custom Dates</option>
                  </select>
                </div>
                {showCustomDates && (
                  <div className="custom-dates">
                    <input 
                      type="date" 
                      className="date-input"
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="custom-dates-link">
                <button onClick={() => setShowCustomDates(!showCustomDates)}>
                  {showCustomDates ? 'Hide Custom Dates' : 'Select Custom Dates'}
                </button>
              </div>
            </div>

            <div className="filter-group">
              <h4>Type</h4>
              <div className="custom-select">
                <select
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  className="modern-select"
                >
                  <option value="all">All Event Types</option>
                  {eventTypes.map((type, index) => (
                    <option key={`type-${index}`} value={type.toLowerCase()}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* City filter removed as requested */}
          </div>
        </div>

        {/* Main content area with events */}
        <main className="dashboard-main1">
          {/* Results header removed as requested */}
          
          {loading ? (
            <div className="loading-container">
              <p>Loading events...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>Error loading events: {error}</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="no-events-container">
              <p>No events match your search criteria. Please try different filters.</p>
            </div>
          ) : (
          <div className="event-grid">
  {filteredEvents.map((event) => (
    <div
      key={event.id}
      className="event-card"
      onClick={() => nav(event.link)}
    >
      <div className="event-image-container">
        <img
          src={event.file_url}
          alt={event.name}
          className="event-image"
          onError={(e) => {
            if (e.target.src !== DEFAULT_IMAGE_DATA_URI) {
              console.warn(`Failed to load image for event ${event.id}: ${e.target.src}`);
              e.target.src = DEFAULT_IMAGE_DATA_URI;
            }
          }}
        />
      </div>
      <div className="event-details">
        <h3 className='eventname' style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
          {event.name}
        </h3>
        <p className='event-infor'>
          📍 {event.location || 'TBA'} | 📅 {event.date || 'TBA'} | ⏰ {event.time || 'TBA'}
        </p>
      </div>
    </div>
  ))}
</div>
        )}
      </main>
      </div>
    </div>
  );
}

export default EventMenu;
