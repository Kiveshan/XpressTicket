import React, { useState, useEffect } from 'react';
import './TicketsRequest.css';
import { useNavigate, useParams } from 'react-router-dom';

const TicketPayment = () => {
  const nav = useNavigate();
  const { purchaseId } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const token = sessionStorage.getItem('token'); // Changed to sessionStorage
        console.log('Token:', token); // Debug token
        if (!token) {
          setError('No authentication token found. Please log in.');
          setLoading(false);
          nav('/'); // Redirect to login page
          return;
        }
        const response = await fetch(`http://localhost:5000/api/organiser/ticket-purchases/${purchaseId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setPurchase(data);
        setLoading(false);
      } catch (err) {
        setPN / AError(err.message);
        setLoading(false);
      }
    };

    fetchPurchase();
  }, [purchaseId, nav]);

  const handleStatusUpdate = async (status) => {
    try {
      const token = sessionStorage.getItem('token'); // Changed to sessionStorage
      console.log('Updating status with token:', token); // Debug token
      if (!token) {
        alert('No authentication token found. Please log in.');
        nav('/');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/organiser/ticket-purchases/${purchaseId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      setPurchase({ ...purchase, status: result.purchase.status });
      alert(`Ticket purchase ${status.toLowerCase()} successfully`);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleViewProofOfPayment = () => {
    if (purchase?.proof_of_payment_url) {
      window.open(purchase.proof_of_payment_url, '_blank');
    } else {
      alert('No proof of payment available');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!purchase) return <div>No purchase data</div>;

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
            <select disabled value={purchase.delegate_details?.title || 'Professor'}>
              <option>Professor</option>
              <option>Dr</option>
              <option>Mr</option>
              <option>Ms</option>
            </select>
          </div>
          <div>
            <label>Full Name</label>
            <input type="text" value={purchase.purchaser_name} disabled />
          </div>
          <div>
            <label>Email</label>
            <input type="email" value={purchase.email} disabled />
          </div>
          <div>
            <label>Cell Number</label>
            <input type="text" value={purchase.cellnumber || 'N/A'} disabled />
          </div>
          <div>
            <label>Institution Name</label>
            <input type="text" value={purchase.institution || 'N/A'} disabled />
          </div>
          <div>
            <label>Faculty</label>
            <input type="text" value={purchase.faculty_name || 'N/A'} disabled />
          </div>
          <div>
            <label>Department</label>
            <input type="text" value={purchase.department_name || 'N/A'} disabled />
          </div>
          <div>
            <label>IEEE Number</label>
            <input type="text" value={purchase.ieee_no || 'N/A'} disabled />
          </div>
          <div>
            <label>Organ VAT</label>
            <input type="text" value={purchase.vat_no || 'N/A'} disabled />
          </div>
          <div>
            <label>Status</label>
            <input type="text" value={purchase.status} disabled />
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
            {(purchase.delegate_details?.delegates || []).map((delegate, index) => (
              <tr key={index}>
                <td>{delegate.package || purchase.package}</td>
                <td>{delegate.title || 'N/A'}</td>
                <td>{delegate.name || 'N/A'}</td>
                <td>{delegate.gender || 'N/A'}</td>
                <td>{delegate.email || 'N/A'}</td>
                <td>{delegate.phone || 'N/A'}</td>
                <td>{delegate.number_of_tickets || purchase.number_of_tickets}</td>
                <td>{delegate.ieee_number || 'N/A'}</td>
                <td>{delegate.day_pass_duration || 'N/A'}</td>
                <td>R {Number(delegate.amount || purchase.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="buttons">
        <button className="view-btn" onClick={handleViewProofOfPayment}>
          View Proof of Payment
        </button>
        <div className="actions">
          <button className="approve" onClick={() => handleStatusUpdate('Approved')}>
            Approve
          </button>
          <button className="reject" onClick={() => handleStatusUpdate('Rejected')}>
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketPayment;