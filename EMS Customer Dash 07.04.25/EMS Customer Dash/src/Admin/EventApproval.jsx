import React, { useState, useEffect } from 'react';
import './EventApproval.css';
import '../shared/ModernDashboard.css';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import CompactEventCard from './CompactEventCard';
import useFixCardHeight from '../hooks/useFixCardHeight';
import { DEFAULT_IMAGE_DATA_URI } from '../utils/imageUtils';
import './EventApproval.override.css';

const EventApproval = () => {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const eventsPerPage = 6;

  useFixCardHeight();

  const loadMoreEvents = () => {
    if (hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  };

  const resetPagination = () => {
    setPage(1);
    setEvents([]);
    setHasMore(true);
  };

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      nav('/login');
      return;
    }

    if (page === 1) {
      setLoading(true);
    }

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
        const pendingEvents = data.filter(event => {
          const status = (event.status || '').toLowerCase();
          return status === 'pending' || status === 'awaiting approval' || status === 'review';
        });

        const displayEvents = pendingEvents.map(event => {
          console.log(`EventApproval - Event ${event.event_id || event.id} (${event.name}) image fields:`, {
            file_url: event.file_url,
            coverimage: event.coverimage,
            file_urlType: typeof event.file_url,
            coverimageType: typeof event.coverimage
          });

          return {
            eventid: event.eventid || event.event_id || event.id,
            event_name: event.event_name || event.name || 'Untitled Event',
            status: 'Pending',
            location: event.location || event.venue || 'N/A',
            date: event.start_date || event.date || 'N/A',
            time: event.start_time || event.time || 'N/A',
            price: event.is_free || event.price === 0 ? 'Free' : (event.price ? `R${event.price}` : 'N/A'),
            file_url: event.file_url || DEFAULT_IMAGE_DATA_URI
          };
        });

        const startIndex = 0;
        const endIndex = displayEvents.length;
        const paginatedEvents = displayEvents.slice(startIndex, endIndex);

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