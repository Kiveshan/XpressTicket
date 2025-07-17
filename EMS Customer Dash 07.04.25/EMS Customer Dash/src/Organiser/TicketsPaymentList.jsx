import React, { useState } from "react";
import "./TicketsPayment.css";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaEye } from "react-icons/fa";

const paymentData = [
  {
    id: "PAY-001",
    name: "Rorrick Shaun",
    tickets: 2,
    event: "ICTAS International Conference",
    package: "Conference Delegate",
    amount: "R9 000,00",
    date: "2025-06-28",
    status: "Verified",
  },
  {
    id: "PAY-002",
    name: "Jane Smith",
    tickets: 1,
    event: "Tech Summit 2025",
    package: "VIP Access",
    amount: "R5 500,00",
    date: "2025-06-30",
    status: "Pending",
  },
  {
    id: "PAY-003",
    name: "Michael Johnson",
    tickets: 4,
    event: "Annual Gala Dinner",
    package: "Standard Entry",
    amount: "R12 000,00",
    date: "2025-07-02",
    status: "Verified",
  },
];

const TickectPaymentList = () => {
  const nav = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading] = useState(false); // Static data, so no loading state needed; included for future async fetching

  const filteredPayments = paymentData.filter((payment) => {
    const matchesSearch =
      payment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      payment.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="modern-container">
        <header className="modern-header">
          <div className="header-left">
            <button className="modern-button" onClick={() => nav("/requestcard")}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
            <img
              src="/XPRESS TICKETS LOGO2.png"
              alt="EventXpress Logo"
              className="header-logo"
              onError={(e) => {
                console.warn("Failed to load logo:", e.target.src);
                e.target.src = "/default-event-image.jpg";
              }}
            />
          </div>
          <div className="modern-header-actions">
            <button className="modern-button" onClick={() => nav("/")}>
              <span className="button-icon">↩</span> Logout
            </button>
          </div>
        </header>
        <div className="modern-loading">
          <div className="modern-spinner"></div>
          <p>Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-container">
      <header className="modern-header">
        <div className="header-left">
          <button className="modern-button" onClick={() => nav("/requestcard")}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <img
            src="/XPRESS TICKETS LOGO2.png"
            alt="EventXpress Logo"
            className="header-logo"
            onError={(e) => {
              console.warn("Failed to load logo:", e.target.src);
              e.target.src = "/default-event-image.jpg";
            }}
          />
        </div>
        <div className="modern-header-actions">
          <button className="modern-button" onClick={() => nav("/")}>
            <span className="button-icon">↩</span> Logout
          </button>
        </div>
      </header>
      <main className="modern-main-content">
        <div className="modern-search-filter">
          <div className="modern-search-input">
            <FaSearch className="modern-search-icon" />
            <input
              type="text"
              placeholder="Search by name, event or payment ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="modern-filter-dropdown">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Payments</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        <div style={{
          overflowX: 'auto',
          marginTop: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.9rem'
          }}>
            <thead style={{
              background: 'linear-gradient(135deg, #2c3e50, #4ca1af)',
              color: 'white'
            }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Payment ID</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Purchaser Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Event</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Package</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Tickets</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Amount</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td style={{ padding: '10px 16px', color: '#495057' }}>{payment.id}</td>
                  <td style={{ padding: '10px 16px', color: '#495057' }}>{payment.name}</td>
                  <td style={{ padding: '10px 16px', color: '#495057' }}>{payment.event}</td>
                  <td style={{ padding: '10px 16px', color: '#495057' }}>{payment.package}</td>
                  <td style={{ padding: '10px 16px', color: '#495057' }}>{payment.tickets}</td>
                  <td style={{ padding: '10px 16px', color: '#495057' }}>{payment.amount}</td>
                  <td style={{ padding: '10px 16px', color: '#495057' }}>{payment.date}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: 'white',
                      background: payment.status === "Verified" ? '#4caf50' : '#ff9800'
                    }}>
                      {payment.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <button
                      style={{
                        background: '#4ca1af',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => nav("/ticketspayment")}
                      title="View payment details"
                      onMouseOver={(e) => {
                        e.target.style.background = '#3d8a96';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = '#4ca1af';
                      }}
                    >
                      <FaEye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default TickectPaymentList;