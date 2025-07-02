import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SystemUsers.css'; // <-- External CSS

const SystemUsers = () => {
  const nav = useNavigate();
  const [activeTable, setActiveTable] = useState('Payment');

  const organisers = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', event: 'Tech Summit', createdAt: '2023-03-01' },
    { id: 2, name: 'Bob Williams', email: 'bob@example.com', event: 'Music Festival', createdAt: '2023-04-01' },
  ];

  const customers = [
    { id: 1, name: 'Charlie Brown', email: 'charlie@example.com', event: 'Art Expo', createdAt: '2023-05-01' },
    { id: 2, name: 'Diana Prince', email: 'diana@example.com', event: 'Food Fair', createdAt: '2023-06-01' },
  ];

  const payments = [
    { id: 1, name: 'John Doe', email: 'john@example.com', event: 'ICTAS International Conference', amount: 'R50 000', createdAt: '2023-01-01' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', event: 'Pool Party', amount: 'R20 000', createdAt: '2023-02-01' },
  ];

  const renderTable = () => {
    if (activeTable === 'Organiser') {
      return (
        <table className="package-table">
          <thead>
            <tr>
              <th>Organiser Name</th>
              <th>Email</th>
              <th>Event</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {organisers.map((organiser) => (
              <tr key={organiser.id}>
                <td>{organiser.name}</td>
                <td>{organiser.email}</td>
                <td>{organiser.event}</td>
                <td>{organiser.createdAt}</td>
                <td>
                  <button onClick={() => nav('/viewingorganiser')}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (activeTable === 'Customer') {
      return (
        <table className="package-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Email</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>{customer.createdAt}</td>
                <td>
                  <button onClick={() => nav('/viewingcustomer')}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (activeTable === 'Payment') {
      return (
        <table className="package-table">
          <thead>
            <tr>
              <th>Purchaser Name</th>
              <th>Email</th>
              <th>Event</th>
              <th>Amount</th>
              <th>Created At</th>
              <th>Proof of Payment</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.name}</td>
                <td>{payment.email}</td>
                <td>{payment.event}</td>
                <td>{payment.amount}</td>
                <td>{payment.createdAt}</td>
                <td>
                  <button onClick={() => alert(`Viewing details for ${payment.name}`)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  };

  return (
    <div className="container12">
      <header className="dashboard-header1">
        <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="dashboard-logo1" />
        <div className="profile-section">
          <button className="backbutton22" onClick={() => nav('/')}>LogOut</button>
        </div>
      </header>

      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav("/admin-dash")}>Back</button>
      </div>

      <br />

      <div className="button-group1">
        <button
          className={`organiser-button tab-button ${activeTable === 'Organiser' ? 'active' : ''}`}
          onClick={() => setActiveTable('Organiser')}
        >
          Organiser
        </button>
        <button
          className={`customer-button tab-button ${activeTable === 'Customer' ? 'active' : ''}`}
          onClick={() => setActiveTable('Customer')}
        >
          Customer
        </button>
        <button
          className={`payment-button tab-button ${activeTable === 'Payment' ? 'active' : ''}`}
          onClick={() => setActiveTable('Payment')}
        >
          Payment
        </button>
      </div>

      <br />
      {renderTable()}
    </div>
  );
};

export default SystemUsers;
