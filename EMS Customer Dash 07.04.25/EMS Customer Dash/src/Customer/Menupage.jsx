import React from 'react';
import "./Menupage.css"
import { useNavigate } from 'react-router-dom';

function Manupage (){
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
       
        <main className="dashboard-main">
          <div className="card" onClick={()=> nav("/organiser-dash")} >
            <img src="/Organiser.jpg" alt="Organiser" />
            <p>Organiser</p>
          </div>
          <div className="card" onClick={()=> nav("/customerdash")}  >
            <img src="/Customer.jpg" alt="Customer" />
            <p>Customer</p>
          </div>
        </main>
      </div>
    );
  };
export default Manupage;
