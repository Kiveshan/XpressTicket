import React from 'react';
import "./ReviewParchase.css";
import { useNavigate } from 'react-router-dom';

function ReviewParchase() {
   const nav = useNavigate();

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
      
      <br />
      
      {/* Back Button */}
      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav("/customerdash")}>
          Back
        </button>
      </div>

      <main className="dashboard-main1">
        <div className="event-grid2">
          {/* Event Card 1 */}
          <div className="event-card" onClick={() => nav('/parchasedticket')}>
            <img src="/pexels-photo-7723831.jpeg" alt="HOD Party" className="event-image" />
            <div className="event-details">
              <h3 className='titleh' style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>HOD Party Celebration </h3>
              <p className='eventinfo23'>📍 Amanzimtoti | 📅 29 Febuary | 💰 R 12 000 | ⏰ 9 am</p>
            </div>
          </div>

          {/* Event Card 2 */}
          <div className="event-card" onClick={() => nav('/parchasedticket')}>
            <img src="/pexels-photo-9729879.jpeg" alt="Conference B" className="event-image" />
            <div className="event-details">
              <h3 className='titleh' style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>Conference B</h3>
              <p className='eventinfo23'>📍 Durban | 📅 30 March | 💰 R 250 | ⏰ 9 am</p>
            </div>
          </div>

          {/* Event Card 3 */}
          <div className="event-card" onClick={() => nav('/parchasedticket')}>
            <img src="/ICTAS.png" alt="ICTAS" className="event-image" />
            <div className="event-details">
              <h3 className='titleh' style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>ICTAS</h3>
              <p className='eventinfo23'> 📍 Umhlanga | 📅 29 Febuary | 💰 R 12 000 | ⏰ 9 am</p>
            </div>
          </div>

          {/* Event Card 4 */}
          <div className="event-card">
            <img src="/pexels-photo-9729879.jpeg" alt="Conference B" className="event-image" />
            <div className="event-details">
              <h3 className='titleh'  style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>Conference B</h3>
              <p className='eventinfo23'>📍 Durban | 📅 30 March | 💰 R 250 | ⏰ 9 am</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ReviewParchase;
