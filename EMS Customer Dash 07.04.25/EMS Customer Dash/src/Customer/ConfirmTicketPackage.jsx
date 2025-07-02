import React, { useState } from 'react';
import './ConfirmTicketPackage.css';
import { useNavigate } from 'react-router-dom';

const ConfirmTicketPackage = () => {
  const nav = useNavigate();
  const [showModal, setShowModal] = useState(false); // ✅ Add missing state
  const [packages, setPackages] = useState([
    {
      packageDetails: 'Conference Delegate',
      title: 'Prof',
      name: 'Ronrik Shaun',
      gender: 'Male',
      email: 'ronrikshaun@gmail.com',
      phone: '0828529658',
      delegation: 'Key Note Speaker',
      tickets: 1,
      ieeeNumber: '02541',
      dayPass: '',
      amount: 'R 7 000,00'
    },
    {
      packageDetails: 'Day Pass',
      title: 'Dr',
      name: 'New Person',
      gender: 'Female',
      email: 'newguye@gmail.com',
      phone: '0316536451',
      delegation: 'Guest',
      tickets: 1,
      ieeeNumber: '56352',
      dayPass: '27/08/2025 - 29/08/2025',
      amount: 'R 2 000'
    }
  ]);

  const handleAddPackage = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const packageOptions = [
    { name: 'Conference Delegate', price: 'R 7,000.00' , path: '/customerticketdetails1' },
    { name: 'Day Pass', price: 'R 2,000.00', path: '/customer-ticket-details2' },
    { name: 'Student Package', price: 'R 3,500.00', path: '/customer-ticket-details3' }
  ];

  return (
    <div className="payment-container">
      <header className="dashboard-header">
        <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="dashboard-logo" />
        <div className="profile-section">
              <button className="backbutton22" onClick={()=> nav('/')}>LogOut </button>
          </div>
      </header>
      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav("/eventticketpackage")}>
          Back
        </button>
      </div>
      <div className="event-details1">
        <div className="conference-info1">
          <img src="ICTAS.png" alt="ICTAS Logo" className="ictas-logo" />
          <h3>9TH ANNUAL IEEE CONFERENCE ON INFORMATION COMMUNICATION TECHNOLOGY & SOCIETY (ICTAS 2025)</h3>
        </div>
      </div>

      <h2>Confirm Tickets</h2>

      <table className="package-table">
        <thead>
          <tr>
            <th>Package Details</th>
            <th>Title</th>
            <th>Name</th>
            <th>Gender</th>
            <th>Email</th>
            <th>Phone Number</th>
            <th>Delegation</th>
            <th>No. of Tickets</th>
            <th>IEEE Number</th>
            <th>Day Pass Duration (if applicable)</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg, index) => (
            <tr key={index}>
              <td>{pkg.packageDetails}</td>
              <td>{pkg.title}</td>
              <td>{pkg.name}</td>
              <td>{pkg.gender}</td>
              <td>{pkg.email}</td>
              <td>{pkg.phone}</td>
              <td>{pkg.delegation}</td>
              <td>{pkg.tickets}</td>
              <td>{pkg.ieeeNumber}</td>
              <td>{pkg.dayPass}</td>
              <td className="currency">{pkg.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="add-package-btn" onClick={handleAddPackage}>
        Add Package
      </button>

      <button className="Submit" onClick={() => nav('/customerviewevent')}>
        Submit
      </button>
      {showModal && (
        <div className="modal1">
          <div className="modal-content1">
            <h3>Select a Package</h3>
            <div className="package-options">
              {packageOptions.map((pkg, index) => (
                <button
                  key={index}
                  className="package-btn"
                  onClick={() => {
                    
                    nav(pkg.path);
                    handleCloseModal();
                  }}
                >
                  <div>{pkg.name}</div>
                  <div>{pkg.price}</div>
                </button>
              ))}
            </div>
            <button
              className="close-modal-btn"
              onClick={handleCloseModal}
              style={{
                marginTop: '20px',
                padding: '8px 16px',
                backgroundColor: '#dc3545'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfirmTicketPackage;
