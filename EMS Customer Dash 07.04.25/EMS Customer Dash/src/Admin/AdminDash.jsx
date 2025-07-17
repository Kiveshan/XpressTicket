import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/ModernDashboard.css';
import './AdminDash.css';
import { FaSignOutAlt, FaUsers, FaCalendarCheck } from 'react-icons/fa';

function AdminDash() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const nav = useNavigate();

  const adminCards = [
    {
      title: 'Events pending approval',
      description: 'Review and approve event requests from organizers',
      image: '/pexels-photo-2774556.jpeg',
      path: '/event-approval',
      icon: <FaCalendarCheck />,
    },
    {
      title: 'Events approved/rejected',
      description: 'View history of processed event requests',
      image: '/pexels-photo-2774556.jpeg',
      path: '/events-history',
      icon: <FaCalendarCheck />,
    },
    {
      title: 'User Management',
      description: 'Manage system users, roles and permissions',
      image: '/pexels-photo-5077038.jpeg',
      path: '/users',
      icon: <FaUsers />,
    },
  ];

  return (
    <div className="modern-dashboard-container">
      {/* Modern Header */}
      <header className="modern-header">
        <div className="header-left">
          <button className="modern-button" onClick={() => nav('/')}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <img
            src="/XPRESS TICKETS LOGO2.png"
            alt="EventXpress Logo"
            className="header-logo"
          />
        </div>
        <div className="modern-header-actions">
          <button className="modern-button" onClick={() => nav('/')}>
            <span className="button-icon">↩</span> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="modern-main-content">
        <h1 className="modern-page-title">Admin Dashboard</h1>

        {/* Square Card Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, 240px)',
            gap: '30px',
            marginTop: '30px',
            justifyContent: 'center',
            maxWidth: '1080px',
            margin: '30px auto 0',
          }}
        >
          {adminCards.map((card, index) => (
            <div
              key={index}
              onClick={() => nav(card.path)}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow:
                  hoveredCard === index
                    ? '0 8px 16px rgba(0,0,0,0.15)'
                    : '0 4px 12px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: hoveredCard === index ? 'translateY(-5px)' : 'translateY(0)',
                height: '240px',
                width: '240px',
                margin: '0',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '130px',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={card.image}
                  alt={card.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
              <div
                style={{
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  flex: 1,
                }}
              >
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: '0 0 5px 0',
                    color: '#2c3e50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: '#4ca1af' }}>{card.icon}</span> {card.title}
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    margin: '0',
                    color: '#666',
                    lineHeight: '1.3',
                  }}
                >
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default AdminDash;