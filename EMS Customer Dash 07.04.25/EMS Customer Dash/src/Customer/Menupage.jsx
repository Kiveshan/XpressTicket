import React from 'react';
import "./Menupage.css"
import { useNavigate } from 'react-router-dom';

function Menupage (){
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
       
        <main className="dashboard-main" style={{ gap: '100px' }}>
          <div 
            className="card" 
            onClick={()=> nav("/organiser-dash")} 
            style={{
              height: '200px',
              width: '200px',
              padding: '10px',
              border: '2px solid #20c997',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              marginTop: '-110px'
            }}
          >
            <img 
              src="/Organiser.jpg" 
              alt="Organiser" 
              style={{
                height: '120px',
                width: '170px',
                maxWidth: '170px',
                marginBottom: '3px'
              }}
            />
            <p>Organiser</p>
          </div>
          <div 
            className="card" 
            onClick={()=> nav("/customerdash")}  
            style={{
              height: '200px',
              width: '200px',
              padding: '10px',
              border: '2px solid #20c997',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              marginTop: '-110px'
            }}
          >
            <img 
              src="/Customer.jpg" 
              alt="Customer" 
              style={{
                height: '120px',
                width: '170px',
                maxWidth: '170px',
                marginBottom: '3px'
              }}
            />
            <p>Customer</p>
          </div>
        </main>
      </div>
    );
  };
export default Menupage;
