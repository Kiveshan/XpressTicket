import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaInfoCircle, FaBox, FaFileAlt, FaMoneyBillWave, FaCommentAlt, FaCheck, FaPencilAlt, FaTimes } from 'react-icons/fa';
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
          client_type: data.attendees && Array.isArray(data.attendees) ? 
            data.attendees : 
            data.client_type || [],
          tabs: data.tabs && Array.isArray(data.tabs) ? 
            data.tabs.map(tab => {
              if (typeof tab === 'string') {
                try {
                  const parsedTab = JSON.parse(tab);
                  return { name: parsedTab.name || '', content: parsedTab.content || '' };
                } catch (e) {
                  console.error('Error parsing tab:', e);
                  return { name: '', content: '' };
                }
              }
              return { name: tab.name || '', content: tab.content || '' };
            }) : 
            (data.tab_num > 0 ? [{ name: data.tab_name, content: data.tab_content }] : []),
          packages: data.packages && Array.isArray(data.packages) ? 
            data.packages.map(pkg => {
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
            amount: data.amount && data.payment_type === 'Sponsor' ? data.amount : '',
          },
          payment_type: data.payment_type || '',
          amount: data.amount || 'N/A',
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
        <div className="modern-loading" style={{ padding: '15px', textAlign: 'center' }}>
          <div className="modern-spinner"></div>
          <p style={{ fontSize: '13px', margin: '5px 0' }}>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-dashboard-container">
        <div className="modern-error" style={{ padding: '15px', textAlign: 'center' }}>
          <FaInfoCircle size={20} />
          <p style={{ fontSize: '13px', margin: '5px 0' }}>{error}</p>
          <button className="modern-btn" onClick={() => nav('/event-approval')} style={{ padding: '6px 12px', fontSize: '12px', marginTop: '5px' }}>
            <FaArrowLeft /> Back to Event Approval
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="modern-dashboard-container">
        <div className="modern-error" style={{ padding: '15px', textAlign: 'center' }}>
          <FaInfoCircle size={20} />
          <p style={{ fontSize: '13px', margin: '5px 0' }}>No event data available</p>
          <button className="modern-btn" onClick={() => nav('/event-approval')} style={{ padding: '6px 12px', fontSize: '12px', marginTop: '5px' }}>
            <FaArrowLeft /> Back to Event Approval
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-dashboard-container">
      {/* Header */}
      <div className="modern-header" style={{ padding: '8px 15px' }}>
        <div className="modern-header-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="modern-logo" style={{ height: '40px' }} />
          <h1 style={{ fontSize: '20px', margin: 0 }}>Event Request Review</h1>
        </div>
        <button className="modern-logout-btn" onClick={() => nav('/login')} style={{ padding: '5px 10px', fontSize: '12px' }}>
          Logout
        </button>
      </div>
      
      {/* Back button */}
      <div className="modern-back-button" style={{ margin: '5px 15px' }}>
        <button className="modern-back-btn" onClick={() => nav('/event-approval')} style={{ padding: '5px 10px', fontSize: '12px' }}>
          <FaArrowLeft /> Back to Event Approval
        </button>
      </div>

      {/* Event Header */}
      <div className="modern-card modern-full-width" style={{ margin: '5px 15px' }}>
        <div className="modern-card-header" style={{ padding: '6px 10px' }}>
          <h2 style={{ fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MdEventAvailable /> {event.event_name || 'Untitled Event'}
          </h2>
        </div>
        <div className="modern-card-body" style={{ padding: '6px' }}>
          <div className="modern-event-header" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div className="modern-event-image" style={{ width: '150px', height: '90px', flexShrink: 0 }}>
              <img
                src={event.file_url || '/default-profile-picture.jpg'}
                alt="Event"
                onError={(e) => (e.target.src = '/default-profile-picture.jpg')}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
              />
            </div>
            <div className="modern-event-details" style={{ flex: 1, minWidth: '180px' }}>
              <div className="modern-event-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '5px' }}>
                <div className="modern-event-info-item" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <FaMapMarkerAlt className="modern-icon" style={{ fontSize: '12px' }} />
                  <div>
                    <span className="modern-label" style={{ fontSize: '11px', fontWeight: 500, color: '#6c757d' }}>Location</span>
                    <span className="modern-value" style={{ fontSize: '12px' }}>{event.location || 'Not specified'}</span>
                  </div>
                </div>
                <div className="modern-event-info-item" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <FaCalendarAlt className="modern-icon" style={{ fontSize: '12px' }} />
                  <div>
                    <span className="modern-label" style={{ fontSize: '11px', fontWeight: 500, color: '#6c757d' }}>Date</span>
                    <span className="modern-value" style={{ fontSize: '12px' }}>
                      {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'Not set'}
                      {event.end_date && event.end_date !== event.start_date ? 
                        ` - ${new Date(event.end_date).toLocaleDateString()}` : ''}
                    </span>
                  </div>
                </div>
                <div className="modern-event-info-item" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <FaClock className="modern-icon" style={{ fontSize: '12px' }} />
                  <div>
                    <span className="modern-label" style={{ fontSize: '11px', fontWeight: 500, color: '#6c757d' }}>Time</span>
                    <span className="modern-value" style={{ fontSize: '12px' }}>{event.time || 'Not specified'}</span>
                  </div>
                </div>
                <div className="modern-event-info-item" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <FaCalendarAlt className="modern-icon" style={{ fontSize: '12px' }} />
                  <div>
                    <span className="modern-label" style={{ fontSize: '11px', fontWeight: 500, color: '#6c757d' }}>Registration Deadline</span>
                    <span className="modern-value" style={{ fontSize: '12px' }}>
                      {event.deadline ? new Date(event.deadline).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                </div>
                <div className="modern-event-info-item" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <FaInfoCircle className="modern-icon" style={{ fontSize: '12px' }} />
                  <div>
                    <span className="modern-label" style={{ fontSize: '11px', fontWeight: 500, color: '#6c757d' }}>Event Type</span>
                    <span className="modern-value" style={{ fontSize: '12px' }}>{event.event_type || 'Not specified'}</span>
                  </div>
                </div>
                <div className="modern-event-info-item" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <FaUsers className="modern-icon" style={{ fontSize: '12px' }} />
                  <div>
                    <span className="modern-label" style={{ fontSize: '11px', fontWeight: 500, color: '#6c757d' }}>Capacity</span>
                    <span className="modern-value" style={{ fontSize: '12px' }}>{event.capacity || 'Unlimited'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="modern-profile-container" style={{ gap: '8px', marginTop: '5px' }}>
        <div className="modern-profile-section" style={{ gap: '8px', flex: 1, minWidth: '200px' }}>
          {/* Event Description */}
          <div className="modern-card" style={{ margin: '0 15px' }}>
            <div className="modern-card-header" style={{ padding: '5px 8px' }}>
              <h2 style={{ fontSize: '12px', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaInfoCircle /> Event Description
              </h2>
            </div>
            <div className="modern-card-body" style={{ padding: '5px' }}>
              <p className="modern-description" style={{ fontSize: '12px', margin: 0, lineHeight: '1.3' }}>
                {event.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Client Types */}
          <div className="modern-card" style={{ margin: '0 15px' }}>
            <div className="modern-card-header" style={{ padding: '5px 8px' }}>
              <h2 style={{ fontSize: '12px', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaUsers /> Attendee Types
              </h2>
            </div>
            <div className="modern-card-body" style={{ padding: '5px' }}>
              {event.client_type && event.client_type.length > 0 ? (
                <div className="modern-badge-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {event.client_type.map((type, index) => (
                    <span key={index} className="modern-badge modern-badge-info" style={{ padding: '3px 6px', fontSize: '11px' }}>{type}</span>
                  ))}
                </div>
              ) : (
                <p className="modern-no-data" style={{ fontSize: '12px', margin: 0, padding: '5px', textAlign: 'center' }}>No attendee types specified</p>
              )}
            </div>
          </div>
        </div>

        <div className="modern-profile-section" style={{ gap: '8px', flex: 1, minWidth: '200px' }}>
          {/* Terms and Conditions */}
          <div className="modern-card" style={{ margin: '0 15px' }}>
            <div className="modern-card-header" style={{ padding: '5px 8px' }}>
              <h2 style={{ fontSize: '12px', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaFileAlt /> Terms and Conditions
              </h2>
            </div>
            <div className="modern-card-body" style={{ padding: '5px' }}>
              <p className="modern-description" style={{ fontSize: '12px', margin: 0, lineHeight: '1.3' }}>
                {event.terms_and_conditions || 'No terms and conditions provided.'}
              </p>
            </div>
          </div>

          {/* Payment Information */}
          <div className="modern-card" style={{ margin: '0 15px' }}>
            <div className="modern-card-header" style={{ padding: '5px 8px' }}>
              <h2 style={{ fontSize: '12px', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaMoneyBillWave /> Payment Information
              </h2>
            </div>
            <div className="modern-card-body" style={{ padding: '5px' }}>
              <div className="modern-info-row" style={{ marginBottom: '5px', paddingBottom: '5px', borderBottom: '1px solid #e9ecef', display: 'flex' }}>
                <div className="modern-info-label" style={{ minWidth: '80px', fontSize: '11px', fontWeight: 500, color: '#6c757d' }}>Payment Type</div>
                <div className="modern-info-value" style={{ fontSize: '12px' }}>
                  <span className="modern-badge modern-badge-primary" style={{ padding: '3px 6px', fontSize: '11px' }}>
                    {event.payment_type || 'Not specified'}
                  </span>
                </div>
              </div>
              {event.payment_type === 'Sponsor' ? (
                <>
                  <div className="modern-info-row" style={{ marginBottom: '5px', paddingBottom: '5px', borderBottom: '1px solid #e9ecef', display: 'flex' }}>
                    <div className="modern-info-label" style={{ minWidth: '80px', fontSize: '11px', fontWeight: 500, color: '#6c757d' }}>Sponsor Name</div>
                    <div className="modern-info-value" style={{ fontSize: '12px' }}>{event.sponsor.name || 'Not provided'}</div>
                  </div>
                  <div className="modern-info-row" style={{ marginBottom: '5px', paddingBottom: '5px', borderBottom: '1px solid #e9ecef', display: 'flex' }}>
                    <div className="modern-info-label" style={{ minWidth: '80px', fontSize: '11px', fontWeight: 500, color: '#6c757d' }}>Sponsor Phone</div>
                    <div className="modern-info-value" style={{ fontSize: '12px' }}>{event.sponsor.phone || 'Not provided'}</div>
                  </div>
                  <div className="modern-info-row" style={{ marginBottom: '5px', paddingBottom: '5px', borderBottom: '1px solid #e9ecef', display: 'flex' }}>
                    <div className="modern-info-label" style={{ minWidth: '80px', fontSize: '11px', fontWeight: 500, color: '#6c757d' }}>Sponsor Email</div>
                    <div className="modern-info-value" style={{ fontSize: '12px' }}>{event.sponsor.email || 'Not provided'}</div>
                  </div>
                  <div className="modern-info-row" style={{ marginBottom: '0', paddingBottom: '0', borderBottom: 'none', display: 'flex' }}>
                    <div className="modern-info-label" style={{ minWidth: '80px', fontSize: '11px', fontWeight: 500, color: '#6c757d' }}>Amount</div>
                    <div className="modern-info-value" style={{ fontSize: '12px' }}>{event.sponsor.amount || 'Not provided'}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="modern-info-row" style={{ marginBottom: '5px', paddingBottom: '5px', borderBottom: '1px solid #e9ecef', display: 'flex' }}>
                    <div className="modern-info-label" style={{ minWidth: '80px', fontSize: '11px', fontWeight: 500, color: '#6c757d' }}>Amount</div>
                    <div className="modern-info-value" style={{ fontSize: '12px' }}>{event.amount || 'N/A'}</div>
                  </div>
                  <div className="modern-info-row" style={{ marginBottom: '0', paddingBottom: '0', borderBottom: 'none', display: 'flex' }}>
                    <div className="modern-info-label" style={{ minWidth: '80px', fontSize: '11px', fontWeight: 500, color: '#6c757d' }}>Proof of Payment</div>
                    <div className="modern-info-value">
                      <button className="modern-btn modern-btn-sm" onClick={handleViewProofOfPayment} style={{ padding: '3px 6px', fontSize: '11px' }}>
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
      <div className="modern-card modern-full-width" style={{ margin: '5px 15px' }}>
        <div className="modern-card-header" style={{ padding: '5px 8px' }}>
          <h2 style={{ fontSize: '12px', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FaBox /> Packages
          </h2>
        </div>
        <div className="modern-card-body" style={{ padding: '5px' }}>
          {event.packages && event.packages.length > 0 ? (
            <div className="modern-table-container" style={{ marginTop: '5px' }}>
              <table className="modern-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '5px 8px', fontSize: '10px' }}>Package Type</th>
                    <th style={{ padding: '5px 8px', fontSize: '10px' }}>Location</th>
                    <th style={{ padding: '5px 8px', fontSize: '10px' }}>Duration</th>
                    <th style={{ padding: '5px 8px', fontSize: '10px' }}>Date Choices</th>
                    <th style={{ padding: '5px 8px', fontSize: '10px' }}>Pricing</th>
                    <th style={{ padding: '5px 8px', fontSize: '10px' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {event.packages.map((pkg, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '5px 8px' }}>{pkg.packageType || 'Not specified'}</td>
                      <td style={{ padding: '5px 8px' }}>{pkg.location || 'Not specified'}</td>
                      <td style={{ padding: '5px 8px' }}>{pkg.duration || 'Not specified'}</td>
                      <td style={{ padding: '5px 8px' }}>{pkg.dateChoices || 'Not specified'}</td>
                      <td style={{ padding: '5px 8px' }}>{pkg.pricing || 'N/A'}</td>
                      <td style={{ padding: '5px 8px' }}>
                        <div className="modern-truncate-text" style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pkg.details || 'No details provided'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="modern-no-data" style={{ fontSize: '12px', margin: 0, padding: '5px', textAlign: 'center' }}>No packages defined for this event</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="modern-card modern-full-width" style={{ margin: '5px 15px' }}>
        <div className="modern-card-header" style={{ padding: '5px 8px' }}>
          <h2 style={{ fontSize: '12px', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FaFileAlt /> Additional Tabs
          </h2>
        </div>
        <div className="modern-card-body" style={{ padding: '5px' }}>
          {event.tabs && event.tabs.length > 0 ? (
            <div className="modern-tabs-container" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {event.tabs.map((tab, idx) => (
                <div key={idx} className="modern-tab-item" style={{ padding: '5px', border: '1px solid #e9ecef', borderRadius: '4px' }}>
                  <div className="modern-tab-header" style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>{tab.name || 'Unnamed Tab'}</div>
                  <div className="modern-tab-content" style={{ fontSize: '12px', lineHeight: '1.3' }}>
                    <p style={{ margin: 0 }}>{tab.content || 'No content provided'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="modern-no-data" style={{ fontSize: '12px', margin: 0, padding: '5px', textAlign: 'center' }}>No additional tabs defined for this event</p>
          )}
        </div>
      </div>

      {/* Admin Comments */}
      <div className="modern-card modern-full-width" style={{ margin: '5px 15px' }}>
        <div className="modern-card-header" style={{ padding: '5px 8px' }}>
          <h2 style={{ fontSize: '12px', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FaCommentAlt /> Admin Comments
          </h2>
        </div>
        <div className="modern-card-body" style={{ padding: '5px' }}>
          <textarea
            className="modern-textarea"
            placeholder="Add your comments here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ width: '100%', minHeight: '60px', padding: '5px', fontSize: '12px', borderRadius: '4px', border: '1px solid #dee2e6' }}
          ></textarea>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="modern-action-buttons" style={{ display: 'flex', gap: '8px', margin: '5px 15px', flexWrap: 'wrap' }}>
        <button
          className="modern-btn modern-btn-success"
          onClick={() => handleStatusUpdate('Approved')}
          disabled={isSubmitting}
          style={{ padding: '5px 10px', fontSize: '12px' }}
        >
          <FaCheck /> Approve Event
        </button>
        <button
          className="modern-btn modern-btn-warning"
          onClick={() => handleStatusUpdate('Request Edit')}
          disabled={isSubmitting}
          style={{ padding: '5px 10px', fontSize: '12px' }}
        >
          <FaPencilAlt /> Request Edit
        </button>
        <button
          className="modern-btn modern-btn-danger"
          onClick={() => handleStatusUpdate('Rejected')}
          disabled={isSubmitting}
          style={{ padding: '5px 10px', fontSize: '12px' }}
        >
          <FaTimes /> Reject Event
        </button>
      </div>
      
      {isSubmitting && (
        <div className="modern-loading-overlay" style={{ padding: '15px', textAlign: 'center' }}>
          <div className="modern-spinner"></div>
          <p style={{ fontSize: '13px', margin: '5px 0' }}>Processing your request...</p>
        </div>
      )}
    </div>
  );
};

export default AdminViewEventRequest;