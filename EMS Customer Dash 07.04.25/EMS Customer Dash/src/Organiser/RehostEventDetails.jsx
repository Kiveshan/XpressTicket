import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './EventRequest.css';

const RehostEventDetails = () => {
  const nav = useNavigate();
  const location = useLocation();
  const { eventid } = location.state || {};
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    startdate: '',
    enddate: '',
  });
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = sessionStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please log in.');
          nav('/login');
          return;
        }

        const response = await fetch(`http://localhost:5000/api/events/${eventid}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userId');
            sessionStorage.removeItem('user');
            nav('/login');
            return;
          }
          throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setEvent(data);
        setFormData({
          startdate: data.startdate,
          enddate: data.enddate,
        });
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to load event details.');
        setLoading(false);
      }
    };

    if (eventid) {
      fetchEventDetails();
    } else {
      setError('No event ID provided.');
      setLoading(false);
    }
  }, [eventid, nav]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setSubmitError('No authentication token found. Please log in.');
        nav('/login');
        return;
      }

      const currentDate = new Date().toISOString().split('T')[0];
      if (new Date(formData.startdate) < new Date(currentDate)) {
        setSubmitError('Start date must be today or in the future.');
        return;
      }
      if (new Date(formData.enddate) < new Date(formData.startdate)) {
        setSubmitError('End date must be on or after the start date.');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/events/${eventid}/rehost`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          startdate: formData.startdate,
          enddate: formData.enddate,
          status: 'pending',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
      }

      setSubmitSuccess('Event successfully submitted for rehosting. Awaiting admin approval.');
      setTimeout(() => nav('/rehost-event'), 2000);
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError(err.message || 'Failed to submit rehost request.');
    }
  };

  if (loading) {
    return (
      <div className="container12">
        <header className="dashboard-header1">
          <img
            src="/XPRESS TICKETS LOGO2.png"
            alt="EventXpress Logo"
            className="dashboard-logo1"
          />
          <div className="profile-section">
            <button
              className="backbutton22"
              onClick={() => {
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('userId');
                sessionStorage.removeItem('user');
                nav('/login');
              }}
            >
              LogOut
            </button>
          </div>
        </header>
        <div className="back-button-container1">
          <button className="backbutton20" onClick={() => nav('/rehost-event')}>
            Back
          </button>
        </div>
        <div className="loading-container">
          <p className="loading">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container12">
        <header className="dashboard-header1">
          <img
            src="/XPRESS TICKETS LOGO2.png"
            alt="EventXpress Logo"
            className="dashboard-logo1"
          />
          <div className="profile-section">
            <button
              className="backbutton22"
              onClick={() => {
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('userId');
                sessionStorage.removeItem('user');
                nav('/login');
              }}
            >
              LogOut
            </button>
          </div>
        </header>
        <div className="back-button-container1">
          <button className="backbutton20" onClick={() => nav('/rehost-event')}>
            Back
          </button>
        </div>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Event Details</h3>
          <p className="error-message">{error}</p>
          <div className="action-buttons">
            <button
              className="retry-button"
              onClick={() => {
                setError(null);
                setLoading(true);
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container12">
      <header className="dashboard-header1">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="dashboard-logo1"
        />
        <div className="profile-section">
          <button
            className="backbutton22"
            onClick={() => {
              sessionStorage.removeItem('token');
              sessionStorage.removeItem('userId');
              sessionStorage.removeItem('user');
              nav('/login');
            }}
          >
            LogOut
          </button>
        </div>
      </header>
      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav('/rehost-event')}>
          Back
        </button>
      </div>
      <h2 className="title">Rehost Event: {event.name}</h2>
      <div className="card">
        <div className="card-image-container">
          <img
            src={event.coverimage || '/default-event-image.jpg'}
            alt={event.name}
            className="card-image"
            onError={(e) => {
              if (e.target.src !== '/default-event-image.jpg') {
                e.target.src = '/default-event-image.jpg';
                e.target.classList.add('image-error');
              }
            }}
          />
        </div>
        <div className="card-details">
          <p><strong>Location:</strong> {event.location}</p>
          <p><strong>Current Start Date:</strong> {event.startdate}</p>
          <p><strong>Current End Date:</strong> {event.enddate}</p>
          <p><strong>Time:</strong> {event.time}</p>
          <p><strong>Duration:</strong> {event.duration}</p>
          <p><strong>Capacity:</strong> {event.capacity}</p>
          <p><strong>Type:</strong> {event.type}</p>
          <p><strong>Description:</strong> {event.description || 'No description provided'}</p>
        </div>
        <form onSubmit={handleSubmit} className="rehost-form">
          <div className="form-group">
            <label htmlFor="startdate">New Start Date:</label>
            <input
              type="date"
              id="startdate"
              name="startdate"
              value={formData.startdate}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="enddate">New End Date:</label>
            <input
              type="date"
              id="enddate"
              name="enddate"
              value={formData.enddate}
              onChange={handleInputChange}
              required
            />
          </div>
          {submitError && <p className="error-message">{submitError}</p>}
          {submitSuccess && <p className="success-message">{submitSuccess}</p>}
          <div className="form-actions">
            <button type="submit" className="submit-btn">Submit Rehost Request</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RehostEventDetails;