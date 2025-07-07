import React, { useState } from 'react';
import '../shared/ModernDashboard.css';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaBuilding, FaGraduationCap, FaIdCard } from 'react-icons/fa';

const ViewingCustomer = () => {
  const nav = useNavigate();

  // Initialize formData with default values
  const [formData] = useState({
    name: 'John Doe',
    email: 'johndoe@example.com',
    cellNumber: '123-456-7890',
    institutionLocation: 'New York University',
    faculty: 'Engineering',
    department: 'Computer Science',
    ieeeNumber: '123456789',
    organVAT: '987654321'
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
          <button className="modern-logout-btn" onClick={() => nav('/')}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {/* Back Button */}
      <div className="modern-back-button">
        <button className="modern-btn modern-btn-secondary" onClick={() => nav("/users")}>
          <FaArrowLeft /> Back to Users
        </button>
      </div>

      {/* Main Content */}
      <main className="modern-main-content">
        <h1 className="modern-page-title">Customer Profile</h1>
        
        <div className="modern-profile-container">
          {/* Profile Information */}
          <div className="modern-profile-section">
            <div className="modern-card">
              <div className="modern-card-header">
                <h2><FaUser /> Personal Information</h2>
              </div>
              <div className="modern-card-body">
                <div className="modern-info-row">
                  <div className="modern-info-label">Full Name</div>
                  <div className="modern-info-value">{formData.name}</div>
                </div>
                
                <div className="modern-info-row">
                  <div className="modern-info-label"><FaEnvelope /> Email</div>
                  <div className="modern-info-value">{formData.email}</div>
                </div>
                
                <div className="modern-info-row">
                  <div className="modern-info-label"><FaPhone /> Phone</div>
                  <div className="modern-info-value">{formData.cellNumber}</div>
                </div>
              </div>
            </div>

            <div className="modern-card">
              <div className="modern-card-header">
                <h2><FaBuilding /> Institution Details</h2>
              </div>
              <div className="modern-card-body">
                <div className="modern-info-row">
                  <div className="modern-info-label">Institution</div>
                  <div className="modern-info-value">{formData.institutionLocation}</div>
                </div>
                
                <div className="modern-info-row">
                  <div className="modern-info-label"><FaGraduationCap /> Faculty</div>
                  <div className="modern-info-value">{formData.faculty}</div>
                </div>
                
                <div className="modern-info-row">
                  <div className="modern-info-label">Department</div>
                  <div className="modern-info-value">{formData.department}</div>
                </div>
              </div>
            </div>

            <div className="modern-card">
              <div className="modern-card-header">
                <h2><FaIdCard /> Additional Information</h2>
              </div>
              <div className="modern-card-body">
                <div className="modern-info-row">
                  <div className="modern-info-label">IEEE Number</div>
                  <div className="modern-info-value">{formData.ieeeNumber || 'Not provided'}</div>
                </div>
                
                <div className="modern-info-row">
                  <div className="modern-info-label">VAT Number</div>
                  <div className="modern-info-value">{formData.organVAT || 'Not provided'}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="modern-card">
              <div className="modern-card-header">
                <h2>Actions</h2>
              </div>
              <div className="modern-card-body">
                <div className="modern-action-buttons">
                  <button className="modern-btn modern-btn-danger">
                    Disable Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ViewingCustomer;
