import React, { useState, useEffect } from 'react';
import './RehostEventForm.css';
import axios from 'axios';

const RehostEventForm = () => {
  const [pastEvents, setPastEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({ startdate: '', enddate: '', resetAttendees: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchPastEvents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/events/past', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPastEvents(response.data.events || []);
        setError(null);
      } catch (error) {
        console.error('Error fetching past events:', error);
        setError(error.response?.data?.error || 'Failed to fetch past events');
      } finally {
        setLoading(false);
      }
    };

    fetchPastEvents();
  }, []);

  const handleSelectEvent = (eventId) => {
    const event = pastEvents.find((e) => e.event_id === eventId);
    if (event) {
      setSelectedEvent(event);
      setFormData({
        startdate: '',
        enddate: '',
        resetAttendees: true,
      });
      setSuccessMessage(null);
    } else {
      setSelectedEvent(null);
      setError('Selected event not found');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEvent) {
      setError('No event selected');
      return;
    }

    try {
      const response = await axios.put(
        `/api/events/${selectedEvent.event_id}/rehost`,
        formData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setSuccessMessage(response.data.message);
      setError(null);
      setFormData({ startdate: '', enddate: '', resetAttendees: true });
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error rehosting event:', error);
      setError(error.response?.data?.error || 'Failed to rehost event');
      setSuccessMessage(null);
    }
  };

  return (
    <div className="rehost-form">
      <h2>Rehost Past Events</h2>

      {loading && <p>Loading past events...</p>}
      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}

      <div className="form-group">
        <label>Select Event to Rehost:</label>
        <select
          value={selectedEvent ? selectedEvent.event_id : ''}
          onChange={(e) => handleSelectEvent(e.target.value)}
        >
          <option value="">Select an event to rehost</option>
          {pastEvents.length > 0 ? (
            pastEvents.map((event) => (
              <option key={event.event_id} value={event.event_id}>
                {event.name}
              </option>
            ))
          ) : (
            <option disabled>No past events available</option>
          )}
        </select>
      </div>

      {selectedEvent && (
        <form onSubmit={handleSubmit} className="rehost-form">
          <h3>Rehost: {selectedEvent.name}</h3>
          <div className="form-group">
            <label>Start Date:</label>
            <input
              type="date"
              value={formData.startdate}
              onChange={(e) => setFormData({ ...formData, startdate: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>End Date:</label>
            <input
              type="date"
              value={formData.enddate}
              onChange={(e) => setFormData({ ...formData, enddate: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.resetAttendees}
                onChange={(e) => setFormData({ ...formData, resetAttendees: e.target.checked })}
              />
              Reset Attendees
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-btn">
              Rehost Event
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RehostEventForm;