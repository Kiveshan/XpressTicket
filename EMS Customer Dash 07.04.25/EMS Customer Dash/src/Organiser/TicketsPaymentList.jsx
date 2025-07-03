import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TicketsPayment.css';

const TicketPaymentList = () => {
  const nav = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        const response = await fetch('http://localhost:5000/api/organizer/ticket-payments', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setPayments(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching payments:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  if (loading) {
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
          <button className="backbutton20" onClick={() => nav('/organiser-dash')}>
            Back
          </button>
        </div>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
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
          <button className="backbutton20" onClick={() => nav('/organiser-dash')}>
            Back
          </button>
        </div>
        <div>Error: {error}</div>
      </div>
    );
  }

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
        <button className="backbutton20" onClick={() => nav('/organiser-dash')}>
          Back
        </button>
      </div>

      <div className="table-container12">
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
            {payments.length === 0 ? (
              <tr>
                <td colSpan="6">No payments found.</td>
              </tr>
            ) : (
              payments.map((item) => (
                <tr key={item.purchase_id}>
                  <td>{item.purchaser_name}</td>
                  <td>{item.number_of_tickets}</td>
                  <td>{item.event_name}</td>
                  <td>{item.package}</td>
                  <td>R {item.amount.toFixed(2)}</td>
                  <td>
                    <button
                      className="view-more"
                      onClick={() => nav(`/ticketspayment/${item.purchase_id}`)}
                    >
                      View More
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketPaymentList;