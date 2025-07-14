import React from 'react';
import { useNavigate } from 'react-router-dom';
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
      <style>
        {`
          /* Modern Dashboard Shared Styles */
          .modern-dashboard-container {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            background-color: #f8f9fa;
            font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
          }

          /* Header styles */
          .modern-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 25px;
            background-color: white;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            position: sticky;
            top: 0;
            z-index: 100;
          }

          .modern-logo {
            height: 60px;
          }

          .modern-header-actions {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          /* Logout button */
          .modern-logout-btn {
            background-color: transparent;
            color: #4ca1af;
            border: 1px solid #4ca1af;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.9rem;
          }

          .modern-logout-btn:hover {
            background-color: #4ca1af;
            color: white;
          }

          /* Back button */
          .back-button-container1 {
            margin: 15px 25px;
          }

          .backbutton20 {
            background-color: transparent;
            color: #2c3e50;
            border: 1px solid #2c3e50;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.9rem;
          }

          .backbutton20:hover {
            background-color: #2c3e50;
            color: white;
          }

          /* Main content area */
          .modern-main-content {
            flex: 1;
            padding: 20px 25px;
          }

          /* Page title */
          .modern-page-title {
            font-size: 32px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 30px;
            position: relative;
            padding-bottom: 10px;
          }

          .modern-page-title:after {
            content: '';
            position: absolute;
            left: 0;
            bottom: 0;
            height: 4px;
            width: 60px;
            background-color: #20c997;
            border-radius: 2px;
          }

          /* Card grid */
          .modern-card-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 25px;
            margin-top: 20px;
          }

          /* Modern card */
          .modern-card {
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            cursor: pointer;
            position: relative;
            max-height: 300px; /* Constrain card height */
            min-height: 250px; /* Ensure uniform height */
            display: flex;
            flex-direction: column;
          }

          .modern-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
          }

          .modern-card-image-container {
            height: 120px; /* Fixed height for image */
            overflow: hidden;
            position: relative;
            flex-shrink: 0; /* Prevent image container from shrinking */
          }

          .modern-card-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
          }

          .modern-card:hover .modern-card-image {
            transform: scale(1.05);
          }

          .modern-card-content {
            padding: 12px;
            flex: 1; /* Take remaining space */
            display: flex;
            flex-direction: column;
            justify-content: flex-start; /* Align content to top */
          }

          .modern-card-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px; /* Align icon and title */
          }

          .modern-card-description {
            font-size: 14px;
            color: #666;
            line-height: 1.5;
            margin: 0; /* Remove default margins */
            display: -webkit-box;
            -webkit-line-clamp: 2; /* Limit to 2 lines */
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis; /* Add ellipsis for overflow */
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .modern-card-grid {
              grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            }
          }
        `}
      </style>

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