import React from "react";
import { useNavigate } from "react-router-dom";
import "./ParchasedTicket.css";


const ticketData = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    tickets: 2,
    date: "2025-04-10",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    tickets: 4,
    date: "2025-04-12",
  },
];

const ParchasedTicket = () => {
    const nav = useNavigate();
 
  return (
    <>
    <header className="dashboard-header4">
        <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="dashboard-logo" />
        <div className="profile-section">
              <button className="backbutton22" onClick={()=> nav('/')}>LogOut </button>
          </div>
      </header>

      <div className="back-button-container">
    <button className="back-button8" onClick={()=> nav("/customerdash")}>Back</button>
  </div>
  
    <div className="ticket-container">
      
      <div className="table-wrapper1">
        <table className="ticket-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Tickets</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ticketData.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.name}</td>
                <td>{ticket.email}</td>
                <td>{ticket.tickets}</td>
                <td>{ticket.date}</td>
                <td>
                  <button
                    className="btn btn-primary"
                    
                    onClick={() => nav("/view-more-details")}
                  >
                    View More
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => nav("/viewinvoice")}
                  >
                    View Invoice
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
};


export default ParchasedTicket;
