import React from 'react';
import './TicketsPayment.css';
import { useNavigate } from 'react-router-dom';


const data = [
    {
      name: "Rorrick Shaun",
      tickets: 2,
      event: "ICTAS International Conference",
      package: "Conference Delegate",
      amount: "R9 000,00",
    },
  ];
  
const TickectPaymentList = () => {
    const nav = useNavigate();
  return (
    <div className="container">
       <header className="dashboard-header1">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="dashboard-logo1"
        />
        <div className="profile-section">
          Profile <span className="profile-icon">👤</span>
        </div>
      </header>

      <div className="back-button-container1">
        <button className="backbutton20" onClick={()=> nav('/organiser-dash')}>
          Back
        </button>
      </div>
      <div className="table-container12 ">
        <table>
          <thead>
            <tr>
              <th>Purchaser name</th>
              <th>Number of Tickets</th>
              <th>Event</th>
              <th>Package</th>
              <th>Amount</th>
              <th>Proof of Payment</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.tickets}</td>
                <td>{item.event}</td>
                <td>{item.package}</td>
                <td>{item.amount}</td>
                <td>
                  <button className="view-more" onClick={()=> nav('/ticketspayment')} >View More</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default TickectPaymentList;
