import React, { useState, useEffect } from 'react';
import '../Admin/AdminViewEventRequest.css';
import { useNavigate, useLocation } from 'react-router-dom';

const ViewEventRequest = () => {
  const nav = useNavigate();
  const location = useLocation();
  const eventid = location.state?.eventid;

  const [eventData, setEventData] = useState({
    event_name: '',
    location: '',
    start_date: '',
    end_date: '',
    time: '',
    deadline: '',
    event_type: '',
    capacity: '',
    event_details: '',
    terms_and_conditions: '',
    file_url: '/default-profile-picture.jpg',
    proof_of_payment_url: '',
    payment_type: '',
    amount: '',
    admin_comment: '',
  });
  const [proofOfPaymentSignedUrl, setProofOfPaymentSignedUrl] = useState('');
  const [packages, setPackages] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [clientTypes, setClientTypes] = useState([]);
  const [sponsor, setSponsor] = useState({
    name: '',
    phone: '',
    email: '',
    amount: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
  console.log('Location state:', location.state);
  console.log('Event ID:', eventid);

  if (!eventid) {
    setError('No event ID provided. Redirecting to event requests...');
    setLoading(false);
    setTimeout(() => nav('/event-request'), 2000);
    return;
  }

  const fetchEvent = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const userId = sessionStorage.getItem('userId');
      if (!token || !userId) {
        console.error('Missing token or userId:', { token, userId });
        nav('/login');
        return;
      }

      console.log('Fetching event with:', { token: token.slice(0, 10) + '...', userId, eventid });
      const response = await fetch(`http://localhost:5000/api/events/${eventid}`, {
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
          sessionStorage.removeItem('userId');
          nav('/login');
          return;
        }
        throw new Error(`Failed to fetch event: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('Fetched event data:', data);

      // Map backend fields to frontend state
      setEventData({
        event_name: data.name || '',
        location: data.location || '',
        start_date: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '',
        end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : '',
        time: data.start_time || '',
        deadline: data.registration_deadline_date ? new Date(data.registration_deadline_date).toISOString().split('T')[0] : '',
        event_type: data.event_type || '',
        capacity: data.capacity || '',
        event_details: data.description || '',
        terms_and_conditions: data.terms_and_conditions || '',
        file_url: data.coverimage || '/default-profile-picture.jpg',
        proof_of_payment_url: data.payment_proof_url || '',
        payment_type: data.payment_type || '',
        amount: data.paid_amount ? `R ${parseFloat(data.paid_amount).toFixed(2)}` : '',
        admin_comment: data.admin_comment || '',
      });

      // Set client types from attendees
      setClientTypes(data.attendees || []);

      // Use tabs and packages directly from the backend
      setTabs(data.tabs || []);
      setPackages(data.packages || []);

      // Set sponsor data
      setSponsor({
        name: data.sponsor?.name || '',
        phone: data.sponsor?.phone || data.contactnum || '',
        email: data.sponsor?.email || data.email || '',
        amount: data.payment_type === 'Sponsor' && data.paid_amount ? `R ${parseFloat(data.paid_amount).toFixed(2)}` : '',
      });

      // Use the proof_of_payment_url directly
      setProofOfPaymentSignedUrl(data.payment_proof_url || '');
    } catch (err) {
      console.error('Error fetching event:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchEvent();
}, [eventid, nav]);

  if (loading) {
    return <p>Loading event...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <div className="event-form">
      <button className="back-button" onClick={() => nav('/event-request')}>
        Back
      </button>

      <div className="grid-two">
        <div className="event-info">
          <div className="form-grid">
            <div>
              <label>Event Name</label>
              <input type="text" value={eventData.event_name} readOnly />
            </div>
            <div>
              <label>Location</label>
              <input type="text" value={eventData.location} readOnly />
            </div>
            <div>
              <label>Starting Date</label>
              <input type="date" value={eventData.start_date} readOnly />
            </div>
            <div>
              <label>Ending Date</label>
              <input type="date" value={eventData.end_date} readOnly />
            </div>
            <div>
              <label>Time</label>
              <input type="text" value={eventData.time} readOnly />
            </div>
            <div>
              <label>Deadline</label>
              <input type="date" value={eventData.deadline} readOnly />
            </div>
            <div>
              <label>Event Type</label>
              <input type="text" value={eventData.event_type} readOnly />
            </div>
            <div>
              <label>Max Capacity</label>
              <input type="number" value={eventData.capacity} readOnly />
            </div>
          </div>

          <label>Event Details</label>
          <textarea value={eventData.event_details} readOnly></textarea>
        </div>

        <div className="upload-section">
          <h4>Image</h4>
          <div className="upload-box">
            <img
              className="image"
              src={imageError ? '/default-profile-picture.jpg' : (eventData.file_url || '/default-profile-picture.jpg')}
              alt="Event"
              onError={(e) => {
                console.error('Image load error:', {
                  src: eventData.file_url,
                  message: e?.message || e?.target?.error?.message,
                  status: e?.target?.status,
                });
                setImageError(true);
              }}
              onLoad={() => console.log('Image loaded successfully:', eventData.file_url)}
            />
          </div>

          <div className="client-types">
            <label>Client Types Available</label>
            {clientTypes.map((type, index) => (
              <div key={index} className="client-type-item">
                <label>{type}</label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h4>Packages</h4>
      {packages.map((pkg, idx) => (
        <div key={idx} className="form-item">
          <div className="form-grid">
            <div>
              <label>Select</label>
              <select value={pkg.selectType} disabled>
                <option value="">{pkg.selectType || 'Select'}</option>
                {pkg.typeOptions.map((opt, i) => (
                  <option key={i}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Package Type</label>
              <input type="text" value={pkg.packageType} readOnly />
            </div>
            <div>
              <label>Location</label>
              <input type="text" value={pkg.location} readOnly />
            </div>
            <div>
              <label>Duration</label>
              <input type="text" value={pkg.duration} readOnly />
            </div>
            <div>
              <label>Date Choices</label>
              <input type="text" value={pkg.dateChoices} readOnly />
            </div>
            <div>
              <label>Pricing</label>
              <input type="text" value={pkg.pricing} readOnly />
            </div>
          </div>
          <label>Package Details</label>
          <textarea value={pkg.details} readOnly></textarea>
        </div>
      ))}

      <h4>Tabs</h4>
      {tabs.map((tab, idx) => (
        <div key={idx} className="form-item">
          <div className="form-grid">
            <div>
              <label>Name of Tab</label>
              <input type="text" value={tab.name} readOnly />
            </div>
          </div>
          <label>Tab Content</label>
          <textarea value={tab.content} readOnly></textarea>
        </div>
      ))}

      <div className="form-row">
        <label>Terms and Conditions</label>
        <textarea value={eventData.terms_and_conditions} readOnly></textarea>
      </div>

      <div className="form-grid">
        <div>
          <label>Payment Type</label>
          <input type="text" value={eventData.payment_type} readOnly />
        </div>
        {eventData.payment_type === 'Sponsor' ? (
          <>
            <div>
              <label>Sponsor Name</label>
              <input type="text" value={sponsor.name} readOnly />
            </div>
            <div>
              <label>Sponsor Phone</label>
              <input type="text" value={sponsor.phone} readOnly />
            </div>
            <div>
              <label>Sponsor Email</label>
              <input type="text" value={sponsor.email} readOnly />
            </div>
            <div>
              <label>Amount</label>
              <input type="text" value={sponsor.amount} readOnly />
            </div>
          </>
        ) : (
          <>
            <div>
              <label>Amount</label>
              <input type="text" value={eventData.amount} readOnly />
            </div>
            {eventData.proof_of_payment_url && (
              <div>
                <label>Proof of Payment</label>
                {eventData.proof_of_payment_url ? (
                  <a href={eventData.proof_of_payment_url} target="_blank" rel="noopener noreferrer">
                    View File
                  </a>
                ) : (
                  <span>No file available</span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="form-row" style={{ marginTop: '-1rem', width: '800px' }}>
        <label>Comments</label>
        <textarea
          placeholder="No comments available"
          value={eventData.admin_comment || ''}
          readOnly
        ></textarea>
      </div>
    </div>
  );
};

export default ViewEventRequest;