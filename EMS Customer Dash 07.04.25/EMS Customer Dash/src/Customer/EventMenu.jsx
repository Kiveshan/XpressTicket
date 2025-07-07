import React, { useState, useEffect } from 'react';
import "./EventMenu.css";
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { fixS3ImageUrl, DEFAULT_IMAGE_DATA_URI } from '../utils/imageUtils';

function EventMenu() {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  
  // Sample cities and event types for filters
  const cities = ['Cape Town', 'Johannesburg', 'Stellenbosch', 'Durban', 'Pretoria'];
  const eventTypes = ['Physical event', 'Online event', 'Conference', 'Festival', 'Workshop'];
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
    
    // Apply city filter
    if (selectedCity !== 'all') {
      filtered = filtered.filter(event => 
        event.location?.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }
    
    // Apply date filter if available
    if (dateFilter) {
      filtered = filtered.filter(event => {
        // Simple date comparison - would need to be improved for real implementation
        return event.date?.includes(dateFilter);
      });
    }
    
    setFilteredEvents(filtered);
  }, [events, searchQuery, selectedEventType, selectedCity, dateFilter]);

  useEffect(() => {
    // Fetch approved events from the API
    const fetchEvents = async () => {
      try {
        setLoading(true);
        console.log('Fetching events from API...');
        
        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(`http://localhost:5000/api/events/available?_=${timestamp}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched events:', data);
        setEvents(data);
        setFilteredEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err.message);
        
        // Fallback to sample data if API fails
        const fallbackEvents = [
          {
            id: 999,
            name: 'Fallback Event (API Error)',
            location: 'Error Recovery Mode',
            date: 'Today',
            time: 'Now',
            image: '/default-event-image.png',
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
    <div className="dashboard-container">
      <header className="dashboard-header">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="dashboard-logo"
        />
        <div className="profile-section">
          <button className="backbutton22" onClick={()=> nav('/')}>LogOut </button>
        </div>
      </header>
      
    
      {/* Back Button */}
      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav("/customerdash")}>
          Back
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
              {eventTypes.map((type, index) => (
                <div className="filter-checkbox" key={`type-${index}`}>
                  <input 
                    type="checkbox" 
                    id={`type-${index}`}
                    checked={selectedEventType === type.toLowerCase()}
                    onChange={() => {
                      setSelectedEventType(
                        selectedEventType === type.toLowerCase() ? 'all' : type.toLowerCase()
                      );
                    }}
                  />
                  <label htmlFor={`type-${index}`}>{type} ({Math.floor(Math.random() * 100)})</label>
                </div>
              ))}
              <div className="filter-actions">
                <button onClick={() => setSelectedEventType('all')}>Clear All</button>
              </div>
            </div>

            <div className="filter-group">
              <h4>City</h4>
              {cities.map((city, index) => (
                <div className="filter-checkbox" key={`city-${index}`}>
                  <input 
                    type="checkbox" 
                    id={`city-${index}`}
                    checked={selectedCity === city.toLowerCase()}
                    onChange={() => {
                      setSelectedCity(
                        selectedCity === city.toLowerCase() ? 'all' : city.toLowerCase()
                      );
                    }}
                  />
                  <label htmlFor={`city-${index}`}>{city} ({Math.floor(Math.random() * 100)})</label>
                </div>
              ))}
              <div className="filter-actions">
                <button onClick={() => setSelectedCity('all')}>Clear All</button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area with events */}
        <main className="dashboard-main1">
          <div className="results-header">
            <h2>{filteredEvents.length} results found</h2>
          </div>
          
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
              {/* Map through filtered events to generate event cards */}
              {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="event-card"
                onClick={() => nav(event.link)}
              >
                <div className="event-image-container">
                  <img 
                    src={fixS3ImageUrl(event.image)}
                    alt={event.name} 
                    className="event-image" 
                    onError={(e) => {
                      // Only change source once to prevent infinite loop
                      if (!e.target.src.includes('data:image')) {
                        console.log('Image failed to load:', e.target.src);
                        e.target.onerror = null;
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
