import React, { useState, useEffect } from 'react';
import './EventApproval.css';
import '../shared/ModernDashboard.css';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
// Import our custom card component
import CompactEventHistoryCard from './CompactEventHistoryCard';
// Import a custom hook to fix card heights
import useFixCardHeight from '../hooks/useFixCardHeight';
// Import override CSS last to ensure it takes precedence
import './EventApproval.override.css';

const EventsHistory = () => {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const eventsPerPage = 6; // Limit number of events per page
  
  // Use our custom hook to fix card heights
  useFixCardHeight();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error state on new fetch
        const token = sessionStorage.getItem('token');
        if (!token) {
          console.error('No token found in sessionStorage');
          nav('/login');
          return;
        }

        console.log('Fetching events with token:', token.slice(0, 10) + '...');
        const response = await fetch('http://localhost:5000/api/admin/events', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Fetch failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error || 'No error message provided',
          });
          if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            nav('/login');
            return;
          }
          throw new Error(`Failed to fetch events: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        console.log('Fetched events:', data);

        const eventsWithStatus = data.map((event) => ({
          ...event,
          // Map backend field names to frontend expectations for backward compatibility
          // Ensure we capture event ID consistently across backend variations
          eventid: event.eventid || event.event_id || event.id,
          event_name: event.event_name || event.name || 'Untitled Event',
          status: event.status || 'Pending',
          // Friendly display fields
          date: event.start_date || event.date || null,
          time: event.start_time || event.time || null,
          price: (() => {
            if (event.is_free || event.price === 0) return 'Free';
            if (event.price) return `R${event.price}`;
            return null;
          })(),
          file_url: (() => {
            // Find first non-empty image field
            const candidateImgs = [
              event.file_url,
              event.cover_image_url, // backend snake_case
              event.coverimage, // legacy camelcase without underscore
              event.cover_image, // possible underscore variant
              event.coverImageUrl // camelCase
            ];
            let img = candidateImgs.find((c) => typeof c === 'string' && c.trim());
            // Ignore non-image URLs (pdf, jiff etc.)
            if (img && /\.(pdf|jiff?)$/i.test(img)) {
              img = null;
            }
            // Fallback to a publicly hosted placeholder image so it always resolves
            if (!img)
              return (
                'data:image/svg+xml;utf8,' +
                encodeURIComponent(
                  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="%23cccccc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23666" font-size="20">No Image</text></svg>`
                )
              );
            // Normalize backslashes to forward slashes for browser compatibility
            if (img) {
              img = img.replace(/\\/g, '/');
            }
            // If path is root-relative (starts with '/') or begins with 'uploads/', prefix with API host
            if (/^\//.test(img) || img.startsWith('uploads/')) {
              img = `http://localhost:5000/${img.replace(/^\/+/, '')}`;
            }
            
            // Fix double-encoded S3 URLs
            if (img && img.includes('xpressticket.s3')) {
              // Check if URL is double-encoded (contains the S3 domain twice)
              if (img.includes('xpressticket.s3') && img.includes('https%3A//xpressticket.s3')) {
                try {
                  // Extract the actual URL path after the domain
                  const urlMatch = img.match(/https%3A\/\/xpressticket\.s3\.af-south-1\.amazonaws\.com\/(.+)/);
                  if (urlMatch && urlMatch[1]) {
                    // Reconstruct the URL properly
                    img = `https://xpressticket.s3.af-south-1.amazonaws.com/${urlMatch[1]}`;
                  }
                } catch (err) {
                  console.error('Error fixing double-encoded S3 URL:', err);
                }
              }
              
              // Correct common S3 host typos (missing ".s3.")
              try {
                const url = new URL(img);
                if (url.hostname.endsWith('.af-south-1.amazonaws.com') && !url.hostname.includes('.s3.')) {
                  url.hostname = url.hostname.replace('.af-south-1.amazonaws.com', '.s3.af-south-1.amazonaws.com');
                  img = url.toString();
                }
              } catch (err) {
                // ignore malformed url
              }
            }
            
            return img;
          })(),
        }));

        // Filter to only show events that are NOT pending (approved or rejected)
        const processedEvents = eventsWithStatus.filter(event => 
          event.status.toLowerCase() !== 'pending' && 
          event.status.toLowerCase() !== 'awaiting approval' && 
          event.status.toLowerCase() !== 'review'
        );
        
        setEvents(processedEvents);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 10 * 60 * 1000); // Refresh every 10 minutes

    return () => clearInterval(interval);
  }, [nav]);

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

  return (
    <div className="modern-container">
      <header className="modern-dashboard-header">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="modern-dashboard-logo"
          style={{ maxHeight: '45px', width: 'auto' }}
          onError={(e) => {
            console.error('Failed to load logo');
            e.target.src = '/fallback-logo.png'; // Ensure you have a fallback logo
          }}
        />
        <div className="modern-profile-section">
          <button className="modern-btn modern-logout-btn" onClick={() => nav('/')}>
            Log Out
          </button>
        </div>
      </header>

      <div className="modern-back-button">
        <button className="modern-back-btn" onClick={() => nav('/admin-dash')}>
          <FaArrowLeft /> Back
        </button>
      </div>
      <h2 className="modern-page-title">Events History</h2>

      {error && <div className="modern-error"><p>{error}</p></div>}
      {loading && <div className="modern-loading"><div className="modern-spinner"></div><p>Loading events...</p></div>}

      {!loading && events.length === 0 && !error && (
        <div className="modern-no-data">
          <p>No processed events available.</p>
        </div>
      )}

      <div className="modern-card-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px'}}>
        {events.length > 0 ? (
          events.map((event) => (
            <CompactEventHistoryCard key={event.eventid || event.id || event.event_id} event={event} />
          ))
        ) : !loading && (
          <div className="modern-no-data">
            <p>No events found</p>
          </div>
        )}
      </div>
      
      {hasMore && events.length > 0 && (
        <div className="modern-load-more">
          <button className="modern-btn" onClick={loadMoreEvents}>Load More</button>
        </div>
      )}
    </div>
  );
};

export default EventsHistory;
