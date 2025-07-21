import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx'; // Library for generating Excel files
import './TicketsRequest.css';
import './ModernOrganizerStyles.css';

function TicketsRequest() {
  const navigate = useNavigate();
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
          navigate('/login');
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
  }, [eventId, navigate]);

  const handleDownloadCustomers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in.');
        navigate('/login');
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

      const excelData = data.map((request) => ({
        'Purchaser Name': request.purchaser_name,
        'Package': request.package,
        'Number of Tickets': request.number_of_tickets,
        'Amount': `R ${Number(request.amount).toFixed(2)}`,
      }));

      const totalTickets = data.reduce((sum, request) => sum + request.number_of_tickets, 0);
      const totalAmount = data.reduce((sum, request) => sum + Number(request.amount), 0);

      excelData.push({
        'Purchaser Name': 'Total',
        'Package': '',
        'Number of Tickets': totalTickets,
        'Amount': `R ${totalAmount.toFixed(2)}`,
      });

      const ws = XLSX.utils.json_to_sheet(excelData, {
        header: ['Purchaser Name', 'Package', 'Number of Tickets', 'Amount'],
      });

      ws['!cols'] = [
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, data[0]?.event_name || 'Customers');
      XLSX.writeFile(wb, `${data[0]?.event_name || 'event'}_customers.xlsx`);
    } catch (error) {
      console.error('Error downloading customers:', error);
      alert('Failed to download customer list: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="modern-loading-overlay">
        <header className="modern-header">
          <div className="header-left">
            <button className="modern-button" onClick={() => navigate('/tickets-event-list')}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
            <img
              src="/XPRESS TICKETS LOGO2.png"
              alt="EventXpress Logo"
              className="header-logo"
            />
          </div>
          <h1 className="header-title">Ticket Requests</h1>
          <button
            className="modern-button"
            onClick={() => {
              sessionStorage.removeItem("token");
              sessionStorage.removeItem("userId");
              sessionStorage.removeItem("user");
              navigate('/login');
            }}
          >
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </header>
        <div className="loading-content">
          <div className="view-empty-state-icon">⏳</div>
          <p>Loading ticket requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-container">
        <header className="modern-header">
          <div className="header-left">
            <button className="modern-button" onClick={() => navigate('/tickets-event-list')}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
            <img
              src="/XPRESS TICKETS LOGO2.png"
              alt="EventXpress Logo"
              className="header-logo"
            />
          </div>
          <h1 className="header-title">Ticket Requests</h1>
          <button
            className="modern-button"
            onClick={() => {
              sessionStorage.removeItem("token");
              sessionStorage.removeItem("userId");
              sessionStorage.removeItem("user");
              navigate('/login');
            }}
          >
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </header>
        <div className="error-content">
          <div className="view-empty-state-icon">❌</div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-container">
      <header className="modern-header">
        <div className="header-left">
          <button className="modern-button" onClick={() => navigate('/tickets-event-list')}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <img
            src="/XPRESS TICKETS LOGO2.png"
            alt="EventXpress Logo"
            className="header-logo"
          />
        </div>
        <h1 className="header-title">Ticket Requests</h1>
        <button
          className="modern-button"
          onClick={() => {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("userId");
            sessionStorage.removeItem("user");
            navigate('/login');
          }}
        >
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </header>

      <h2 className="tickets-request-title">Ticket Requests for {eventName}</h2>

      <div className="button-container">
        <button className="primary-button" onClick={handleDownloadCustomers}>
          Download All Customers
        </button>
      </div>

      <div className="tickets-request-table">
        <table>
          <thead>
            <tr>
              <th>Purchaser Name</th>
              <th>Number of Tickets</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan="2">No ticket requests found</td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.purchase_id}>
                  <td>{request.purchaser_name}</td>
                  <td>{request.number_of_tickets}</td>
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