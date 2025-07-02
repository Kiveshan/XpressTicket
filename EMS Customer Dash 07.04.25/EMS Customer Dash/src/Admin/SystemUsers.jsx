import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SystemUsers.css';

const SystemUsers = () => {
  const nav = useNavigate();
  const [activeTable, setActiveTable] = useState('Organiser');
  const [organisers, setOrganisers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Define the API base URL
    const API_BASE_URL = 'http://localhost:5000'; // Server is running on port 5000
    
    // Fetch organizers with events
    const fetchOrganisers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users-with-events`);
        // Ensure response.data is an array
        if (Array.isArray(response.data)) {
          setOrganisers(response.data);
        } else {
          console.error('API response is not an array:', response.data);
          setOrganisers([]);
        }
      } catch (error) {
        console.error('Error fetching organisers:', error);
        setOrganisers([]);
      }
    };

    // Fetch customers
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/customers`);
        // Ensure response.data is an array
        if (Array.isArray(response.data)) {
          setCustomers(response.data);
        } else {
          console.error('API response is not an array:', response.data);
          setCustomers([]);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        setCustomers([]);
      }
    };

    // Fetch payments
    const fetchPayments = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/payments`);
        // Ensure response.data is an array
        if (Array.isArray(response.data)) {
          setPayments(response.data);
        } else {
          console.error('API response is not an array:', response.data);
          setPayments([]);
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
        setPayments([]);
      }
    };

    fetchOrganisers();
    fetchCustomers();
    fetchPayments();
    setLoading(false);
  }, []);

  const renderTable = () => {
    if (loading) {
      return <div>Loading...</div>;
    }

    if (activeTable === 'Organiser') {
      return (
        <table className="package-table">
          <thead>
            <tr>
              <th>Organiser Name</th>
              <th>Email</th>
              <th>Event</th>
              <th>DATE OF EVENT</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(organisers) && organisers.length > 0 ? organisers.map((organiser) => (
              <tr key={organiser.user_id}>
                <td>{`${organiser.firstname} ${organiser.surname}`}</td>
                <td>{organiser.email}</td>
                <td>{organiser.event_name}</td>
                <td>{organiser.startdate}</td>
                <td>
                  <button onClick={() => nav('/viewingorganiser', { state: { userId: organiser.user_id } })}>View</button>
                </td>
              </tr>
            )) : <tr><td colSpan="5">No organizers found</td></tr>}
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
            {Array.isArray(customers) && customers.length > 0 ? customers.map((customer) => (
              <tr key={customer.user_id}>
                <td>{`${customer.firstname} ${customer.surname}`}</td>
                <td>{customer.email}</td>
                <td>{customer.created_at}</td>
                <td>
                  <button onClick={() => nav('/viewingcustomer')}>View</button>
                </td>
              </tr>
            )) : <tr><td colSpan="4">No customers found</td></tr>}
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
            {Array.isArray(payments) && payments.length > 0 ? payments.map((payment) => (
              <tr key={payment.payment_id}>
                <td>{`${payment.firstname} ${payment.surname}`}</td>
                <td>{payment.email}</td>
                <td>{payment.event_name}</td>
                <td>{payment.amount}</td>
                <td>{payment.payment_date}</td>
                <td>
                  <button onClick={() => alert(`Viewing details for ${payment.name}`)}>View</button>
                </td>
              </tr>
            )) : <tr><td colSpan="6">No payments found</td></tr>}
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