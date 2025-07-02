import React from "react";
import "./ViewTicket.css";
import { useNavigate } from 'react-router-dom';

const attendeeList = [
  {
    name: "Rorrick Shaun",
    title: "Professor",
    conferenceName: "ICTAS International Conference",
    ticketType: "Conference Delegate",
    date: "June 23 2025 - June 25 2025",
    venue: "Capital Zimbali Hotel",
    address: "5 Corkwood Drive, Zimbali Coastal Resort, Ballito",
    institution: "UKZN",
    faculty: "Accounting and Informatics",
    department: "Information System",
    ieeeNumber: "0123",
    phone: "082 145 2874",
    email: "rorrik@gmail.com",
    amount: "R7 000,00",
    ticketNumber: "XXXXXX",
    purchaseDate: "01 February 2025",
    paperNumber: "5678",
    qrCode: "qrcode.jpg",
    eventImage: "ICTAS.png",
    logo: "DUT-logo.jpg"
  }
];

const ViewTicket = () => {
  const nav = useNavigate();
  const attendee = attendeeList[0];

  return (
    <div className="outerbtn">
      <div className="ticket-container">
        {/* Left Section */}
        <div className="ticket-left">
          <h1 className="ticket-title">
            {attendee.name} <span className="ticket-subtitle">({attendee.title})</span>
          </h1>

          <div className="ticket-content">
            <h2 className="ticket-heading">{attendee.conferenceName}</h2>
            <ul className="ticket-details">
              <li><strong>Ticket Type:</strong> {attendee.ticketType}</li>
              <li><strong>Date:</strong> {attendee.date}</li>
              <li><strong>Venue:</strong> {attendee.venue}</li>
              <li><strong>Address:</strong> {attendee.address}</li>
              <li><strong>Institution Name:</strong> {attendee.institution}</li>
              <li><strong>Faculty:</strong> {attendee.faculty}</li>
              <li><strong>Department:</strong> {attendee.department}</li>
              <li><strong>IEEE Number:</strong> {attendee.ieeeNumber}</li>
              <li><strong>Phone:</strong> {attendee.phone}</li>
              <li><strong>Email:</strong> {attendee.email}</li>
            </ul>

            <div className="ticket-total">
              Total: <span className="ticket-amount">{attendee.amount}</span>
            </div>
            <p className="ticket-number">Ticket Number: {attendee.ticketNumber}</p>
          </div>

          <div className="ticket-footer">
            <p>Purchase Date: {attendee.purchaseDate}</p>
            <p>Accepted Paper Number: {attendee.paperNumber}</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="ticket-right">
          <img
            src={attendee.qrCode}
            alt="QR Code"
            className="ticket-qr"
          />
          <img
            src={attendee.eventImage}
            alt="Event image"
            className="ticket-logo2"
          />
          <div className="ticket-barcode"></div>
          <img
            src={attendee.logo}
            alt="DUT Logo"
            className="ticket-logo"
          />
        </div>
      </div>
      <div className="ticket-buttons">
        <button className="btn btn-back" onClick={() => nav('/ticketslist')}>Back</button>
        <button className="btn btn-download">Download</button>
      </div>
    </div>
  );
};

export default ViewTicket;
