import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerUploadPOP.css';


const TicketsList = () => {
  const nav = useNavigate();

  return (
    <div className="receipt-container2">
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
        <button className="backbutton20" onClick={() => nav("/tickets")}>
          Back
        </button>
      </div>
      <br />
      <div className="conference-info">
        <img src="ICTAS.png" alt="ICTAS Logo" className="ictas-logo" />
        <h3>
          9TH ANNUAL IEEE CONFERENCE ON INFORMATION COMMUNICATION TECHNOLOGY &
          SOCIETY (ICTAS 2025)
        </h3>
      </div>

      
<div className="table-container5">
  <table className="table">
    <thead>
         <tr className="bg-teal-100 text-sm">
              <th className="p-2 border">Package Details</th>
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Gender</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Phone Number</th>
              <th className="p-2 border">Action</th>
      </tr>
    </thead>
    
    <tbody>
      <tr className="bg-white">
                <td className="p-2 border">Conference Delegate</td>
              <td className="p-2 border">Prof</td>
              <td className="p-2 border">Rorrik Shaun</td>
              <td className="p-2 border">Male</td>
              <td className="p-2 border">rorrikshaun@gmail.com</td>
              <td className="p-2 border">0828529658</td>
              <td className="p-2 border"><button className='viewticket'onClick={() => nav('/viewtickets')} >View</button></td>
      </tr>
    </tbody>
  </table>
</div>

   </div>
  );
};

export default TicketsList;
