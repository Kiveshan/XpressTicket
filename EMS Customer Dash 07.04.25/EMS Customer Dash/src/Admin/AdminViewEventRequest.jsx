import React, { useState, useEffect } from 'react';
import '../shared/ModernDashboard.css';
import './AdminViewEventRequest.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaInfoCircle, FaImage, FaBox, FaFileAlt, FaMoneyBillWave, FaCommentAlt, FaCheck, FaPencilAlt, FaTimes } from 'react-icons/fa';
import { MdEventAvailable } from 'react-icons/md';

const AdminViewEventRequest = () => {
  const nav = useNavigate();
  const location = useLocation();
  const { eventid } = location.state || {};

  const [event, setEvent] = useState(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
  if (!eventid) {
    setError('No event ID provided');
    setLoading(false);
    return;
  }

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.error('No token found in sessionStorage');
        nav('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/admin/events/${eventid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          nav('/login');
          return;
        }
        throw new Error(`Failed to fetch event: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('Event data from API:', data);
      setEvent({
        ...data,
        event_name: data.event_name || data.name || 'Untitled Event',
        file_url: (() => {
          let img = data.file_url || data.coverimage;
          if (!img) return '/default-profile-picture.jpg';
          if (!/^https?:\/\//.test(img) && !img.startsWith('data:')) {
            img = `http://localhost:5000/${img.replace(/^\/+/, '')}`;
          }
          return img;
        })(),
        // Use the attendees array from the database if available
        client_type: data.attendees && Array.isArray(data.attendees) ? 
          data.attendees : 
          // Fallback to old format if attendees array is not available
          data.client_type || [],
        // Use the tabs array from the database if available
        tabs: data.tabs && Array.isArray(data.tabs) ? 
          data.tabs.map(tab => {
            // If tab is a string (likely JSON), try to parse it
            if (typeof tab === 'string') {
              try {
                const parsedTab = JSON.parse(tab);
                return { name: parsedTab.name || '', content: parsedTab.content || '' };
              } catch (e) {
                console.error('Error parsing tab:', e);
                return { name: '', content: '' };
              }
            }
            // If tab is already an object
            return { name: tab.name || '', content: tab.content || '' };
          }) : 
          // Fallback to old format if tabs array is not available
          (data.tab_num > 0 ? [{ name: data.tab_name, content: data.tab_content }] : []),
        
        // Use the packages array from the database if available
        packages: data.packages && Array.isArray(data.packages) ? 
          data.packages.map(pkg => {
            // If package is a string (likely JSON), try to parse it
            if (typeof pkg === 'string') {
              try {
                const parsedPkg = JSON.parse(pkg);
                return {
                  selectType: parsedPkg.selectType || '',
                  packageType: parsedPkg.packageType || '',
                  location: parsedPkg.location || '',
                  duration: parsedPkg.duration || '',
                  dateChoices: parsedPkg.dateChoices || '',
                  pricing: parsedPkg.pricing ? parsedPkg.pricing : 'N/A',
                  details: parsedPkg.details || '',
                  typeOptions: [parsedPkg.selectType, 'Day'].filter(Boolean),
                };
              } catch (e) {
                console.error('Error parsing package:', e);
                return {
                  selectType: '',
                  packageType: '',
                  location: '',
                  duration: '',
                  dateChoices: '',
                  pricing: 'N/A',
                  details: '',
                  typeOptions: ['Day'],
                };
              }
            }
            // If package is already an object
            return {
              selectType: pkg.selectType || '',
              packageType: pkg.packageType || '',
              location: pkg.location || '',
              duration: pkg.duration || '',
              dateChoices: pkg.dateChoices || '',
              pricing: pkg.pricing ? pkg.pricing : 'N/A',
              details: pkg.details || '',
              typeOptions: [pkg.selectType, 'Day'].filter(Boolean),
            };
          }) : 
          // Fallback to old format if packages array is not available
          (data.package_num > 0 ? [{
            selectType: data.select_type,
            packageType: data.package_type,
            location: data.loc_ation,
            duration: data.duration,
            dateChoices: data.date_choices,
            pricing: data.pricing ? `R${Number.parseFloat(data.pricing).toFixed(2)}` : 'N/A',
            details: data.package_details,
            typeOptions: [data.select_type, 'Day'].filter(Boolean),
          }] : []),
        sponsor: {
          name: data.sponser_name || '',
          phone: data.cell_num || '',
          email: data.email || '',
          amount: data.amount && data.payment_type === 'Sponsor' ? data.amount : '', // Use pre-formatted amount
        },
        payment_type: data.payment_type || '',
        amount: data.amount || 'N/A', // Use pre-formatted amount directly
        start_date: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '',
        end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : '',
        deadline: data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : '',
      });
      setComment(data.admin_comment || '');
    } catch (err) {
      console.error('Error fetching event:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchEvent();
}, [eventid, nav]);

  const handleStatusUpdate = async (status) => {
    if (!eventid) {
      setError('No event ID provided');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.error('No token found in sessionStorage');
        nav('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/admin/event/${eventid}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, comment }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          nav('/login');
          return;
        }
        throw new Error(`Failed to update status: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('Status updated:', data);
      nav('/event-approval');
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewProofOfPayment = async () => {
    if (!eventid) {
      setError('No event ID provided');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.error('No token found in sessionStorage');
        nav('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/admin/event/${eventid}/proof-of-payment`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch proof of payment: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      window.open(data.url, '_blank');
    } catch (err) {
      console.error('Error fetching proof of payment:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="modern-dashboard-container">
        <div className="modern-loading">
          <div className="modern-spinner"></div>
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-dashboard-container">
        <div className="modern-error">
          <FaInfoCircle size={24} />
          <p>{error}</p>
          <button className="modern-btn" onClick={() => nav('/event-approval')}>
            <FaArrowLeft /> Back to Event Approval
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="modern-dashboard-container">
        <div className="modern-error">
          <FaInfoCircle size={24} />
          <p>No event data available</p>
          <button className="modern-btn" onClick={() => nav('/event-approval')}>
            <FaArrowLeft /> Back to Event Approval
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-dashboard-container">
      {/* Header */}
      <div className="modern-header">
        <div className="modern-header-logo">
          <img 
            src="/XPRESS TICKETS LOGO2.png" 
            alt="EventXpress Logo" 
            className="modern-logo" 
            style={{ maxHeight: '45px', width: 'auto' }}
            onError={(e) => {
              console.error('Failed to load logo');
              e.target.src = '/fallback-logo.png'; // Ensure you have a fallback logo
            }}
          />
          <h1>Event Request Review</h1>
        </div>
        <div className="modern-header-actions">
          <button className="modern-btn modern-btn-outline" onClick={() => nav('/event-approval')}>
            <FaArrowLeft /> Back to Events
          </button>
          <button className="modern-logout-btn" onClick={() => nav('/login')}>
            Logout
          </button>
        </div>
      </div>
      


      {/* Event Header - Compact */}
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ fontSize: '0.95rem', margin: '8px 0', color: '#2d3748' }}>Event Overview</h3>
        <div style={{
          background: '#fff',
          border: '1px solid #edf2f7',
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '6px 10px', 
            background: 'linear-gradient(135deg, #4a5568, #2d3748)', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <MdEventAvailable size={16} />
            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{event.event_name || 'Untitled Event'}</span>
            <span 
              className={`modern-badge modern-badge-${event.status === 'Approved' ? 'success' : event.status === 'Rejected' ? 'danger' : 'warning'}`}
              style={{ 
                marginLeft: 'auto', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                fontSize: '0.7rem',
                padding: '2px 8px' 
              }}
            >
              {event.status === 'Approved' ? <FaCheck size={10} /> : event.status === 'Rejected' ? <FaTimes size={10} /> : <FaPencilAlt size={10} />}
              {event.status || 'Pending'}
            </span>
          </div>
          <div style={{ padding: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ 
                flex: '0 0 80px', 
                height: '80px', 
                borderRadius: '4px', 
                overflow: 'hidden' 
              }}>
                <img
                  src={event.file_url}
                  alt="Event"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    console.warn(`Failed to load image: ${e.target.src}`);
                    e.target.classList.add('image-error');
                  }}
                />
                {!event.file_url && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f0f0f0',
                    color: '#999',
                    fontSize: '0.7rem'
                  }}>
                    <span>No Image</span>
                  </div>
                )}
              </div>
              <div style={{ flex: '1', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                  <FaMapMarkerAlt size={10} style={{ marginTop: '3px', color: '#4a5568' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.7rem', color: '#718096' }}>Location</span>
                    <span style={{ fontSize: '0.8rem' }}>{event.location || 'Not specified'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                  <FaCalendarAlt size={10} style={{ marginTop: '3px', color: '#4a5568' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.7rem', color: '#718096' }}>Date</span>
                    <span style={{ fontSize: '0.8rem' }}>
                      {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'Not set'}
                      {event.end_date && event.end_date !== event.start_date ? 
                        ` - ${new Date(event.end_date).toLocaleDateString()}` : ''}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                  <FaClock size={10} style={{ marginTop: '3px', color: '#4a5568' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.7rem', color: '#718096' }}>Time</span>
                    <span style={{ fontSize: '0.8rem' }}>{event.time || 'Not specified'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                  <FaCalendarAlt size={10} style={{ marginTop: '3px', color: '#4a5568' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.7rem', color: '#718096' }}>Deadline</span>
                    <span style={{ fontSize: '0.8rem' }}>
                      {event.deadline ? new Date(event.deadline).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                  <FaInfoCircle size={10} style={{ marginTop: '3px', color: '#4a5568' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.7rem', color: '#718096' }}>Event Type</span>
                    <span style={{ fontSize: '0.8rem' }}>{event.event_type || 'Not specified'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                  <FaUsers size={10} style={{ marginTop: '3px', color: '#4a5568' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.7rem', color: '#718096' }}>Capacity</span>
                    <span style={{ fontSize: '0.8rem' }}>{event.capacity || 'Unlimited'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details - Compact 3-Column Grid */}
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ fontSize: '0.95rem', margin: '8px 0', color: '#2d3748' }}>Event Details</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '8px',
          width: '100%'
        }}>
          {/* Card 1: Description */}
          <div style={{ 
            background: '#fff', 
            border: '1px solid #edf2f7', 
            borderRadius: '4px', 
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)', 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              padding: '4px 8px', 
              background: '#f9fafb', 
              borderBottom: '1px solid #edf2f7',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <FaInfoCircle size={10} style={{ color: '#4a5568' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#4a5568' }}>Description</span>
            </div>
            <div style={{ padding: '5px 8px' }}>
              <p style={{ fontSize: '0.75rem', margin: '0', maxHeight: '70px', overflowY: 'auto', color: '#4a5568' }}>
                {event.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Card 2: Attendee Types */}
          <div style={{ 
            background: '#fff', 
            border: '1px solid #edf2f7', 
            borderRadius: '4px', 
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)', 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              padding: '4px 8px', 
              background: '#f9fafb', 
              borderBottom: '1px solid #edf2f7',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <FaUsers size={10} style={{ color: '#4a5568' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#4a5568' }}>Attendee Types</span>
            </div>
            <div style={{ padding: '5px 8px' }}>
              {event.client_type && event.client_type.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                  {event.client_type.map((type, index) => (
                    <span key={index} style={{
                      fontSize: '0.65rem',
                      padding: '1px 5px',
                      borderRadius: '10px',
                      background: '#e6f7ff',
                      color: '#0072b1',
                      fontWeight: '500'
                    }}>{type}</span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.75rem', color: '#718096', margin: '0' }}>No attendee types specified</p>
              )}
            </div>
          </div>

          {/* Card 3: Terms */}
          <div style={{ 
            background: '#fff', 
            border: '1px solid #edf2f7', 
            borderRadius: '4px', 
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)', 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              padding: '4px 8px', 
              background: '#f9fafb', 
              borderBottom: '1px solid #edf2f7',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <FaFileAlt size={10} style={{ color: '#4a5568' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#4a5568' }}>Terms</span>
            </div>
            <div style={{ padding: '5px 8px' }}>
              <p style={{ fontSize: '0.75rem', margin: '0', maxHeight: '70px', overflowY: 'auto', color: '#4a5568' }}>
                {event.terms_and_conditions || 'No terms provided.'}
              </p>
            </div>
          </div>

          {/* Card 4: Payment */}
          <div style={{ 
            background: '#fff', 
            border: '1px solid #edf2f7', 
            borderRadius: '4px', 
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)', 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              padding: '4px 8px', 
              background: '#f9fafb', 
              borderBottom: '1px solid #edf2f7',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <FaMoneyBillWave size={10} style={{ color: '#4a5568' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#4a5568' }}>Payment</span>
            </div>
            <div style={{ padding: '5px 8px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ color: '#718096', fontWeight: '500', fontSize: '0.7rem' }}>Type:</span>
                <span style={{ 
                  background: '#e6f7ff', 
                  padding: '1px 5px', 
                  borderRadius: '10px',
                  fontSize: '0.65rem',
                  color: '#0072b1'
                }}>{event.payment_type || 'Not specified'}</span>
              </div>
              
              {event.payment_type === 'Sponsor' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ color: '#718096', fontWeight: '500', fontSize: '0.7rem' }}>Sponsor:</span>
                    <span style={{ fontSize: '0.7rem' }}>{event.sponsor?.name || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ color: '#718096', fontWeight: '500', fontSize: '0.7rem' }}>Amount:</span>
                    <span style={{ fontSize: '0.7rem' }}>{event.sponsor?.amount || 'N/A'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ color: '#718096', fontWeight: '500', fontSize: '0.7rem' }}>Amount:</span>
                    <span style={{ fontSize: '0.7rem' }}>{event.amount || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#718096', fontWeight: '500', fontSize: '0.7rem' }}>Proof:</span>
                    <button 
                      onClick={handleViewProofOfPayment}
                      style={{ 
                        color: '#4299e1', 
                        background: 'none', 
                        border: 'none',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: '0',
                        fontSize: '0.7rem'
                      }}
                    >
                      View proof
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Packages - Compact */}
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ fontSize: '0.95rem', margin: '8px 0', color: '#2d3748' }}>Packages</h3>
        <div style={{
          background: '#fff',
          border: '1px solid #edf2f7',
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          padding: '8px',
          fontSize: '0.8rem'
        }}>
          {event.packages && event.packages.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '0.75rem'
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                    <th style={{ padding: '6px', textAlign: 'left', fontWeight: '600' }}>Package</th>
                    <th style={{ padding: '6px', textAlign: 'left', fontWeight: '600' }}>Location</th>
                    <th style={{ padding: '6px', textAlign: 'left', fontWeight: '600' }}>Duration</th>
                    <th style={{ padding: '6px', textAlign: 'left', fontWeight: '600' }}>Dates</th>
                    <th style={{ padding: '6px', textAlign: 'left', fontWeight: '600' }}>Price</th>
                    <th style={{ padding: '6px', textAlign: 'left', fontWeight: '600' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {event.packages.map((pkg, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f7fafc' }}>
                      <td style={{ padding: '4px 6px' }}>{pkg.packageType || 'N/A'}</td>
                      <td style={{ padding: '4px 6px' }}>{pkg.location || 'N/A'}</td>
                      <td style={{ padding: '4px 6px' }}>{pkg.duration || 'N/A'}</td>
                      <td style={{ padding: '4px 6px' }}>{pkg.dateChoices || 'N/A'}</td>
                      <td style={{ padding: '4px 6px' }}>{pkg.pricing || 'N/A'}</td>
                      <td style={{ padding: '4px 6px', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {pkg.details || 'No details'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ margin: '4px 0', color: '#718096' }}>No packages defined for this event</p>
          )}
        </div>
      </div>

      {/* Tabs - Compact */}
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ fontSize: '0.95rem', margin: '8px 0', color: '#2d3748' }}>Additional Info</h3>
        <div style={{
          background: '#fff',
          border: '1px solid #edf2f7',
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          padding: '8px',
          fontSize: '0.8rem'
        }}>
          {event.tabs && event.tabs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {event.tabs.map((tab, idx) => (
                <div key={idx} style={{ border: '1px solid #f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    padding: '4px 8px', 
                    backgroundColor: '#f8f9fa', 
                    borderBottom: '1px solid #f0f0f0',
                    fontWeight: '500',
                    fontSize: '0.75rem'
                  }}>{tab.name || 'Unnamed Tab'}</div>
                  <div style={{ 
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    maxHeight: '60px',
                    overflowY: 'auto'
                  }}>
                    {tab.content || 'No content provided for this tab.'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: '4px 0', color: '#718096' }}>No additional tabs for this event</p>
          )}
        </div>
      </div>

      {/* Admin Comments - Compact */}
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ fontSize: '0.95rem', margin: '8px 0', color: '#2d3748' }}>Admin Comments</h3>
        <div style={{
          background: '#fff',
          border: '1px solid #edf2f7',
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          padding: '8px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '6px 10px', 
            background: 'linear-gradient(135deg, #2c3e50, #4ca1af)', 
            color: 'white',
            marginBottom: '8px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <FaCommentAlt size={12} /> Add feedback or instructions
          </div>
          <textarea
            style={{
              width: '100%',
              minHeight: '60px',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
              fontSize: '0.75rem',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            placeholder="Add your comments here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </div>
      </div>

      {/* Action Center - Compact */}
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ fontSize: '0.95rem', margin: '8px 0', color: '#2d3748' }}>Action Center</h3>
        <div style={{
          background: '#fff',
          border: '1px solid #edf2f7',
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          padding: '8px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '6px 10px', 
            background: 'linear-gradient(to right, #4a5568, #2d3748)', 
            color: 'white',
            marginBottom: '8px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <FaInfoCircle size={12} /> Select Action
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '4px' }}>
            <button
              style={{ 
                padding: '6px 12px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                borderRadius: '4px',
                background: 'linear-gradient(135deg, #68d391, #38b2ac)',
                border: 'none',
                color: 'white',
                fontWeight: '500',
                fontSize: '0.75rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer'
              }}
              onClick={() => handleStatusUpdate('Approved')}
              disabled={isSubmitting}
            >
              <FaCheck size={12} /> Approve
            </button>
            <button
              style={{ 
                padding: '6px 12px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                borderRadius: '4px',
                background: 'linear-gradient(135deg, #faf089, #f6ad55)',
                border: 'none',
                color: '#744210',
                fontWeight: '500',
                fontSize: '0.75rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer'
              }}
              onClick={() => handleStatusUpdate('Request Edit')}
              disabled={isSubmitting}
            >
              <FaPencilAlt size={12} /> Request Edit
            </button>
            <button
              style={{ 
                padding: '6px 12px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                borderRadius: '4px',
                background: 'linear-gradient(135deg, #fc8181, #e53e3e)',
                border: 'none',
                color: 'white',
                fontWeight: '500',
                fontSize: '0.75rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer'
              }}
              onClick={() => handleStatusUpdate('Rejected')}
              disabled={isSubmitting}
            >
              <FaTimes size={12} /> Reject
            </button>
          </div>
        </div>
      </div>
      
      {isSubmitting && (
        <div className="modern-loading-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(45, 55, 72, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            borderTopColor: '#4ca1af',
            animation: 'spin 1s ease-in-out infinite'
          }}></div>
          <p style={{
            color: 'white',
            fontWeight: '500',
            marginTop: '12px',
            fontSize: '1rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>Processing your request...</p>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default AdminViewEventRequest;
