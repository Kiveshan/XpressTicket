import React, { useState, useEffect } from 'react';
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
          <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="modern-logo" />
          <h1>Event Request Review</h1>
        </div>
        <button className="modern-logout-btn" onClick={() => nav('/login')}>
          Logout
        </button>
      </div>
      
      {/* Back button */}
      <div className="modern-back-button">
        <button className="modern-back-btn" onClick={() => nav('/event-approval')}>
          <FaArrowLeft /> Back to Event Approval
        </button>
      </div>

      {/* Event Header */}
      <div className="modern-card modern-full-width">
        <div className="modern-card-header">
          <h2><MdEventAvailable /> {event.event_name || 'Untitled Event'}</h2>
        </div>
        <div className="modern-card-body">
          <div className="modern-event-header">
            <div className="modern-event-image">
              <img
                src={event.file_url || '/default-profile-picture.jpg'}
                alt="Event"
                onError={(e) => (e.target.src = '/default-profile-picture.jpg')}
              />
            </div>
            <div className="modern-event-details">
              <div className="modern-event-info-grid">
                <div className="modern-event-info-item">
                  <FaMapMarkerAlt className="modern-icon" />
                  <div>
                    <span className="modern-label">Location</span>
                    <span className="modern-value">{event.location || 'Not specified'}</span>
                  </div>
                </div>
                <div className="modern-event-info-item">
                  <FaCalendarAlt className="modern-icon" />
                  <div>
                    <span className="modern-label">Date</span>
                    <span className="modern-value">
                      {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'Not set'}
                      {event.end_date && event.end_date !== event.start_date ? 
                        ` - ${new Date(event.end_date).toLocaleDateString()}` : ''}
                    </span>
                  </div>
                </div>
                <div className="modern-event-info-item">
                  <FaClock className="modern-icon" />
                  <div>
                    <span className="modern-label">Time</span>
                    <span className="modern-value">{event.time || 'Not specified'}</span>
                  </div>
                </div>
                <div className="modern-event-info-item">
                  <FaCalendarAlt className="modern-icon" />
                  <div>
                    <span className="modern-label">Registration Deadline</span>
                    <span className="modern-value">
                      {event.deadline ? new Date(event.deadline).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                </div>
                <div className="modern-event-info-item">
                  <FaInfoCircle className="modern-icon" />
                  <div>
                    <span className="modern-label">Event Type</span>
                    <span className="modern-value">{event.event_type || 'Not specified'}</span>
                  </div>
                </div>
                <div className="modern-event-info-item">
                  <FaUsers className="modern-icon" />
                  <div>
                    <span className="modern-label">Capacity</span>
                    <span className="modern-value">{event.capacity || 'Unlimited'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="modern-profile-container">
        <div className="modern-profile-section">
          {/* Event Description */}
          <div className="modern-card">
            <div className="modern-card-header">
              <h2><FaInfoCircle /> Event Description</h2>
            </div>
            <div className="modern-card-body">
              <p className="modern-description">{event.description || 'No description provided.'}</p>
            </div>
          </div>

          {/* Client Types */}
          <div className="modern-card">
            <div className="modern-card-header">
              <h2><FaUsers /> Attendee Types</h2>
            </div>
            <div className="modern-card-body">
              {event.client_type && event.client_type.length > 0 ? (
                <div className="modern-badge-container">
                  {event.client_type.map((type, index) => (
                    <span key={index} className="modern-badge modern-badge-info">{type}</span>
                  ))}
                </div>
              ) : (
                <p className="modern-no-data">No attendee types specified</p>
              )}
            </div>
          </div>
        </div>

        <div className="modern-profile-section">
          {/* Terms and Conditions */}
          <div className="modern-card">
            <div className="modern-card-header">
              <h2><FaFileAlt /> Terms and Conditions</h2>
            </div>
            <div className="modern-card-body">
              <p className="modern-description">
                {event.terms_and_conditions || 'No terms and conditions provided.'}
              </p>
            </div>
          </div>

          {/* Payment Information */}
          <div className="modern-card">
            <div className="modern-card-header">
              <h2><FaMoneyBillWave /> Payment Information</h2>
            </div>
            <div className="modern-card-body">
              <div className="modern-info-row">
                <div className="modern-info-label">Payment Type</div>
                <div className="modern-info-value">
                  <span className="modern-badge modern-badge-primary">
                    {event.payment_type || 'Not specified'}
                  </span>
                </div>
              </div>
              
              {event.payment_type === 'Sponsor' ? (
                <>
                  <div className="modern-info-row">
                    <div className="modern-info-label">Sponsor Name</div>
                    <div className="modern-info-value">{event.sponsor.name || 'Not provided'}</div>
                  </div>
                  <div className="modern-info-row">
                    <div className="modern-info-label">Sponsor Phone</div>
                    <div className="modern-info-value">{event.sponsor.phone || 'Not provided'}</div>
                  </div>
                  <div className="modern-info-row">
                    <div className="modern-info-label">Sponsor Email</div>
                    <div className="modern-info-value">{event.sponsor.email || 'Not provided'}</div>
                  </div>
                  <div className="modern-info-row">
                    <div className="modern-info-label">Amount</div>
                    <div className="modern-info-value">{event.sponsor.amount || 'Not provided'}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="modern-info-row">
                    <div className="modern-info-label">Amount</div>
                    <div className="modern-info-value">{event.amount || 'N/A'}</div>
                  </div>
                  <div className="modern-info-row">
                    <div className="modern-info-label">Proof of Payment</div>
                    <div className="modern-info-value">
                      <button className="modern-btn modern-btn-sm" onClick={handleViewProofOfPayment}>
                        View Document
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Packages */}
      <div className="modern-card modern-full-width">
        <div className="modern-card-header">
          <h2><FaBox /> Packages</h2>
        </div>
        <div className="modern-card-body">
          {event.packages && event.packages.length > 0 ? (
            <div className="modern-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Package Type</th>
                    <th>Location</th>
                    <th>Duration</th>
                    <th>Date Choices</th>
                    <th>Pricing</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {event.packages.map((pkg, idx) => (
                    <tr key={idx}>
                      <td>{pkg.packageType || 'Not specified'}</td>
                      <td>{pkg.location || 'Not specified'}</td>
                      <td>{pkg.duration || 'Not specified'}</td>
                      <td>{pkg.dateChoices || 'Not specified'}</td>
                      <td>{pkg.pricing || 'N/A'}</td>
                      <td>
                        <div className="modern-truncate-text">
                          {pkg.details || 'No details provided'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="modern-no-data">No packages defined for this event</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="modern-card modern-full-width">
        <div className="modern-card-header">
          <h2><FaFileAlt /> Additional Tabs</h2>
        </div>
        <div className="modern-card-body">
          {event.tabs && event.tabs.length > 0 ? (
            <div className="modern-tabs-container">
              {event.tabs.map((tab, idx) => (
                <div key={idx} className="modern-tab-item">
                  <div className="modern-tab-header">{tab.name || 'Unnamed Tab'}</div>
                  <div className="modern-tab-content">
                    <p>{tab.content || 'No content provided'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="modern-no-data">No additional tabs defined for this event</p>
          )}
        </div>
      </div>

      {/* Admin Comments */}
      <div className="modern-card modern-full-width">
        <div className="modern-card-header">
          <h2><FaCommentAlt /> Admin Comments</h2>
        </div>
        <div className="modern-card-body">
          <textarea
            className="modern-textarea"
            placeholder="Add your comments here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="modern-action-buttons">
        <button
          className="modern-btn modern-btn-success"
          onClick={() => handleStatusUpdate('Approved')}
          disabled={isSubmitting}
        >
          <FaCheck /> Approve Event
        </button>
        <button
          className="modern-btn modern-btn-warning"
          onClick={() => handleStatusUpdate('Request Edit')}
          disabled={isSubmitting}
        >
          <FaPencilAlt /> Request Edit
        </button>
        <button
          className="modern-btn modern-btn-danger"
          onClick={() => handleStatusUpdate('Rejected')}
          disabled={isSubmitting}
        >
          <FaTimes /> Reject Event
        </button>
      </div>
      
      {isSubmitting && (
        <div className="modern-loading-overlay">
          <div className="modern-spinner"></div>
          <p>Processing your request...</p>
        </div>
      )}
    </div>
  );
};

export default AdminViewEventRequest;
