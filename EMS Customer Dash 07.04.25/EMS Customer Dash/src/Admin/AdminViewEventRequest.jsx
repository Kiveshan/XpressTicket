import React, { useState, useEffect } from 'react';
import './AdminViewEventRequest.css';
import { useNavigate, useLocation } from 'react-router-dom';

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
          event_name: data.event_name || 'Untitled Event',
          event_details: data.event_details || data.description || '',
          file_url: data.coverimage || data.file_url || '/default-profile-picture.jpg',
          client_type: data.client_type || [],
          time: data.time || '',
          tabs: data.tabs || [],
          packages: data.packages || [],
          sponsor: {
            name: data.sponser_name || data.organizer?.name || '',
            phone: data.cell_num || data.organizer?.phone || '',
            email: data.email || data.organizer?.email || '',
            amount: data.payment_type === 'Sponsor' && data.amount ? data.amount : '',
          },
          payment_type: data.payment_type || '',
          amount: data.amount || 'N/A',
          start_date: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '',
          end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : '',
          deadline: data.registration_deadline_date ? new Date(data.registration_deadline_date).toISOString().split('T')[0] : '',
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
    return <p>Loading event...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!event) {
    return <p>No event data available</p>;
  }

  console.log('Processed event state:', event);

  return (
    <div className="event-form">
      <button className="back-button" onClick={() => nav('/event-approval')}>Back</button>

      <div className="grid-two">
        <div className="event-info">
          <div className="form-grid">
            <div>
              <label>Event Name</label>
              <input type="text" value={event.event_name || ''} readOnly />
            </div>
            <div>
              <label>Location</label>
              <input type="text" value={event.location || ''} readOnly />
            </div>
            <div>
              <label>Starting Date</label>
              <input type="date" value={event.start_date || ''} readOnly />
            </div>
            <div>
              <label>Ending Date</label>
              <input type="date" value={event.end_date || ''} readOnly />
            </div>
            <div>
              <label>Time</label>
              <input type="text" value={event.time || ''} readOnly />
            </div>
            <div>
              <label>Deadline</label>
              <input type="date" value={event.deadline || ''} readOnly />
            </div>
            <div>
              <label>Event Type</label>
              <input type="text" value={event.event_type || ''} readOnly />
            </div>
            <div>
              <label>Max Capacity</label>
              <input type="number" value={event.capacity || ''} readOnly />
            </div>
          </div>

          <label>Event Details</label>
          <textarea value={event.event_details || ''} readOnly></textarea>
        </div>

        <div className="upload-section">
          <h4>Image</h4>
          <div className="upload-box">
            <img
              className="image"
              src={event.file_url || '/default-profile-picture.jpg'}
              alt="Event"
              onError={(e) => (e.target.src = '/default-profile-picture.jpg')}
            />
          </div>

          <div className="client-types">
            <label>Client Types Available</label>
            {event.client_type.length > 0 ? (
              event.client_type.map((type, index) => (
                <div key={index} className="client-type-item">
                  <label>{type}</label>
                </div>
              ))
            ) : (
              <p>No client types available</p>
            )}
          </div>
        </div>
      </div>

      <h4>Packages</h4>
      {event.packages.length > 0 ? (
        event.packages.map((pkg, idx) => (
          <div key={idx} className="form-item">
            <div className="form-grid">
              <div>
                <label>Package Type</label>
                <input type="text" value={pkg.package_type || ''} readOnly />
              </div>
              <div>
                <label>Location</label>
                <input type="text" value={pkg.location || ''} readOnly />
              </div>
              <div>
                <label>Duration</label>
                <input type="text" value={pkg.duration || ''} readOnly />
              </div>
              <div>
                <label>Date Choices</label>
                <input type="text" value={pkg.date_choices || ''} readOnly />
              </div>
              <div>
                <label>Pricing</label>
                <input type="text" value={pkg.pricing ? `R${Number.parseFloat(pkg.pricing).toFixed(2)}` : 'N/A'} readOnly />
              </div>
            </div>
            <label>Package Details</label>
            <textarea value={pkg.details || ''} readOnly></textarea>
          </div>
        ))
      ) : (
        <p>No packages available</p>
      )}

      <h4>Tabs</h4>
      {event.tabs.length > 0 ? (
        event.tabs.map((tab, idx) => (
          <div key={idx} className="form-item">
            <div className="form-grid">
              <div>
                <label>Name of Tab</label>
                <input type="text" value={tab.name || ''} readOnly />
              </div>
            </div>
            <label>Tab Content</label>
            <textarea value={tab.content || ''} readOnly></textarea>
          </div>
        ))
      ) : (
        <p>No tabs available</p>
      )}

      <div className="form-row">
        <label>Insert Terms and Conditions Here</label>
        <textarea value={event.terms_and_conditions || ''} readOnly></textarea>
      </div>

      <div className="form-grid">
        <div>
          <label>Payment</label>
          <select value={event.payment_type} disabled>
            <option value="">Select</option>
            <option value="Direct">Direct</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Credit">Credit</option>
            <option value="Sponsor">Sponsor</option>
          </select>
        </div>

        <table className="payment-table">
          <thead>
            <tr>
              {event.payment_type === 'Sponsor' ? (
                <>
                  <th>Sponsor Name</th>
                  <th>Cellphone Number</th>
                  <th>Email</th>
                  <th>Amount</th>
                </>
              ) : (
                <>
                  <th>Amount</th>
                  <th>Proof of Payment</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            <tr>
              {event.payment_type === 'Sponsor' ? (
                <>
                  <td><input type="text" value={event.sponsor.name} readOnly /></td>
                  <td><input type="text" value={event.sponsor.phone} readOnly /></td>
                  <td><input type="text" value={event.sponsor.email} readOnly /></td>
                  <td><input type="text" value={event.sponsor.amount} readOnly /></td>
                </>
              ) : (
                <>
                  <td className="cell1"><input type="text" value={event.amount || 'N/A'} readOnly /></td>
                  <td className="upload-cell">
                    <button onClick={handleViewProofOfPayment}>View Proof of Payment</button>
                  </td>
                </>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="form-row" style={{ marginTop: '-1rem', width: '800px' }}>
        <label>Comments</label>
        <textarea
          placeholder="Comments here"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        ></textarea>
      </div>

      <div className="action-buttons" style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          className="approve-btn"
          onClick={() => handleStatusUpdate('Approved')}
          disabled={isSubmitting}
        >
          ✅ Approve
        </button>
        <button
          className="edit-request-btn"
          onClick={() => handleStatusUpdate('Request Edit')}
          disabled={isSubmitting}
        >
          ✏️ Request Edit
        </button>
        <button
          className="reject-btn"
          onClick={() => handleStatusUpdate('Rejected')}
          disabled={isSubmitting}
        >
          ❌ Reject
        </button>
      </div>
    </div>
  );
};

export default AdminViewEventRequest;