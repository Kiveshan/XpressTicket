import React, { useState, useEffect, useCallback } from 'react';
import '../shared/ModernDashboard.css';
import './ViewingOrganiser.css';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaGraduationCap, FaIdCard } from 'react-icons/fa';

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
  const [error, setError] = useState(null);
  
  const API_BASE_URL = 'http://localhost:5000';
  
  const fetchUserData = useCallback(async () => {
    try {
      console.log('Fetching user data for ID:', userId);
      setLoading(true);
      setError(null);
      
      if (!userId) {
        setError('No user ID provided. Cannot fetch user data.');
        setLoading(false);
        return;
      }
      
      const userResponse = await axios.get(`${API_BASE_URL}/api/user-profile/${userId}`);
      console.log('User API response:', userResponse.data);
      const userData = userResponse.data;
      
      if (userData && Object.keys(userData).length > 0) {
        setFormData({
          name: `${userData.firstname || ''} ${userData.surname || ''}`.trim(),
          title: userData.title || '',
          dropdown: userData.title || '',
          email: userData.email || '',
          cellNumber: userData.cellnumber || '',
          institutionLocation: userData.institution || '',
          faculty: userData.faculty_name || '',
          department: userData.department_name || '',
          ieeeNumber: userData.ieee_no || '',
          organVAT: userData.vat_no || ''
        });
      } else {
        setError(`No data found for organiser with ID: ${userId}`);
        console.error('No user data returned from API or empty data object');
      }
      
      try {
        console.log(`Fetching events for user ID: ${userId}`);
        const eventsResponse = await axios.get(`${API_BASE_URL}/api/user-events/${userId}`);
        console.log('Events API response:', eventsResponse.data);
        const eventsData = eventsResponse.data;
        
        if (Array.isArray(eventsData) && eventsData.length > 0) {
          const eventsWithPayments = await Promise.all(eventsData.map(async (event) => {
            try {
              const paymentResponse = await axios.get(`${API_BASE_URL}/api/event-payment/${event.event_id}`);
              console.log(`Payment for event ${event.event_id}:`, paymentResponse.data);
              return {
                id: event.event_id,
                eventName: event.name,
                date: event.startdate,
                formattedDate: new Date(event.startdate).toLocaleDateString(),
                amount: paymentResponse.data.amount ? `R${paymentResponse.data.amount}` : 'N/A',
                status: event.status
              };
            } catch (error) {
              console.error(`Error fetching payment for event ${event.event_id}:`, error);
              return {
                id: event.event_id,
                eventName: event.name || 'Unknown Event',
                date: event.startdate,
                formattedDate: event.startdate ? new Date(event.startdate).toLocaleDateString() : 'N/A',
                amount: 'N/A',
                status: event.status || 'Unknown'
              };
            }
          }));
          
          setEvents(eventsWithPayments);
        } else {
          setEvents([]);
          console.log('No events found for this user');
        }
      } catch (eventsError) {
        console.error('Error fetching events:', eventsError);
        setEvents([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(`Error loading organiser data: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    } else {
      console.error('No userId provided in location state');
      setTimeout(() => {
        alert('Error: No user ID provided. Redirecting to users list.');
        nav('/users');
      }, 100);
    }
    
    return () => {};
  }, [userId, nav, fetchUserData]);

  if (loading && !error) {
    return (
      <div className="modern-dashboard-container">
        <header className="modern-header">
          <div className="header-left">
            <button className="modern-button" onClick={() => nav('/users')}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
            <img
              src="/XPRESS TICKETS LOGO2.png"
              alt="EventXpress Logo"
              className="header-logo"
              onError={(e) => {
                console.error('Failed to load logo');
                e.target.src = '/fallback-logo.png';
              }}
            />
          </div>
          <div className="modern-header-actions">
            <button className="modern-button" onClick={() => nav('/')}>
              <span className="button-icon">↩</span> Logout
            </button>
          </div>
        </header>
        <div className="modern-loading">
          <div className="modern-spinner"></div>
          <p>Loading organiser profile...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="modern-dashboard-container">
      <header className="modern-header">
        <div className="header-left">
          <button className="modern-button" onClick={() => nav('/users')}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <img
            src="/XPRESS TICKETS LOGO2.png"
            alt="EventXpress Logo"
            className="header-logo"
            onError={(e) => {
              console.error('Failed to load logo');
              e.target.src = '/fallback-logo.png';
            }}
          />
        </div>
        <div className="modern-header-actions">
          <button className="modern-button" onClick={() => nav('/')}>
            <span className="button-icon">↩</span> Logout
          </button>
        </div>
      </header>
      
      {error && (
        <div className="modern-error">
          <p>{error}</p>
          <button className="modern-button" onClick={() => {
            setError(null);
            if (userId) fetchUserData();
          }}>
            Retry
          </button>
        </div>
      )}

      <main className="modern-main-content">
        <div className="modern-profile-container">
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', width: '100%', marginBottom: '15px'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <div style={{border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden'}}>
                <div style={{background: 'linear-gradient(135deg, #2c3e50, #4ca1af)', padding: '4px 8px', color: 'white'}}>
                  <span style={{fontSize: '11px', fontWeight: 500}}><FaUser size={10} style={{marginRight: '4px'}} /> Personal Information</span>
                </div>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem'}}>
                  <tbody>
                    <tr style={{borderBottom: '1px solid #f0f0f0'}}>
                      <td style={{padding: '3px 6px', color: '#495057', fontWeight: 500, width: '90px'}}>Full Name</td>
                      <td style={{padding: '3px 6px'}}>{formData.name}</td>
                    </tr>
                    <tr style={{borderBottom: '1px solid #f0f0f0'}}>
                      <td style={{padding: '3px 6px', color: '#495057', fontWeight: 500}}><FaEnvelope size={10} style={{marginRight: '4px'}} />Email</td>
                      <td style={{padding: '3px 6px'}}>{formData.email}</td>
                    </tr>
                    <tr>
                      <td style={{padding: '3px 6px', color: '#495057', fontWeight: 500}}><FaPhone size={10} style={{marginRight: '4px'}} />Phone</td>
                      <td style={{padding: '3px 6px'}}>{formData.cellNumber}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden'}}>
                <div style={{background: 'linear-gradient(135deg, #2c3e50, #4ca1af)', padding: '4px 8px', color: 'white'}}>
                  <span style={{fontSize: '11px', fontWeight: 500}}><FaIdCard size={10} style={{marginRight: '4px'}} /> Additional Information</span>
                </div>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem'}}>
                  <tbody>
                    <tr style={{borderBottom: '1px solid #f0f0f0'}}>
                      <td style={{padding: '3px 6px', color: '#495057', fontWeight: 500, width: '90px'}}>IEEE Number</td>
                      <td style={{padding: '3px 6px'}}>{formData.ieeeNumber || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td style={{padding: '3px 6px', color: '#495057', fontWeight: 500}}>VAT Number</td>
                      <td style={{padding: '3px 6px'}}>{formData.organVAT || 'Not provided'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <div style={{border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden'}}>
                <div style={{background: 'linear-gradient(135deg, #2c3e50, #4ca1af)', padding: '4px 8px', color: 'white'}}>
                  <span style={{fontSize: '11px', fontWeight: 500}}><FaBuilding size={10} style={{marginRight: '4px'}} /> Institution Details</span>
                </div>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem'}}>
                  <tbody>
                    <tr style={{borderBottom: '1px solid #f0f0f0'}}>
                      <td style={{padding: '3px 6px', color: '#495057', fontWeight: 500, width: '90px'}}>Institution</td>
                      <td style={{padding: '3px 6px'}}>{formData.institutionLocation}</td>
                    </tr>
                    <tr style={{borderBottom: '1px solid #f0f0f0'}}>
                      <td style={{padding: '3px 6px', color: '#495057', fontWeight: 500}}><FaGraduationCap size={10} style={{marginRight: '4px'}} />Faculty</td>
                      <td style={{padding: '3px 6px'}}>{formData.faculty}</td>
                    </tr>
                    <tr>
                      <td style={{padding: '3px 6px', color: '#495057', fontWeight: 500}}>Department</td>
                      <td style={{padding: '3px 6px'}}>{formData.department}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{marginTop: '15px', border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden'}}>
            <div style={{background: 'linear-gradient(135deg, #2c3e50, #4ca1af)', padding: '4px 8px', color: 'white'}}>
              <span style={{fontSize: '11px', fontWeight: 500}}>Events Hosted</span>
            </div>
            <div style={{overflowX: 'auto', maxHeight: '300px'}}>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem'}}>
                <thead style={{position: 'sticky', top: 0, background: '#f8f9fa'}}>
                  <tr>
                    <th style={{padding: '6px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 600, color: '#495057'}}>Event Name</th>
                    <th style={{padding: '6px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 600, color: '#495057'}}>Date</th>
                    <th style={{padding: '6px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 600, color: '#495057'}}>Amount</th>
                    <th style={{padding: '6px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 600, color: '#495057'}}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length > 0 ? events.map((event) => (
                    <tr key={event.id} style={{borderBottom: '1px solid #f0f0f0'}}>
                      <td style={{padding: '6px'}}>{event.eventName}</td>
                      <td style={{padding: '6px'}}>{event.formattedDate || new Date(event.date).toLocaleDateString()}</td>
                      <td style={{padding: '6px'}}>{event.amount}</td>
                      <td style={{padding: '6px'}}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          color: 'white',
                          background: event.status === 'Active' ? '#4caf50' : 
                                     event.status === 'Pending' ? '#ff9800' : '#f44336'
                        }}>
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" style={{padding: '10px', textAlign: 'center', color: '#6c757d'}}>No events found</td>
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