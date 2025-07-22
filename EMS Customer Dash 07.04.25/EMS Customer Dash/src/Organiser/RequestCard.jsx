import React from "react";
import { useNavigate } from "react-router-dom";
import "../Organiser/OrganiserDash.css";
import "./RequestCard.css";

const RequestCard = () => {
  const navigate = useNavigate();

  const cards = [
    { label: "Host Request", image: "/wedding-wedding-day-marriage-marry-161018.jpeg", path: "/event-request" },
    { label: "Tickets per event", image: "/ticket-2974645_1920.jpg", path: "/tickets-event-list" },
  ];

  return (
    <div className="modern-container">
      {/* Modern Header with Gradient */}
      <header className="modern-header">
        <div className="header-left">
          <button className="modern-button" onClick={() => navigate("/organiser-dash")}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <img
            src="/XPRESS TICKETS LOGO2.png"
            alt="EventXpress Logo"
            className="header-logo"
          />
        </div>
        <h1 className="header-title">Request Actions</h1>
        <button
          className="modern-button"
          onClick={() => {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("userId");
            sessionStorage.removeItem("user");
            navigate("/");
          }}
        >
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </header>
      <br></br>
      <br></br>
      <br></br>
      <br></br>

      {/* Main Content */}
      <main className="modern-main">
        <div className="modern-card-body">
          <div className="modern-card-grid">
            {cards.map((card, index) => (
              <div
                className="modern-action-card"
                key={index}
                onClick={() => navigate(card.path)}
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