import React, { useState, useEffect } from 'react';
import './TicketsPayment.css';
import { useNavigate } from 'react-router-dom';

const TicketPaymentList = () => {
  const nav = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const token = sessionStorage.getItem('token'); // Changed to sessionStorage
        console.log('Token:', token); // Debug token
        if (!token) {
          setError('No authentication token found. Please log in.');
          setLoading(false);
          nav('/'); // Redirect to login page
          return;
        }
        const response = await fetch('http://localhost:5000/api/organiser/ticket-purchases', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setPurchases(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [nav]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

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
      <h2 className="section-title">Ticket Payments</h2>
      <div className="table-container12">
        <table>
          <thead>
            <tr>
              <th>Purchaser Name</th>
              <th>Number of Tickets</th>
              <th>Event</th>
              <th>Package</th>
              <th>Amount</th>
              <th>Proof of Payment</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((item) => (
              <tr key={item.purchase_id}>
                <td>{item.purchaser_name}</td>
                <td>{item.number_of_tickets}</td>
                <td>{item.event_name}</td>
                <td>{item.package}</td>
                <td>R {Number(item.amount).toFixed(2)}</td>
                <td>
                  <button
                    className="view-more"
                    onClick={() => nav(`/ticketspayment/${item.purchase_id}`)}
                  >
                    View More
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketPaymentList;