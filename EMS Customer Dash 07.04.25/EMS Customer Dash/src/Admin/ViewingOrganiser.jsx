import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../shared/ModernDashboard.css';
import { FaSignOutAlt, FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaBuilding, FaGraduationCap, FaIdCard } from 'react-icons/fa';

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
              formattedDate: new Date(event.startdate).toLocaleDateString(),
              amount: paymentData.amount ? `R${paymentData.amount}` : 'N/A',
              status: event.status
            };
          } catch (error) {
            console.error(`Error fetching payment for event ${event.event_id}:`, error);
            return {
              id: event.event_id,
              eventName: event.name,
              date: event.startdate,
              formattedDate: new Date(event.startdate).toLocaleDateString(),
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
    return <div className="modern-loading">Loading...</div>;
  }

  return (
    <div className="modern-dashboard-container">
      {/* Modern Header */}
      <header className="modern-header">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="modern-logo"
        />
        <div className="modern-header-actions">
          <button className="modern-logout-btn" onClick={() => nav('/')}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {/* Back Button */}
      <div className="modern-back-button">
        <button className="modern-btn" onClick={() => nav("/users")}>
          <FaArrowLeft /> Back to Users
        </button>
      </div>

      {/* Main Content */}
      <main className="modern-main-content">
        <h1 className="modern-page-title">Organiser Profile</h1>
        
        <div className="modern-profile-container">
          {/* Profile Information */}
          <div className="modern-profile-section">
            <div className="modern-card">
              <div className="modern-card-header">
                <h2><FaUser /> Personal Information</h2>
              </div>
              <div className="modern-card-body">
                <div className="modern-info-row">
                  <div className="modern-info-label">Full Name</div>
                  <div className="modern-info-value">{formData.name}</div>
                </div>
                
                <div className="modern-info-row">
                  <div className="modern-info-label"><FaEnvelope /> Email</div>
                  <div className="modern-info-value">{formData.email}</div>
                </div>
                
                <div className="modern-info-row">
                  <div className="modern-info-label"><FaPhone /> Phone</div>
                  <div className="modern-info-value">{formData.cellNumber}</div>
                </div>
              </div>
            </div>

            <div className="modern-card">
              <div className="modern-card-header">
                <h2><FaBuilding /> Institution Details</h2>
              </div>
              <div className="modern-card-body">
                <div className="modern-info-row">
                  <div className="modern-info-label">Institution</div>
                  <div className="modern-info-value">{formData.institutionLocation}</div>
                </div>
                
                <div className="modern-info-row">
                  <div className="modern-info-label"><FaGraduationCap /> Faculty</div>
                  <div className="modern-info-value">{formData.faculty}</div>
                </div>
                
                <div className="modern-info-row">
                  <div className="modern-info-label">Department</div>
                  <div className="modern-info-value">{formData.department}</div>
                </div>
              </div>
            </div>

            <div className="modern-card">
              <div className="modern-card-header">
                <h2><FaIdCard /> Additional Information</h2>
              </div>
              <div className="modern-card-body">
                <div className="modern-info-row">
                  <div className="modern-info-label">IEEE Number</div>
                  <div className="modern-info-value">{formData.ieeeNumber || 'Not provided'}</div>
                </div>
                
                <div className="modern-info-row">
                  <div className="modern-info-label">VAT Number</div>
                  <div className="modern-info-value">{formData.organVAT || 'Not provided'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Events Table */}
          <div className="modern-card modern-full-width">
            <div className="modern-card-header">
              <h2>Events Hosted</h2>
            </div>
            <div className="modern-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length > 0 ? events.map((event) => (
                    <tr key={event.id}>
                      <td>{event.eventName}</td>
                      <td>{event.formattedDate || new Date(event.date).toLocaleDateString()}</td>
                      <td>{event.amount}</td>
                      <td>
                        <span className={`modern-badge ${
                          event.status === 'Active' ? 'modern-badge-success' : 
                          event.status === 'Pending' ? 'modern-badge-warning' : 
                          'modern-badge-info'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="modern-no-data">No events found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ViewingOrganiser;