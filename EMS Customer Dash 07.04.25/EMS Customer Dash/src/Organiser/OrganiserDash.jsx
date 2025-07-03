import React from "react";
import { useNavigate } from "react-router-dom";
import "../Organiser/OrganiserDash.css";

const OrganiserDash = () => {
  const nav = useNavigate(); // 👈 required for the back button

  const cards = [
    { label: "Host", image: "/wedding-wedding-day-marriage-marry-161018.jpeg", path: "/event-form" },
    { label: "Requests", image: "/pexels-photo-7163361.jpeg", path: "/requestcard" },
    { label: "Analytics", image: "/pexels-photo-185576.jpeg", path: "/event-list" },
    { label: "Payments", image: "/Customer2.jpg", path: "/ticketspaymentlist" },
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
              <button className="backbutton22" onClick={()=> nav('/')}>LogOut </button>
          </div>
      </header>

      
      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav("/mainmenu")}>
          Back
        </button>
      </div>
      <br />

      <main className="dashboard-main1">
      <div className="card-container">
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
      </main>
    </div>
  );
};

export default OrganiserDash;
