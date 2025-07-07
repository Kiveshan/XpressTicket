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
    status: ''
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
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [proofOfPaymentFile, setProofOfPaymentFile] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
 
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
          amount: data.paid_amount ? parseFloat(data.paid_amount).toFixed(2) : '',
          admin_comment: data.admin_comment || '',
          status: data.status || ''
        });
 
        setIsEditable(data.status === 'Request Edit');
        setClientTypes(data.attendees || []);
        setTabs(data.tabs || []);
        setPackages(data.packages || []);
 
        setSponsor({
          name: data.sponsor?.name || '',
          phone: data.sponsor?.phone || data.contactnum || '',
          email: data.sponsor?.email || data.email || '',
          amount: data.payment_type === 'Sponsor' && data.paid_amount ? parseFloat(data.paid_amount).toFixed(2) : '',
        });
 
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
 
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({ ...prev, [name]: value }));
  };
 
  const handleSponsorChange = (e) => {
    const { name, value } = e.target;
    setSponsor(prev => ({ ...prev, [name]: value }));
  };
 
  const handleClientTypeChange = (index, value) => {
    const newClientTypes = [...clientTypes];
    newClientTypes[index] = value;
    setClientTypes(newClientTypes);
  };
 
  const addClientType = () => {
    setClientTypes([...clientTypes, '']);
  };
 
  const removeClientType = (index) => {
    setClientTypes(clientTypes.filter((_, i) => i !== index));
  };
 
  const handleTabChange = (index, field, value) => {
    const newTabs = [...tabs];
    newTabs[index] = { ...newTabs[index], [field]: value };
    setTabs(newTabs);
  };
 
  const addTab = () => {
    setTabs([...tabs, { name: '', content: '' }]);
  };
 
  const removeTab = (index) => {
    setTabs(tabs.filter((_, i) => i !== index));
  };
 
  const handlePackageChange = (index, field, value) => {
    const newPackages = [...packages];
    newPackages[index] = { ...newPackages[index], [field]: value };
    setPackages(newPackages);
  };
 
  const addPackage = () => {
    setPackages([...packages, {
      selectType: '',
      packageType: '',
      location: '',
      duration: '',
      dateChoices: '',
      pricing: '',
      details: '',
      typeOptions: [] // Initialize typeOptions to avoid undefined error
    }]);
  };
 
  const removePackage = (index) => {
    setPackages(packages.filter((_, i) => i !== index));
  };
 
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === 'cover_image') {
      setCoverImageFile(file);
      setEventData(prev => ({ ...prev, file_url: URL.createObjectURL(file) }));
    } else if (type === 'proof_of_payment') {
      setProofOfPaymentFile(file);
      setProofOfPaymentSignedUrl(URL.createObjectURL(file));
    }
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditable) return;
 
    const formData = new FormData();
    formData.append('name', eventData.event_name);
    formData.append('description', eventData.event_details);
    formData.append('location', eventData.location);
    formData.append('start_date', eventData.start_date);
    formData.append('end_date', eventData.end_date);
    formData.append('start_time', eventData.time);
    formData.append('deadlinedate', eventData.deadline);
    formData.append('event_type', eventData.event_type);
    formData.append('capacity', eventData.capacity);
    formData.append('attendees', JSON.stringify(clientTypes));
    formData.append('tabs', JSON.stringify(tabs));
    formData.append('packages', JSON.stringify(packages));
    formData.append('terms_and_conditions', eventData.terms_and_conditions);
    formData.append('payment_type', eventData.payment_type);
    formData.append('payment_amount', eventData.amount);
    formData.append('contactnum', sponsor.phone);
    formData.append('email', sponsor.email);
 
    if (coverImageFile) formData.append('cover_image', coverImageFile);
    if (proofOfPaymentFile) formData.append('proof_of_payment', proofOfPaymentFile);
 
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/events/${eventid}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
 
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update event');
      }
 
      const data = await response.json();
      console.log('Event updated:', data);
      nav('/event-request', { state: { message: 'Event updated successfully and set to pending' } });
    } catch (err) {
      console.error('Error updating event:', err);
      setError(err.message);
    }
  };
 
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
 
      <form onSubmit={handleSubmit}>
        <div className="grid-two">
          <div className="event-info">
            <div className="form-grid">
              <div>
                <label>Event Name</label>
                <input
                  type="text"
                  name="event_name"
                  value={eventData.event_name}
                  onChange={handleInputChange}
                  readOnly={!isEditable}
                />
              </div>
              <div>
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={eventData.location}
                  onChange={handleInputChange}
                  readOnly={!isEditable}
                />
              </div>
              <div>
                <label>Starting Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={eventData.start_date}
                  onChange={handleInputChange}
                  readOnly={!isEditable}
                />
              </div>
              <div>
                <label>Ending Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={eventData.end_date}
                  onChange={handleInputChange}
                  readOnly={!isEditable}
                />
              </div>
              <div>
                <label>Time</label>
                <input
                  type="text"
                  name="time"
                  value={eventData.time}
                  onChange={handleInputChange}
                  readOnly={!isEditable}
                />
              </div>
              <div>
                <label>Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={eventData.deadline}
                  onChange={handleInputChange}
                  readOnly={!isEditable}
                />
              </div>
              <div>
                <label>Event Type</label>
                <input
                  type="text"
                  name="event_type"
                  value={eventData.event_type}
                  onChange={handleInputChange}
                  readOnly={!isEditable}
                />
              </div>
              <div>
                <label>Max Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={eventData.capacity}
                  onChange={handleInputChange}
                  readOnly={!isEditable}
                />
              </div>
            </div>
 
            <label>Event Details</label>
            <textarea
              name="event_details"
              value={eventData.event_details}
              onChange={handleInputChange}
              readOnly={!isEditable}
            ></textarea>
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
              {isEditable && (
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => handleFileChange(e, 'cover_image')}
                />
              )}
            </div>
 
            <div className="client-types">
              <label>Client Types Available</label>
              {clientTypes.map((type, index) => (
                <div key={index} className="client-type-item">
                  <input
                    type="text"
                    value={type}
                    onChange={(e) => handleClientTypeChange(index, e.target.value)}
                    readOnly={!isEditable}
                  />
                  {isEditable && (
                    <button type="button" onClick={() => removeClientType(index)}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {isEditable && (
                <button type="button" onClick={addClientType}>
                  Add Client Type
                </button>
              )}
            </div>
          </div>
        </div>
 
        <h4>Packages</h4>
        {packages.map((pkg, idx) => (
          <div key={idx} className="form-item">
            <div className="form-grid">
              <div>
                <label>Select</label>
                <select
                  value={pkg.selectType}
                  onChange={(e) => handlePackageChange(idx, 'selectType', e.target.value)}
                  disabled={!isEditable}
                >
                  <option value="">Select</option>
                  {(pkg.typeOptions || []).map((opt, i) => (
                    <option key={i}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Package Type</label>
                <input
                  type="text"
                  value={pkg.packageType}
                  onChange={(e) => handlePackageChange(idx, 'packageType', e.target.value)}
                  readOnly={!isEditable}
                />
              </div>
              <div>
                <label>Location</label>
                <input
                  type="text"
                  value={pkg.location}
                  onChange={(e) => handlePackageChange(idx, 'location', e.target.value)}
                  readOnly={!isEditable}
                />
              </div>
              <div>
                <label>Duration</label>
                <input
                  type="text"
                  value={pkg.duration}
                  onChange={(e) => handlePackageChange(idx, 'duration', e.target.value)}
                  readOnly={!isEditable}
                />
              </div>
              <div>
                <label>Date Choices</label>
                <input
                  type="text"
                  value={pkg.dateChoices}
                  onChange={(e) => handlePackageChange(idx, 'dateChoices', e.target.value)}
                  readOnly={!isEditable}
                />
              </div>
              <div>
                <label>Pricing</label>
                <input
                  type="text"
                  value={pkg.pricing}
                  onChange={(e) => handlePackageChange(idx, 'pricing', e.target.value)}
                  readOnly={!isEditable}
                />
              </div>
            </div>
            <label>Package Details</label>
            <textarea
              value={pkg.details}
              onChange={(e) => handlePackageChange(idx, 'details', e.target.value)}
              readOnly={!isEditable}
            ></textarea>
            {isEditable && (
              <button type="button" onClick={() => removePackage(idx)}>
                Remove Package
              </button>
            )}
          </div>
        ))}
        {isEditable && (
          <button type="button" onClick={addPackage}>
            Add Package
          </button>
        )}
 
        <h4>Tabs</h4>
        {tabs.map((tab, idx) => (
          <div key={idx} className="form-item">
            <div className="form-grid">
              <div>
                <label>Name of Tab</label>
                <input
                  type="text"
                  value={tab.name}
                  onChange={(e) => handleTabChange(idx, 'name', e.target.value)}
                  readOnly={!isEditable}
                />
              </div>
            </div>
            <label>Tab Content</label>
            <textarea
              value={tab.content}
              onChange={(e) => handleTabChange(idx, 'content', e.target.value)}
              readOnly={!isEditable}
            ></textarea>
            {isEditable && (
              <button type="button" onClick={() => removeTab(idx)}>
                Remove Tab
              </button>
            )}
          </div>
        ))}
        {isEditable && (
          <button type="button" onClick={addTab}>
            Add Tab
          </button>
        )}
 
        <div className="form-row">
          <label>Terms and Conditions</label>
          <textarea
            name="terms_and_conditions"
            value={eventData.terms_and_conditions}
            onChange={handleInputChange}
            readOnly={!isEditable}
          ></textarea>
        </div>
 
        <div className="form-row" style={{ marginTop: '-1rem', width: '800px' }}>
          <label>Admin Comments</label>
          <textarea
            placeholder="No comments available"
            value={eventData.admin_comment || ''}
            readOnly
          ></textarea>
        </div>
 
        {isEditable && (
          <button type="submit" className="submit-button">
            Update Event
          </button>
        )}
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
};
 
export default ViewEventRequest;
 