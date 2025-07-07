import React from 'react';
import "./CustomerDash.css";
import { useNavigate } from 'react-router-dom';


function CustomerDash (){
  const nav= useNavigate();
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

<div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav("/mainmenu")}>
          Back
        </button>
      </div>
      
        <main className="dashboard-main">
        
          <div className="card" onClick={()=> nav('/eventmenu')} >
            <img src="/Organiser.jpg" alt="Organiser" />
            <p>Book an event</p>
          </div>
          <div className="card"onClick={()=> nav('/reviewparchase')} >
            <img src="/Customer.jpg" alt="Customer" />
            <p>Review Purchases</p>
          </div>
        </main>
      </div>
    );
  };
export default CustomerDash;
