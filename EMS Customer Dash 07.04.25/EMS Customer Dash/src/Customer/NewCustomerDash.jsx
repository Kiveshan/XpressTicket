import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaArrowLeft, FaTicketAlt, FaShoppingBag } from 'react-icons/fa';

function NewCustomerDash() {
  const nav = useNavigate();
  
  // Customer dashboard cards with more details
  const customerCards = [
    {
      title: "Book an Event",
      description: "Browse and book tickets for upcoming events",
      image: "/Organiser.jpg",
      path: "/eventmenu",
      icon: <FaTicketAlt />
    },
    {
      title: "My Purchases",
      description: "View and manage your ticket purchases",
      image: "/Customer.jpg",
      path: "/reviewpurchase",
      icon: <FaShoppingBag />
    }
  ];

  // Container styles
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa'
  };

  // Header styles
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 25px',
    background: 'linear-gradient(135deg, #2c3e50, #4ca1af)',
    color: 'white'
  };

  const logoStyle = {
    height: '40px'
  };

  const headerActionsStyle = {
    display: 'flex',
    gap: '15px'
  };

  const logoutBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  };

  // Back button styles
  const backButtonContainerStyle = {
    padding: '15px 25px'
  };

  const backBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'transparent',
    color: '#555',
    border: '1px solid #ddd',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  // Main content styles
  const mainContentStyle = {
    flex: '1',
    padding: '20px 25px'
  };

  const pageTitleStyle = {
    fontSize: '28px',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '30px',
    position: 'relative',
    paddingBottom: '10px',
    borderBottom: '4px solid #20c997',
    width: 'fit-content',
    margin: '0 auto 30px auto',
    textAlign: 'center'
  };

  // Card grid styles
  const cardGridStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
    marginTop: '30px',
    flexWrap: 'wrap'
  };

  // Card styles - INCREASED HEIGHT
  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
    height: '350px', // Significantly increased height
    width: '300px', // Increased width
    display: 'flex',
    flexDirection: 'column'
  };

  const cardImageContainerStyle = {
    height: '200px', // Significantly increased height
    overflow: 'hidden',
    position: 'relative'
  };

  const cardImageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  };

  const cardContentStyle = {
    padding: '20px',
    flex: '1'
  };

  const cardTitleStyle = {
    fontSize: '22px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  const cardDescriptionStyle = {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.5'
  };

  return (
    <div style={containerStyle}>
      {/* Modern Header */}
      <header style={headerStyle}>
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          style={logoStyle}
        />
        <div style={headerActionsStyle}>
          <button style={logoutBtnStyle} onClick={() => nav('/')}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {/* Back Button */}
      <div style={backButtonContainerStyle}>
        <button style={backBtnStyle} onClick={() => nav('/mainmenu')}>
          <FaArrowLeft /> Back to Main Menu
        </button>
      </div>

      {/* Main Content */}
      <main style={mainContentStyle}>
        <h1 style={pageTitleStyle}>Customer Dashboard</h1>
        
        {/* Card Grid */}
        <div style={cardGridStyle}>
          {customerCards.map((card, index) => (
            <div 
              key={index} 
              style={cardStyle} 
              onClick={() => nav(card.path)}
            >
              <div style={cardImageContainerStyle}>
                <img 
                  src={card.image} 
                  alt={card.title} 
                  style={cardImageStyle} 
                />
              </div>
              <div style={cardContentStyle}>
                <h3 style={cardTitleStyle}>
                  {card.icon} {card.title}
                </h3>
                <p style={cardDescriptionStyle}>{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default NewCustomerDash;
