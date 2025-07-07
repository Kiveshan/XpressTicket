import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/ModernDashboard.css';
import { FaSignOutAlt, FaUsers, FaCalendarCheck } from 'react-icons/fa';

function AdminDash() {
  const nav = useNavigate();
  
  // Admin dashboard cards with more details
  const adminCards = [
    {
      title: "Events pending approval",
      description: "Review and approve event requests from organizers",
      image: "/pexels-photo-2774556.jpeg",
      path: "/event-approval",
      icon: <FaCalendarCheck />
    },
    {
      title: "Events approved/rejected",
      description: "View history of processed event requests",
      image: "/pexels-photo-2774556.jpeg",
      path: "/events-history",
      icon: <FaCalendarCheck />
    },
    {
      title: "User Management",
      description: "Manage system users, roles and permissions",
      image: "/pexels-photo-5077038.jpeg",
      path: "/users",
      icon: <FaUsers />
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

      {/* Back Button - Original Style */}
      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav('/')}>
          Back
        </button>
      </div>

      {/* Main Content */}
      <main className="modern-main-content">
        <h1 className="modern-page-title">Admin Dashboard</h1>
        

        
        {/* Card Grid */}
        <div className="modern-card-grid">
          {adminCards.map((card, index) => (
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
export default AdminDash;