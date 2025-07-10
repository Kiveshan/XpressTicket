import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './TicketsRequest.css';
 
const TicketPayment = () => {
  const nav = useNavigate();
  const { purchaseId } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const token = sessionStorage.getItem('token');
        console.log('Token:', token);
        if (!token) {
          setError('No authentication token found. Please log in.');
          setLoading(false);
          nav('/');
          return;
        }
 
        const response = await fetch(`http://localhost:5000/api/organiser/ticket-purchases/${purchaseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
 
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
 
        const data = await response.json();
        console.log('Payment data:', data);
        setPayment(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching payment details:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    fetchPaymentDetails();
  }, [purchaseId, nav]);
 
  const handleStatusUpdate = async (status) => {
    try {
      const token = sessionStorage.getItem('token');
      console.log('Token:', token);
      if (!token) {
        setError('No authentication token found. Please log in.');
        setLoading(false);
        nav('/');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/organiser/ticket-purchases/${purchaseId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (response.ok) {
        alert(`Payment ${status} successfully`);
        setPayment({ ...payment, status });
        nav('/ticketspaymentlist');
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update payment status');
    }
  };
 
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!payment) return <div>No payment data found</div>;
 
  const delegateDetails = Array.isArray(payment.delegate_details) ? payment.delegate_details : [];
 
  return (
    <div className="container">
      <header className="dashboard-header1">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="dashboard-logo1"
        />
        <div className="profile-section">
          <button className="backbutton22" onClick={() => nav('/')}>
            LogOut
          </button>
        </div>
      </header>
 
      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav('/ticketspaymentlist')}>
          Back
        </button>
      </div>
 
      <h2 className="section-title">Purchaser</h2>
 
      <div className="form-card12">
        <div className="form-grid">
          <div>
            <label>Title</label>
            <select value={payment.title || 'Professor'} disabled>
              <option>Professor</option>
              <option>Dr</option>
              <option>Mr</option>
              <option>Ms</option>
            </select>
          </div>
          <div>
            <label>Full name</label>
            <input type="text" value={payment.purchaser_name} disabled />
          </div>
          <div>
            <label>Email</label>
            <input type="email" value={payment.email} disabled />
          </div>
          <div>
            <label>Cell Number</label>
            <input type="text" value={payment.cellnumber || ''} disabled />
          </div>
          <div>
            <label>Institution Name</label>
            <input type="text" value={payment.institution || ''} disabled />
          </div>
          <div>
            <label>Faculty</label>
            <input type="text" value={payment.faculty_name || ''} disabled />
          </div>
          <div>
            <label>Department</label>
            <input type="text" value={payment.department_name || ''} disabled />
          </div>
          <div>
            <label>IEEE Number</label>
            <input type="text" value={payment.ieee_no || ''} disabled />
          </div>
          <div>
            <label>Organ VAT</label>
            <input type="text" value={payment.vat_no || ''} disabled />
          </div>
        </div>
      </div>
 
      <h2 className="section-title">Delegates</h2>
 
      <div className="table-container12">
        <table>
          <thead>
            <tr>
              <th>Package Details</th>
              <th>Title</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>No. of Tickets</th>
              <th>IEEE Number</th>
              <th>Day Pass Duration</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {delegateDetails.length === 0 ? (
              <tr>
                <td colSpan="10">No delegate details available</td>
              </tr>
            ) : (
              delegateDetails.map((delegate, index) => (
                <tr key={index}>
                  <td>{delegate.package || payment.package}</td>
                  <td>{delegate.title || ''}</td>
                  <td>{delegate.name || ''}</td>
                  <td>{delegate.gender || ''}</td>
                  <td>{delegate.email || ''}</td>
                  <td>{delegate.phone || ''}</td>
                  <td>{delegate.number_of_tickets || ''}</td>
                  <td>{delegate.ieee_number || ''}</td>
                  <td>{delegate.day_pass_duration || ''}</td>
                  <td>{delegate.amount ? `R ${delegate.amount.toFixed(2)}` : ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
 
      <div className="buttons">
        {payment.proof_of_payment_url && (
          <a
            href={payment.proof_of_payment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="view-btn"
          >
            View Proof of Payment
          </a>
        )}
        {payment.status === 'pending' && (
          <div className="actions">
            <button
              className="approve"
              onClick={() => handleStatusUpdate('Approved')}
            >
              Approve
            </button>
            <button
              className="reject"
              onClick={() => handleStatusUpdate('Rejected')}
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
 
export default TicketPayment;
 