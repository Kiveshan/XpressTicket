import React from "react";
import { useNavigate } from "react-router-dom";
import '../shared/ModernDashboard.css';
import { FaSignOutAlt, FaArrowLeft, FaCalendarPlus, FaClipboardList, FaChartBar, FaMoneyBillWave } from 'react-icons/fa';

const OrganiserDash = () => {
  const nav = useNavigate();

  const cards = [
    { label: "Host", image: "/wedding-wedding-day-marriage-marry-161018.jpeg", path: "/event-form" },
    { label: "Requests", image: "/pexels-photo-7163361.jpeg", path: "/requestcard" },
    { label: "Analytics", image: "/pexels-photo-185576.jpeg", path: "/analytics" },
    { label: "Payments", image: "/Customer2.jpg", path: "/ticketspaymentlist" },
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
        <h1 className="modern-page-title">Organizer Dashboard</h1>
        
        {/* Card Grid */}
        <div className="modern-card-grid">
          {organizerCards.map((card, index) => (
            <div 
              key={index} 
              className="modern-card" 
              onClick={() => nav(card.path)}
            >
              <div className="modern-card-image-container">
                <img 
                  src={card.image} 
                  alt={card.title} 
                  className="modern-card-image" 
                />
              </div>
              <div className="modern-card-content">
                <h3 className="modern-card-title">
                  {card.icon} {card.title}
                </h3>
                <p className="modern-card-description">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default OrganiserDash;
