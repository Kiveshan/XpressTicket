import React from "react";
import "./TicketsRequest.css";
import { useNavigate } from "react-router-dom";

function TicketsRequest() {
  // Sample data for ticket requests
  const ticketRequests = [
    {
      id: 1,
      customerName: "John Doe",

      tickets: 2,
      proofOfPayment: "/proofs/john_doe_payment.pdf",
    },
    {
      id: 2,
      customerName: "Jane Smith",

      tickets: 4,
      proofOfPayment: "/proofs/jane_smith_payment.pdf",
    },
    {
      id: 3,
      customerName: "Alice Johnson",
     
      tickets: 1,
      proofOfPayment: "/proofs/alice_johnson_payment.pdf",
    },
    {
      id: 4,
      customerName: "Bob Williams",
   
      tickets: 3,
      proofOfPayment: "/proofs/bob_williams_payment.pdf",
    },
  ];

  // Function to handle viewing proof of payment
  const handleViewProof = (proofUrl) => {
    window.open(proofUrl, "_blank");
  };

const nav = useNavigate(); // Initialize useNavigate for navigation

  return (
    <div className="tickets-request-container">
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
        <button className="backbutton20" onClick={() => nav("/tickets-event-list")}>
          Back
        </button>
      </div>

      <h2 className="tickets-request-title">Tickets Request</h2>
      <table className="tickets-request-table">
        <thead>
          <tr>
            <th>Customer Name</th>
            <th>Number of Tickets</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {ticketRequests.map((request) => (
            <tr key={request.id}>
              <td>{request.customerName}</td>
              <td>{request.tickets}</td>
              <td>
                <button
                  className="view-proof-button"
                  onClick={() => handleViewProof(request.proofOfPayment)}
                >
                  View Proof
                </button>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <button
                  className="view-proof-button"
                >
                  Approve
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TicketsRequest;
