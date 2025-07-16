import React, { useState, useEffect, useRef } from 'react';
import './EventApproval.css';
import '../shared/ModernDashboard.css';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
// Import our completely custom card component
import CompactEventCard from './CompactEventCard';
// Import our custom hook to fix card heights
import useFixCardHeight from '../hooks/useFixCardHeight';
// Import override CSS last to ensure it takes precedence
import './EventApproval.override.css';



const EventApproval = () => {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const eventsPerPage = 6; // Limit number of events per page
  
  // Use our custom hook to fix card heights
  useFixCardHeight();

  // Simple function to get image URL or fallback
  const getImageUrl = (event) => {
    // Try to find a valid image URL from various possible fields
    const possibleImageFields = [
      'file_url', 'cover_image_url', 'coverimage', 'cover_image', 'coverImageUrl', 'image_url', 'imageUrl'
    ];
    
    for (const field of possibleImageFields) {
      if (event[field] && typeof event[field] === 'string' && event[field].trim()) {
        return event[field];
      }
    }
    
    // Return fallback image if no valid image found
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+';
  };

  // Load more events
  const loadMoreEvents = () => {
    if (hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  };

  // Reset pagination
  const resetPagination = () => {
    setPage(1);
    setEvents([]);
    setHasMore(true);
  };

  useEffect(() => {
    // Check if token exists
    const token = sessionStorage.getItem('token');
    if (!token) {
      nav('/login');
      return;
    }

    // Set loading state only on first page load
    if (page === 1) {
      setLoading(true);
    }

    // Fetch events from API
    fetch('http://localhost:5000/api/admin/events', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            nav('/login');
            throw new Error('Authentication failed');
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        // Simple filtering for pending events
        const pendingEvents = data.filter(event => {
          const status = (event.status || '').toLowerCase();
          return status === 'pending' || status === 'awaiting approval' || status === 'review';
        });

        // Simple mapping for display
        const displayEvents = pendingEvents.map(event => {
          // Format the date properly without timezone information
          let formattedDate = 'N/A';
          if (event.start_date || event.date) {
            const dateObj = new Date(event.start_date || event.date);
            if (!isNaN(dateObj)) {
              formattedDate = dateObj.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            }
          }

          // Only include price if it's a valid value
          let price = null;
          if (event.is_free || event.price === 0) {
            price = 'Free';
          } else if (event.price) {
            price = `R${event.price}`;
          }

          return {
            eventid: event.eventid || event.event_id || event.id,
            event_name: event.event_name || event.name || 'Untitled Event',
            status: 'Pending',
            location: event.location || event.venue || 'N/A',
            date: formattedDate,
            time: event.start_time || event.time || 'N/A',
            price: price,
            file_url: getImageUrl(event)
          };
        });

        // Apply pagination
        const startIndex = 0;
        const endIndex = displayEvents.length;
        const paginatedEvents = displayEvents.slice(startIndex, endIndex);

        // Update state
        setEvents(paginatedEvents);
        setHasMore(paginatedEvents.length === eventsPerPage);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching events:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [nav, page]);

  return (
    <div className="modern-dashboard-container">
      <header className="modern-header">
        <div className="modern-header-logo">
          <img
            src="/XPRESS TICKETS LOGO2.png"
            alt="EventXpress Logo"
            className="modern-logo"
            onError={(e) => {
              console.error('Failed to load logo');
              e.target.src = '/fallback-logo.png';
            }}
          />
        </div>
        <button className="modern-logout-btn" onClick={() => nav('/')}>
          Log Out
        </button>
      </header>

      <div className="modern-back-button">
        <button className="modern-back-btn" onClick={() => nav('/admin-dash')}>
          <FaArrowLeft /> Back
        </button>
      </div>
      <h2 className="modern-page-title">Events Pending Approval</h2>

      {error && <div className="modern-error"><p>{error}</p></div>}
      {loading && <div className="modern-loading"><div className="modern-spinner"></div><p>Loading events...</p></div>}

      {!loading && events.length === 0 && !error && (
        <div className="modern-no-data">
          <p>No events available for approval at this time.</p>
        </div>
      )}

      <div className="modern-card-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px'}}>
        {events.length > 0 ? (
          events.map((event) => (
            <CompactEventCard key={event.eventid} event={event} />
          ))
        ) : !loading && (
          <div className="modern-no-data">
            <p>No pending events found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventApproval;
