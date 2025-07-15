import React from 'react';
import { useNavigate } from 'react-router-dom';

function NewMenupage() {
  const nav = useNavigate();

  // Define styles as objects
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    marginTop: '50px'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '2px solid #20c997',
    marginTop: '30px'
  };

  const logoStyle = {
    height: '120px',
    marginBottom: '-20px',
    marginTop: '-30px'
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
    marginTop: '-180px'
  };

  const cardStyle = {
    border: '2px solid #20c997',
    borderRadius: '8px',
    padding: '15px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s',
    height: '250px',
    width: '250px',
    marginTop: '-110px'
  };

  const imageStyle = {
    height: '160px',
    width: '220px',
    maxWidth: '220px',
    borderBottom: '1px solid #ccc',
    marginBottom: '3px'
  };

  const textStyle = {
    fontSize: '20px',
    fontWeight: 'bold'
  };

  return (
    <div style={containerStyle}>
      <header className="dashboard-header">
          <img
            src="/XPRESS TICKETS LOGO2.png"
            alt="EventXpress Logo"
            className="dashboard-logo"
          />
          <div className="profile-section">
              <button className="backbutton22" onClick={()=> nav('/')}>LogOut </button>
          </div>
        </header>

      <main style={mainStyle}>
        <div 
          style={cardStyle} 
          onClick={() => nav("/organiser-dash")}
        >
          <img 
            src="/Organiser.jpg" 
            alt="Organiser" 
            style={imageStyle}
          />
          <p style={textStyle}>Organiser</p>
        </div>
        <div 
          style={cardStyle} 
          onClick={() => nav("/customerdash")}
        >
          <img 
            src="/Customer.jpg" 
            alt="Customer" 
            style={imageStyle}
          />
          <p style={textStyle}>Customer</p>
        </div>
      </main>
    </div>
  );
}

export default NewMenupage;