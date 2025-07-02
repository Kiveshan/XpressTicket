import React, { useState, useEffect } from 'react';
import '../Customer/InformationForm.css';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios'; // Make sure axios is installed with npm install axios

const ViewingOrganiser = () => {
  const nav = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;
  
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    dropdown: '',
    email: '',
    cellNumber: '',
    institutionLocation: '',
    faculty: '',
    department: '',
    ieeeNumber: '',
    organVAT: ''
  });
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Define the API base URL
    const API_BASE_URL = 'http://localhost:5000'; // Server is running on port 5000
    
    const fetchUserData = async () => {
      try {
        // Fetch user profile data
        const userResponse = await axios.get(`${API_BASE_URL}/api/user-profile/${userId}`);
        const userData = userResponse.data;
        
        setFormData({
          name: `${userData.firstname} ${userData.surname}`,
          title: userData.title || '',
          dropdown: userData.title || '',
          email: userData.email,
          cellNumber: userData.cellnumber,
          institutionLocation: userData.institution,
          faculty: userData.faculty_name,
          department: userData.department_name,
          ieeeNumber: userData.ieee_no,
          organVAT: userData.vat_no
        });
        
        // Fetch events hosted by this user
        const eventsResponse = await axios.get(`${API_BASE_URL}/api/user-events/${userId}`);
        const eventsData = eventsResponse.data;
        
        // For each event, get the payment amount
        const eventsWithPayments = await Promise.all(eventsData.map(async (event) => {
          try {
            const paymentResponse = await axios.get(`${API_BASE_URL}/api/event-payment/${event.event_id}`);
            const paymentData = paymentResponse.data;
            return {
              id: event.event_id,
              eventName: event.name,
              date: event.startdate,
              amount: paymentData.amount ? `R${paymentData.amount}` : 'N/A',
              status: event.status
            };
          } catch (error) {
            console.error(`Error fetching payment for event ${event.event_id}:`, error);
            return {
              id: event.event_id,
              eventName: event.name,
              date: event.startdate,
              amount: 'N/A',
              status: event.status
            };
          }
        }));
        
        setEvents(eventsWithPayments);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchUserData();
    } else {
      nav('/users');
    }
  }, [userId, nav]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <br />
      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav("/users")}>
          Back
        </button>
      </div>
      <div className="form-container">
        <form>
          <div className="form-section">
            <h2>Full Name</h2>
            <div className="input-group">
              <input
                type="text"
                name="name"
                placeholder="Name here"
                value={formData.name}
                readOnly
              />
              <select
                className="inputselect"
                name="dropdown"
                value={formData.dropdown}
                disabled
              >
                <option value="">Title</option>
                <option value="Mr">Mr</option>
                <option value="Dr">Dr</option>
                <option value="Miss">Miss</option>
                <option value="Mrs">Mrs</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h2>Email</h2>
            <div className="input-group">
              <input
                className="inputselect"
                type="email"
                name="email"
                placeholder="Email here"
                value={formData.email}
                readOnly
              />
              <input
                className="inputselect"
                type="tel"
                name="cellNumber"
                placeholder="Cell Number"
                value={formData.cellNumber}
                readOnly
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Institution Name</h2>
            <div className="input-group">
              <input
                className="inputselect"
                type="text"
                name="institutionLocation"
                placeholder="Institution Location"
                value={formData.institutionLocation}
                readOnly
              />
              <input
                className="inputselect"
                type="text"
                name="faculty"
                placeholder="Faculty"
                value={formData.faculty}
                readOnly
              />
              <input
                className="inputselect"
                type="text"
                name="department"
                placeholder="Department"
                value={formData.department}
                readOnly
              />
            </div>
          </div>

          <div className="form-section">
            <h2>IEEE Number</h2>
            <div className="input-group">
              <input
                className="inputselect"
                type="text"
                name="ieeeNumber"
                placeholder="IEEE Number"
                value={formData.ieeeNumber}
                readOnly
              />
            </div>
            <h2>Organ VAT</h2>
            <div className="input-group">
              <input
                className="inputselect"
                type="text"
                name="organVAT"
                placeholder="Organ VAT"
                value={formData.organVAT}
                readOnly
              />
            </div>
          </div>
        </form>
      </div>

      {/* Events Table */}
      <div className="events-table-container">
        <h2>Events Hosted</h2>
        <table className="events-table">
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{event.eventName}</td>
                <td>{event.date}</td>
                <td>{event.amount}</td>
                <td>{event.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ViewingOrganiser;