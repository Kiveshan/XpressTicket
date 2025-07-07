import React from 'react';
import "../Customer/Form.css";
import { useNavigate } from 'react-router-dom';


function AdminDash (){
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
<br />

        <main className="dashboard-main">
        
          <div className="card" onClick={()=> nav('/event-approval')} >
            <img src="/pexels-photo-2774556.jpeg" alt="Events" />
            <p>Events</p>
          </div>
          <div className="card"onClick={()=> nav('/users')} >
            <img src="/pexels-photo-5077038.jpeg" alt="Users" />
            <p>Users</p>
          </div>
        </main>
      </div>
    );
  };
export default AdminDash;