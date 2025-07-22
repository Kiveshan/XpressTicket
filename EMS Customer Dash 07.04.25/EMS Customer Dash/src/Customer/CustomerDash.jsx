import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/ModernDashboard.css';
import './CustomerDash.css';
import { FaSignOutAlt, FaArrowLeft, FaTicketAlt, FaShoppingBag } from 'react-icons/fa';


function CustomerDash() {
  const nav = useNavigate();
  
  // Inline styles with !important to override any CSS
  const cardStyle = {
    maxHeight: '200px',
    height: 'auto',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden'
  };
  
  const imageContainerStyle = {
    height: '60px',
    maxHeight: '60px',
    minHeight: '60px',
    overflow: 'hidden'
  };
  
  const contentStyle = {
    padding: '8px',
    maxHeight: '80px'
  };
  
  const titleStyle = {
    marginBottom: '2px',
    fontSize: '15px',
    lineHeight: '1.2'
  };
  
  const descriptionStyle = {
    fontSize: '12px',
    lineHeight: '1.2',
    marginBottom: '0'
  };
  
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
        <button className="modern-back-btn" onClick={() => nav('/mainmenu')}>
          <FaArrowLeft /> Back to Main Menu
        </button>
      </div>

      {/* Main Content */}
      <main className="modern-main-content">
        <h1 className="modern-page-title">Customer Dashboard</h1>
        
        {/* Card Grid */}
        <div className="modern-card-grid">
          {customerCards.map((card, index) => (
            <div 
              key={index} 
              className="modern-card" 
              onClick={() => nav(card.path)}
              style={cardStyle}
            >
              <div className="modern-card-image-container" style={imageContainerStyle}>
                <img 
                  src={card.image} 
                  alt={card.title} 
                  className="modern-card-image" 
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              </div>
              <div className="modern-card-content" style={contentStyle}>
                <h3 className="modern-card-title" style={titleStyle}>
                  {card.icon} {card.title}
                </h3>
                <p className="modern-card-description" style={descriptionStyle}>
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
    );
  };
export default CustomerDash;
