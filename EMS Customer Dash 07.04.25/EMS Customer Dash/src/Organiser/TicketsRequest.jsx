import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import './TicketsRequest.css';
 
function TicketsRequest() {
  const nav = useNavigate();
  const { eventId } = useParams();
  const [requests, setRequests] = useState([]);
  const [eventName, setEventName] = useState('');
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
        console.log('Fetched requests:', data);
        setRequests(data);
        setEventName(data.length > 0 ? data[0].event_name : 'Event');
        setLoading(false);
      } catch (err) {
        console.error('Error fetching requests:', err);
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
        setRequests(requests.filter((req) => req.purchase_id !== purchaseId));
        nav('/tickets-event-list');
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
 
  const handleDownloadCustomers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in.');
        nav('/');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/organiser/events/${eventId}/ticket-requests?all=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
 
      if (data.length === 0) {
        alert('No customer data available for download.');
        return;
      }
 
      // Prepare data for Excel
      const excelData = data.map((request) => ({
        'Purchaser Name': request.purchaser_name,
        'Package': request.package,
        'Number of Tickets': request.number_of_tickets,
        'Amount': `R ${Number(request.amount).toFixed(2)}`,
      }));
 
      // Calculate totals
      const totalTickets = data.reduce((sum, request) => sum + request.number_of_tickets, 0);
      const totalAmount = data.reduce((sum, request) => sum + Number(request.amount), 0);
 
      // Add totals row
      excelData.push({
        'Purchaser Name': 'Total',
        'Package': '',
        'Number of Tickets': totalTickets,
        'Amount': `R ${totalAmount.toFixed(2)}`,
      });
 
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData, {
        header: ['Purchaser Name', 'Package', 'Number of Tickets', 'Amount'],
      });
 
      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // Purchaser Name
        { wch: 20 }, // Package
        { wch: 15 }, // Number of Tickets
        { wch: 15 }, // Amount
      ];
 
      // Create workbook and add the worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, data[0]?.event_name || 'Customers');
 
      // Generate and download the Excel file
      XLSX.writeFile(wb, `${data[0]?.event_name || 'event'}_customers.xlsx`);
    } catch (error) {
      console.error('Error downloading customers:', error);
      alert('Failed to download customer list: ' + error.message);
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
 
      <h2 className="tickets-request-title">Ticket Requests for {eventName}</h2>
 
      <div className="button-container">
        <button className="download-button" onClick={handleDownloadCustomers}>
          Download all customers
        </button>
      </div>
 
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
 