import React, { useState } from 'react';
import './ConfirmTicketPackage.css';
import '../shared/ModernDashboard.css';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaTimes, FaSignOutAlt } from 'react-icons/fa';

const TicketDetails = () => {
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
    <div className="modern-dashboard-container">
      {/* Modern Header */}
      <header className="modern-header">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="modern-logo"
        />
        <div className="modern-header-actions">
          <button className="modern-logout-btn" onClick={() => nav('/')}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="modern-main-content">
        {/* Back Button */}
        <div className="modern-back-button">
          <button className="modern-btn modern-btn-secondary" onClick={() => nav("/eventticketpackage")}>
            <FaArrowLeft /> Back to Packages
          </button>
        </div>

        {/* Event Header Card */}
        <div className="modern-card">
          <div className="modern-card-header">
            <div className="modern-event-header">
              <div className="modern-event-image">
                <img src="ICTAS.png" alt="ICTAS Logo" className="modern-img-fluid" />
              </div>
              <div className="modern-event-details">
                <h2 className="modern-card-title">9TH ANNUAL IEEE CONFERENCE ON INFORMATION COMMUNICATION TECHNOLOGY & SOCIETY (ICTAS 2025)</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Packages Card */}
        <div className="modern-card">
          <div className="modern-card-header">
            <h3 className="modern-card-title">
              <FaPlus className="modern-icon" /> Ticket Packages
            </h3>
            <button 
              className="modern-btn modern-btn-primary" 
              onClick={handleAddPackage}
            >
              Add Package
            </button>
          </div>
          <div className="modern-card-body">
            <div className="modern-table-responsive">
              <table className="modern-table">
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
                    <th>Day Pass Duration</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.length > 0 ? (
                    packages.map((pkg, index) => (
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
                        <td>{pkg.dayPass || '-'}</td>
                        <td className="modern-text-right">{pkg.amount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className="modern-text-center">
                        <div className="modern-no-data">
                          No packages selected yet
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="modern-card-footer">
            <div className="modern-action-buttons">
              <button className="modern-btn modern-btn-success" onClick={() => nav('/confirm-ticket-package')}>
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Modal */}
      {showModal && (
        <div className="modern-modal">
          <div className="modern-modal-content">
            <div className="modern-modal-header">
              <h3 className="modern-modal-title">Select a Package</h3>
              <button className="modern-modal-close" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modern-modal-body">
              <div className="modern-package-grid">
                {packageOptions.map((pkg, index) => (
                  <div key={index} className="modern-package-card">
                    <div className="modern-package-name">{pkg.name}</div>
                    <div className="modern-package-price">{pkg.price}</div>
                    <button
                      className="modern-btn modern-btn-primary modern-btn-block"
                      onClick={() => {
                        nav(pkg.path);
                        handleCloseModal();
                      }}
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetails;
