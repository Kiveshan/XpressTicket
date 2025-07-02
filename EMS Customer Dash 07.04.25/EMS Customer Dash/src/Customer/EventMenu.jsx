import React from 'react';
import "./EventMenu.css";
import { useNavigate } from 'react-router-dom';

function EventMenu() {
  const nav = useNavigate();

  // Sample event data
  const events = [
    {
      id: 1,
      name: "ICTAS",
      location: "Ballito",
      date: "23 June",
      price: "R 1 000",
      time: "9 am",
      image: "/ICTAS.png",
      link: "/customerviewevent",
    },
    {
      id: 2,
      name: "Conference B",
      location: "Durban",
      date: "20 March",
      price: "R 250",
      time: "9 am",
      image: "/ConferenceB.png",
      link: "/customerviewevent2",
    },
   
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="dashboard-logo"
        />
        <div className="profile-section">
              <button className="backbutton22" onClick={()=> nav('/')}>LogOut </button>
          </div>
      </header>
    
      {/* Back Button */}
            <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav("/customerdash")}>
          Back
        </button>
      </div>
      <main className="dashboard-main1">
        <div className="event-grid">
          {/* Map through events to generate event cards */}
          {events.map((event) => (
            <div
              key={event.id}
              className="event-card"
              onClick={() => nav(event.link)}
            >
              <img src={event.image} alt={event.name} className="event-image" />
              <div className="event-details">
                <h3 className='eventname' style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
                  {event.name}
                </h3>
                <p className='event-infor'>
                  📍 {event.location} | 📅 {event.date} | 💰 {event.price} | ⏰ {event.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default EventMenu;
