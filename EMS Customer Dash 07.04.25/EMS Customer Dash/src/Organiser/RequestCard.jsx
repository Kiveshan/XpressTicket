// RequestCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../Organiser/OrganiserDash.css";
import "./RequestCard.css";

const RequestCard = () => {
  const nav = useNavigate();

  const cards = [
    { label: "Host Request", image: "/wedding-wedding-day-marriage-marry-161018.jpeg", path: "/event-request" },
    { label: "Tickets per event", image: "/ticket-2974645_1920.jpg", path: "/tickets-event-list" },
  ];

  return (
    <div className="modern-container">
      {/* Modern Header with Gradient */}
      <header className="modern-header">
        <div className="header-left">
          <button className="modern-button" onClick={() => nav("/organiser-dash")}>
            <span className="button-icon">←</span> Back
          </button>
          <img
            src="/XPRESS TICKETS LOGO2.png"
            alt="EventXpress Logo"
            className="header-logo"
          />
        </div>
        <h1 className="header-title">Request Actions</h1>
        <button className="modern-button" onClick={() => nav("/")}>
          <span className="button-icon">↩</span> Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="modern-main">
        <div className="modern-card-body">
          <div className="modern-card-grid">
            {cards.map((card, index) => (
              <div
                className="modern-action-card"
                key={index}
                onClick={() => nav(card.path)}
              >
                <div className="modern-action-card-image-container">
                  <img src={card.image} alt={card.label} className="modern-action-card-image" />
                  <div className="modern-action-card-overlay">
                    <h3 className="modern-action-card-title">{card.label}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RequestCard;