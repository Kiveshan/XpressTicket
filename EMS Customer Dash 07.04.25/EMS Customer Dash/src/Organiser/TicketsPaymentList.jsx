import React, { useState } from "react";
import "./TicketsPayment.css";
import { useNavigate } from "react-router-dom";
import "../shared/ModernDashboard.css";
import {
  FaSignOutAlt,
  FaArrowLeft,
  FaSearch,
  FaFilter,
  FaEye,
  FaDownload,
} from "react-icons/fa";
 
// Enhanced sample data with more fields and entries
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
 
  // Filter payments based on search query and status filter
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
 
  return (
    <div className="modern-dashboard-container">
      {/* Modern Header */}
      <header className="modern-header">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="modern-logo"
        />
        <div className="modern-header-actions">
          <button className="modern-logout-btn" onClick={() => nav("/")}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>
 
      {/* Back Button */}
      <div className="modern-back-button">
        <button
          className="modern-back-btn"
          onClick={() => nav("/organiser-dash")}
        >
          <FaArrowLeft /> Back to Dashboard
        </button>
      </div>
 
      {/* Main Content */}
      <main className="modern-main-content">
        <h1 className="modern-page-title">Payment Management</h1>
 
        {/* Search and Filter Section */}
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
              className="modern-filter-btn"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Payments</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
 
        {/* Table Container */}
        <div className="modern-table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Purchaser Name</th>
                <th>Event</th>
                <th>Package</th>
                <th>Tickets</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment, index) => (
                <tr key={index}>
                  <td>{payment.id}</td>
                  <td>{payment.name}</td>
                  <td>{payment.event}</td>
                  <td>{payment.package}</td>
                  <td>{payment.tickets}</td>
                  <td>{payment.amount}</td>
                  <td>{payment.date}</td>
                  <td>
                    <span
                      className={`modern-badge ${
                        payment.status === "Verified"
                          ? "modern-badge-success"
                          : payment.status === "Pending"
                          ? "modern-badge-warning"
                          : "modern-badge-info"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
 
                  <td>
                    <button
                      className="modern-action-btn"
                      onClick={() => nav("/ticketspayment")}
                      title="View payment details"
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
 