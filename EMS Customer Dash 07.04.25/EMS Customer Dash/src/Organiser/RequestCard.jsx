// RequestCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../Organiser/OrganiserDash.css";

const RequestCard = () => {
  const nav = useNavigate();

  const cards = [
    { label: "Host Request", image: "/wedding-wedding-day-marriage-marry-161018.jpeg", path: "/event-request" },
    { label: "Ticket Requests", image: "/ticket-2974645_1920.jpg", path: "/tickets-event-list" },
  ];

  return (
    <div className="dashboard-container1">
      <header className="dashboard-header1">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="dashboard-logo1"
        />
        <div className="profile-section">
          <button className="backbutton22" onClick={() => nav("/")}>
            LogOut
          </button>
        </div>
      </header>

      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav("/organiser-dash")}>
          Back
        </button>
      </div>

      <main className="dashboard-main1">
        <div className="cards-section">
          <h2 className="cards-header">Request Actions</h2>
          <div className="card-container2">
            {cards.map((card, index) => (
              <div
                className="card1"
                key={index}
                onClick={() => nav(card.path)}
                style={{ cursor: "pointer" }}
              >
                <img src={card.image} alt={card.label} />
                <div className="label">{card.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RequestCard;