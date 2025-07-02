import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SystemUsers.css';

const SystemUsers = () => {
  const nav = useNavigate();
  const [activeTable, setActiveTable] = useState('Organiser');
  const [generalUsers, setGeneralUsers] = useState([]);
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

    // Fetch general users (users without events)
    const fetchGeneralUsers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users-without-events`);
        // Ensure response.data is an array
        if (Array.isArray(response.data)) {
          setGeneralUsers(response.data);
        } else {
          console.error('API response is not an array:', response.data);
          setGeneralUsers([]);
        }
      } catch (error) {
        console.error('Error fetching general users:', error);
        setGeneralUsers([]);
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
    fetchGeneralUsers();
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
            {Array.isArray(organisers) && organisers.length > 0 ? organisers.map((organiser, index) => (
              <tr key={`organiser-${organiser.user_id}-${index}`}>
                <td>{`${organiser.firstname} ${organiser.surname}`}</td>
                <td>{organiser.email}</td>
                <td>{organiser.event_name}</td>
                <td>{organiser.formatted_date || new Date(organiser.startdate).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => nav('/viewingorganiser', { state: { userId: organiser.user_id } })}>View</button>
                </td>
              </tr>
            )) : <tr key="no-organisers"><td colSpan="5">No organizers found</td></tr>}
          </tbody>
        </table>
      );
    } else if (activeTable === 'General Users') {
      return (
        <table className="package-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(generalUsers) && generalUsers.length > 0 ? generalUsers.map((user, index) => (
              <tr key={`user-${user.user_id}-${index}`}>
                <td>{`${user.firstname} ${user.surname}`}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button onClick={() => nav('/viewingcustomer', { state: { userId: user.user_id } })}>View</button>
                </td>
              </tr>
            )) : <tr key="no-users"><td colSpan="4">No general users found</td></tr>}
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
            {Array.isArray(payments) && payments.length > 0 ? payments.map((payment, index) => (
              <tr key={`payment-${payment.payment_id}-${index}`}>
                <td>{`${payment.firstname} ${payment.surname}`}</td>
                <td>{payment.email}</td>
                <td>{payment.event_name}</td>
                <td>{payment.amount}</td>
                <td>{payment.payment_date}</td>
                <td>
                  <button onClick={() => alert(`Viewing details for ${payment.firstname} ${payment.surname}`)}>View</button>
                </td>
              </tr>
            )) : <tr key="no-payments"><td colSpan="6">No payments found</td></tr>}
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
          className={`customer-button tab-button ${activeTable === 'General Users' ? 'active' : ''}`}
          onClick={() => setActiveTable('General Users')}
        >
          General Users
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