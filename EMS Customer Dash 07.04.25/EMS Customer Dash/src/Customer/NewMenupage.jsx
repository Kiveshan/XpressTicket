import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/ModernDashboard.css';

function NewMenupage() {
  const nav = useNavigate();

  // Define styles as objects
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f8f9fa'
  };

  const profileSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '18px'
  };

  const logoutButtonStyle = {
    backgroundColor: '#20c997',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  };

  const mainStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    gap: '100px',
    padding: '20px',
    marginTop: '40px'
  };

  const cardStyle = {
    border: 'none',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    height: '280px',
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const cardHoverStyle = {
    transform: 'translateY(-8px)',
    boxShadow: '0 10px 20px rgba(0,0,0,0.15)'
  };

  const imageStyle = {
    height: '170px',
    width: '220px',
    maxWidth: '100%',
    objectFit: 'cover',
    borderRadius: '8px',
    marginBottom: '15px'
  };

  const textStyle = {
    fontSize: '22px',
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: '10px'
  };

  const [hoverOrganiser, setHoverOrganiser] = React.useState(false);
  const [hoverCustomer, setHoverCustomer] = React.useState(false);

  return (
    <div className="modern-dashboard-container">
      <div className="modern-header">
        <div className="modern-header-logo">
          <img
            src="/XPRESS TICKETS LOGO2.png"
            alt="EventXpress Logo"
            className="modern-logo"
            style={{ maxHeight: '45px', width: 'auto' }}
            onError={(e) => {
              console.error('Failed to load logo');
              e.target.src = '/fallback-logo.png';
            }}
          />
          <h1 style={{ marginLeft: '15px', fontSize: '1.5rem', color: 'white' }}>XpressTicket Menu</h1>
        </div>
        <div className="modern-header-actions">
          <button className="modern-logout-btn" onClick={() => nav('/')}>
            Logout
          </button>
        </div>
      </div>

      <main style={mainStyle}>
        <div 
          style={{...cardStyle, ...(hoverOrganiser ? cardHoverStyle : {})}} 
          onClick={() => nav("/organiser-dash")}
          onMouseEnter={() => setHoverOrganiser(true)}
          onMouseLeave={() => setHoverOrganiser(false)}
        >
          <img 
            src="/Organiser.jpg" 
            alt="Organiser" 
            style={imageStyle}
          />
          <p style={textStyle}>Organiser</p>
          <p style={{ fontSize: '14px', color: '#718096', marginTop: '5px' }}>Manage events and tickets</p>
        </div>
        <div 
          style={{...cardStyle, ...(hoverCustomer ? cardHoverStyle : {})}} 
          onClick={() => nav("/customerdash")}
          onMouseEnter={() => setHoverCustomer(true)}
          onMouseLeave={() => setHoverCustomer(false)}
        >
          <img 
            src="/Customer.jpg" 
            alt="Customer" 
            style={imageStyle}
          />
          <p style={textStyle}>Customer</p>
          <p style={{ fontSize: '14px', color: '#718096', marginTop: '5px' }}>Browse and purchase tickets</p>
        </div>
      </main>
    </div>
  );
}

export default NewMenupage;