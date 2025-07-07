import React, { useState, useEffect } from 'react';
import '../Organiser/EventRequest.css';
import { useNavigate } from 'react-router-dom';

const EventApproval = () => {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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

        // Filter to only show events with pending status
        const pendingEvents = eventsWithStatus.filter(event => 
          event.status.toLowerCase() === 'pending' || 
          event.status.toLowerCase() === 'awaiting approval' || 
          event.status.toLowerCase() === 'review'
        );
        
        setEvents(pendingEvents);
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

  return (
    <div className="container12">
      <header className="dashboard-header1">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="dashboard-logo1"
          onError={(e) => {
            console.error('Failed to load logo');
            e.target.src = '/fallback-logo.png'; // Ensure you have a fallback logo
          }}
        />
        <div className="profile-section">
          <button className="backbutton22" onClick={() => nav('/')}>
            Log Out
          </button>
        </div>
      </header>

      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav('/admin-dash')}>
          Back
        </button>
      </div>
      <h2 className="title">Events Pending Approval</h2>

      {error && <p className="error">{error}</p>}
      {loading && <p className="loading">Loading events...</p>}

      {!loading && events.length === 0 && !error && (
        <p className="no-events">No events available for approval.</p>
      )}

      <div className="card-grid">
        {events.map((event) => (
                                  <div key={event.id || event.eventid} className="card">
            <div className="card-image-container">
              <img
                src={event.file_url}
                alt={event.event_name}
                className="card-image"
                // Removed lazy loading to prevent flickering
                onError={(e) => {
                  console.error(`Failed to load image for event ${event.eventid}: ${event.file_url}`);
                  e.target.onerror = null; // prevent infinite loop
                  // Use a consistent data URI for the default image
                  e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+";
                }}
              />
            </div>
            <h3 className="card-title">{event.event_name || 'Untitled Event'}</h3>
            <div className="card-details">
              <p>
                📍 {event.location || event.venue || 'N/A'}
                {' '}📅 {event.date || 'N/A'}
                {' '}⏰ {event.time || 'N/A'}
                {' '}💰 {event.price || 'N/A'}
              </p>
            </div>
            <div className="card-footer">
              <span className={`status ${event.status.replace(' ', '-').toLowerCase()}`}>
                Status: {event.status}
              </span>
              <button
                className="view-btn"
                                                                onClick={() => nav('/adminvieweventrequest', { state: { eventid: event.id || event.eventid || event.event_id } })}
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventApproval;
