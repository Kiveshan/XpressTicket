import React from 'react';
import './EventTicketPackage.css';
import { useNavigate } from 'react-router-dom';

const EventTicketPackage = () => {
   const nav= useNavigate();  
   const packages = [
    { 
      name: 'Conference Delegate', 
      price: 'R 7 000, 00',
      route: '/customerticketdetails1'  // Unique route
    },
    { 
      name: 'Conference', 
      price: 'R 6 000, 00',
      route: '/customer-ticket-details2'  // Unique route
    },
    { 
      name: 'Day Pass', 
      price: 'R 1 000, 00',
      route: '/customer-ticket-details3'  // Unique route
    },
  ];

  return (
    <div className="dashboard-containe3">
      <header className="dashboard-header3">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="dashboard-logo"
        />
       <div className="profile-section">
              <button className="backbutton22" onClick={()=> nav('/')}>LogOut </button>
          </div>
      </header>
      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav("/customerviewevent")}>
          Back
        </button>
      </div>

      
      <div className="event-details">
      <div className="conference-info">
            <img src="ICTAS.png" alt="ICTAS Logo" className="ictas-logo" />
            <h3>
              9TH ANNUAL IEEE CONFERENCE ON INFORMATION COMMUNICATION TECHNOLOGY & SOCIETY (ICTAS 2025)
            </h3>
        </div>
      </div>
      <section className="pricing-section">
        <h3 className="pricing-title">Choose Your Package</h3>
        <div className="package-grid">
          {packages.map((pkg, index) => (
            <article key={index} className="package-card">
              <div className="package-content">
                <h4 className="package-name">{pkg.name}</h4>
                <div className="price-container">
                  <span className="currency">ZAR</span>
                  <span className="package-price">{pkg.price.slice(2)}</span>
                </div>
                <ul className="package-features">
                  <li>Full conference access</li>
                  <li>Conference materials</li>
                  <li>Daily lunch &amp; snacks</li>
                </ul>
              </div>
              <button className="cta-button" onClick={()=> nav(pkg.route)}>
                Select Package
                <span className="arrow-icon">→</span>
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default EventTicketPackage;
