
import React, { useState, useEffect, useCallback } from 'react';
import '../shared/ModernDashboard.css';
import './ViewingCustomer.css';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaGraduationCap, FaIdCard } from 'react-icons/fa';

const ViewingCustomer = () => {
  const nav = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cellNumber: '',
    institutionLocation: '',
    faculty: '',
    department: '',
    ieeeNumber: '',
    organVAT: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ticketPurchases, setTicketPurchases] = useState([]);
  
  const API_BASE_URL = 'http://localhost:5000';
  
  const fetchUserData = useCallback(async () => {
    try {
      console.log('Fetching customer data for ID:', userId);
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
          email: userData.email || '',
          cellNumber: userData.cellnumber || '',
          institutionLocation: userData.institution || '',
          faculty: userData.faculty_name || '',
          department: userData.department_name || '',
          ieeeNumber: userData.ieee_no || '',
          organVAT: userData.vat_no || ''
        });
        
        try {
          console.log(`Fetching tickets for customer ID: ${userId}`);
          const ticketsResponse = await axios.get(`${API_BASE_URL}/api/user-tickets/${userId}`);
          console.log('Tickets API response:', ticketsResponse.data);
          const ticketsData = ticketsResponse.data;
          
          if (Array.isArray(ticketsData) && ticketsData.length > 0) {
            setTicketPurchases(ticketsData.map(ticket => ({
              id: ticket.ticket_id,
              eventName: ticket.event_name,
              purchaseDate: new Date(ticket.purchase_date).toLocaleDateString(),
              amount: ticket.amount ? `R${ticket.amount}` : 'N/A',
              status: ticket.status || 'Purchased'
            })));
          } else {
            setTicketPurchases([]);
            console.log('No tickets found for this customer');
          }
        } catch (ticketsError) {
          console.error('Error fetching tickets:', ticketsError);
          setTicketPurchases([]);
        }
      } else {
        setError(`No data found for customer with ID: ${userId}`);
        console.error('No user data returned from API or empty data object');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(`Error loading customer data: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  }, [userId, API_BASE_URL]);

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
          <p>Loading customer profile...</p>
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
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', width: '100%'}}>
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
        </div>
      </main>

      <div style={{padding: '0 15px 15px 15px'}}>
        <div style={{border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden', marginTop: '15px'}}>
          <div style={{background: 'linear-gradient(135deg, #2c3e50, #4ca1af)', padding: '8px 15px', color: 'white'}}>
            <h2 style={{margin: '0', fontSize: '13px', fontWeight: 500}}>Ticket Purchases</h2>
          </div>
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '1px solid #e9ecef', background: '#f8f9fa'}}>
                  <th style={{padding: '8px 10px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600}}>Event Name</th>
                  <th style={{padding: '8px 10px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600}}>Purchase Date</th>
                  <th style={{padding: '8px 10px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600}}>Amount</th>
                  <th style={{padding: '8px 10px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {ticketPurchases.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{padding: '10px', textAlign: 'center', fontSize: '0.8rem'}}>
                      No ticket purchases found for this customer.
                    </td>
                  </tr>
                ) : (
                  ticketPurchases.map((ticket) => (
                    <tr key={ticket.id} style={{borderBottom: '1px solid #f0f0f0'}}>
                      <td style={{padding: '6px 10px', fontSize: '0.75rem'}}>{ticket.eventName}</td>
                      <td style={{padding: '6px 10px', fontSize: '0.75rem'}}>{ticket.purchaseDate}</td>
                      <td style={{padding: '6px 10px', fontSize: '0.75rem'}}>{ticket.amount}</td>
                      <td style={{padding: '6px 10px', fontSize: '0.75rem'}}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            backgroundColor: ticket.status === 'Active' ? '#d1e7dd' : 
                                            ticket.status === 'Purchased' ? '#d1e7dd' :
                                            ticket.status === 'Pending' ? '#fff3cd' : '#f8d7da',
                            color: ticket.status === 'Active' ? '#0f5132' :
                                    ticket.status === 'Purchased' ? '#0f5132' :
                                    ticket.status === 'Pending' ? '#856404' : '#721c24'
                          }}>
                          {ticket.status || 'Purchased'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewingCustomer;
