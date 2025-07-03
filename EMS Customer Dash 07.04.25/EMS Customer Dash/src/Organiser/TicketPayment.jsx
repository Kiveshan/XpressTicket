import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './TicketsRequest.css';

const TickectPayment = () => {
  const nav = useNavigate();
  const { purchaseId } = useParams();
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/organizer/ticket-payments/${purchaseId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        setPayment(data);
      } catch (error) {
        console.error('Error fetching payment details:', error);
      }
    };
    fetchPaymentDetails();
  }, [purchaseId]);

  const handleStatusUpdate = async (status) => {
    try {
      const response = await fetch(`http://localhost:5000/api/organizer/ticket-payments/${purchaseId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (response.ok) {
        alert(`Payment ${status} successfully`);
        setPayment({ ...payment, status });
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update payment status');
    }
  };

  if (!payment) return <div>Loading...</div>;

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
            <input type="text" value={payment.cellnumber} disabled />
          </div>
          <div>
            <label>Institution Name</label>
            <input type="text" value={payment.institution} disabled />
          </div>
          <div>
            <label>Faculty</label>
            <input type="text" value={payment.faculty_id} disabled />
          </div>
          <div>
            <label>Department</label>
            <input type="text" value={payment.department_id} disabled />
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
              {[
                'Package Details',
                'Title',
                'Name',
                'Gender',
                'Email',
                'Phone Number',
                'No. of Tickets',
                'IEEE Number',
                'Day Pass Duration',
                'Amount',
              ].map((heading) => (
                <th key={heading}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payment.delegate_details.map((delegate, index) => (
              <tr key={index}>
                <td>{delegate.package}</td>
                <td>{delegate.title}</td>
                <td>{delegate.name}</td>
                <td>{delegate.gender}</td>
                <td>{delegate.email}</td>
                <td>{delegate.phone}</td>
                <td>{delegate.number_of_tickets}</td>
                <td>{delegate.ieee_number || ''}</td>
                <td>{delegate.day_pass_duration || ''}</td>
                <td>R {delegate.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="buttons">
        {payment.proof_of_payment && (
          <a
            href={payment.proof_of_payment}
            target="_blank"
            rel="noopener noreferrer"
            className="view-btn"
          >
            View Proof of Payment
          </a>
        )}
        <div className="actions">
          <button
            className="approve"
            onClick={() => handleStatusUpdate('approved')}
            disabled={payment.status === 'approved'}
          >
            Approve
          </button>
          <button
            className="reject"
            onClick={() => handleStatusUpdate('rejected')}
            disabled={payment.status === 'rejected'}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default TickectPayment;