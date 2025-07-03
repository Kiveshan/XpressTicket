import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './TicketsRequest.css';

function TicketsRequest() {
  const nav = useNavigate();
  const { eventId } = useParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please log in.');
          setLoading(false);
          nav('/');
          return;
        }
        const response = await fetch(`http://localhost:5000/api/organiser/events/${eventId}/ticket-requests`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setRequests(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchRequests();
  }, [eventId, nav]);

  const handleStatusUpdate = async (purchaseId, request_status) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in.');
        setLoading(false);
        nav('/');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/organiser/ticket-requests/${purchaseId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ request_status }),
      });
      const result = await response.json();
      if (response.ok) {
        alert(`Ticket request ${request_status} successfully`);
        setRequests(requests.filter((req) => req.purchase_id !== purchaseId)); // Remove from local state
        nav('/tickets-event-list'); // Navigate back to event list
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('Failed to update request status');
    }
  };

  const handleViewProof = (proofUrl) => {
    if (proofUrl) {
      window.open(proofUrl, '_blank');
    } else {
      alert('No proof of payment available');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="tickets-request-container">
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
        <button className="backbutton20" onClick={() => nav('/tickets-event-list')}>
          Back
        </button>
      </div>

      <h2 className="tickets-request-title">Ticket Requests</h2>
      <div className="tickets-request-table">
        <table>
          <thead>
            <tr>
              <th>Purchaser Name</th>
              <th>Number of Tickets</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan="3">No ticket requests found</td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.purchase_id}>
                  <td>{request.purchaser_name}</td>
                  <td>{request.number_of_tickets}</td>
                  <td>
                    <button
                      className="view-proof-button"
                      onClick={() => handleViewProof(request.proof_of_payment_url)}
                    >
                      View Proof
                    </button>
                    {request.request_status === 'pending' && (
                      <>
                        <button
                          className="view-proof-button"
                          onClick={() => handleStatusUpdate(request.purchase_id, 'Approved')}
                        >
                          Approve
                        </button>
                        <button
                          className="view-proof-button"
                          onClick={() => handleStatusUpdate(request.purchase_id, 'Rejected')}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TicketsRequest;