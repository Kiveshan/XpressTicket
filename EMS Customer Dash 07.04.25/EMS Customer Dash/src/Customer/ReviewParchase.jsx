import React from 'react';
import "./ReviewParchase.css";
import { useNavigate } from 'react-router-dom';
import '../shared/ModernDashboard.css';
import { FaSignOutAlt, FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaClock, FaMoneyBillWave } from 'react-icons/fa';

function ReviewParchase() {
   const nav = useNavigate();

   return (
    <div className="modern-dashboard-container">
      {/* Header with Logo and Logout */}
      <header className="purchase-header">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="purchase-logo"
        />
        <div className="purchase-header-actions">
          <button className="purchase-logout-btn" onClick={() => nav('/')}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>
      
      {/* Back Button */}
      <div className="purchase-back-button">
        <button className="purchase-back-btn" onClick={() => nav("/customerdash")}>
          <FaArrowLeft /> Back to Dashboard
        </button>
      </div>

      <main className="purchase-main-content">
        <h1 className="purchase-page-title">My Purchased Tickets</h1>
        <p className="purchase-page-description">View all events you've purchased tickets for</p>
        
        <div className="purchase-card-grid">
          {/* Event Card 1 */}
          <div className="purchase-event-container" onClick={() => nav('/parchasedticket')}>
            <div className="purchase-event-card">
              <div className="purchase-event-status">Active</div>
              <div className="purchase-event-image-container">
                <img src="/pexels-photo-7723831.jpeg" alt="HOD Party" className="purchase-event-image" />
              </div>
              <div className="purchase-event-title-container">
                <h3 className="purchase-event-title">HOD Party Celebration</h3>
              </div>
            </div>
            
            <div className="purchase-event-details-card">
              <div className="purchase-event-detail-item">
                <FaMapMarkerAlt className="purchase-event-icon" />
                <span>Amanzimtoti</span>
              </div>
              <div className="purchase-event-detail-item">
                <FaCalendarAlt className="purchase-event-icon" />
                <span>29 February</span>
              </div>
              <div className="purchase-event-detail-item">
                <FaClock className="purchase-event-icon" />
                <span>9:00 AM</span>
              </div>
              <div className="purchase-event-detail-item purchase-event-price">
                <FaMoneyBillWave className="purchase-event-icon" />
                <span>R 12,000.00</span>
              </div>
              <div className="purchase-button-group">
                <button className="purchase-view-tickets-btn">View Tickets</button>
                <button className="purchase-invoice-btn" onClick={(e) => { e.stopPropagation(); nav('/invoice', { state: { eventId: '1', eventName: 'HOD Party Celebration', eventDate: '29 February', eventLocation: 'Amanzimtoti', eventPrice: 'R 12,000.00' } }); }}>Invoice</button>
              </div>
            </div>
          </div>

          {/* Event Card 2 */}
          <div className="purchase-event-container" onClick={() => nav('/parchasedticket')}>
            <div className="purchase-event-card">
              <div className="purchase-event-status">Active</div>
              <div className="purchase-event-image-container">
                <img src="/pexels-photo-9729879.jpeg" alt="Conference B" className="purchase-event-image" />
              </div>
              <div className="purchase-event-title-container">
                <h3 className="purchase-event-title">Conference B</h3>
              </div>
            </div>
            
            <div className="purchase-event-details-card">
              <div className="purchase-event-detail-item">
                <FaMapMarkerAlt className="purchase-event-icon" />
                <span>Durban</span>
              </div>
              <div className="purchase-event-detail-item">
                <FaCalendarAlt className="purchase-event-icon" />
                <span>30 March</span>
              </div>
              <div className="purchase-event-detail-item">
                <FaClock className="purchase-event-icon" />
                <span>9:00 AM</span>
              </div>
              <div className="purchase-event-detail-item purchase-event-price">
                <FaMoneyBillWave className="purchase-event-icon" />
                <span>R 250.00</span>
              </div>
              <div className="purchase-button-group">
                <button className="purchase-view-tickets-btn">View Tickets</button>
                <button className="purchase-invoice-btn" onClick={(e) => { e.stopPropagation(); nav('/invoice', { state: { eventId: '1', eventName: 'HOD Party Celebration', eventDate: '29 February', eventLocation: 'Amanzimtoti', eventPrice: 'R 12,000.00' } }); }}>Invoice</button>
              </div>
            </div>
          </div>

          {/* Event Card 3 */}
          <div className="purchase-event-container" onClick={() => nav('/parchasedticket')}>
            <div className="purchase-event-card">
              <div className="purchase-event-status">Active</div>
              <div className="purchase-event-image-container">
                <img src="/ICTAS.png" alt="ICTAS" className="purchase-event-image" />
              </div>
              <div className="purchase-event-title-container">
                <h3 className="purchase-event-title">ICTAS</h3>
              </div>
            </div>
            
            <div className="purchase-event-details-card">
              <div className="purchase-event-detail-item">
                <FaMapMarkerAlt className="purchase-event-icon" />
                <span>Umhlanga</span>
              </div>
              <div className="purchase-event-detail-item">
                <FaCalendarAlt className="purchase-event-icon" />
                <span>29 February</span>
              </div>
              <div className="purchase-event-detail-item">
                <FaClock className="purchase-event-icon" />
                <span>9:00 AM</span>
              </div>
              <div className="purchase-event-detail-item purchase-event-price">
                <FaMoneyBillWave className="purchase-event-icon" />
                <span>R 12,000.00</span>
              </div>
              <div className="purchase-button-group">
                <button className="purchase-view-tickets-btn">View Tickets</button>
                <button className="purchase-invoice-btn" onClick={(e) => { e.stopPropagation(); nav('/invoice', { state: { eventId: '1', eventName: 'HOD Party Celebration', eventDate: '29 February', eventLocation: 'Amanzimtoti', eventPrice: 'R 12,000.00' } }); }}>Invoice</button>
              </div>
            </div>
          </div>

          {/* Event Card 4 */}
          <div className="purchase-event-container" onClick={() => nav('/parchasedticket')}>
            <div className="purchase-event-card">
              <div className="purchase-event-status purchase-event-status-past">Past</div>
              <div className="purchase-event-image-container">
                <img src="/pexels-photo-9729879.jpeg" alt="Conference B" className="purchase-event-image" />
              </div>
              <div className="purchase-event-title-container">
                <h3 className="purchase-event-title">Conference B</h3>
              </div>
            </div>
            
            <div className="purchase-event-details-card">
              <div className="purchase-event-detail-item">
                <FaMapMarkerAlt className="purchase-event-icon" />
                <span>Durban</span>
              </div>
              <div className="purchase-event-detail-item">
                <FaCalendarAlt className="purchase-event-icon" />
                <span>30 March</span>
              </div>
              <div className="purchase-event-detail-item">
                <FaClock className="purchase-event-icon" />
                <span>9:00 AM</span>
              </div>
              <div className="purchase-event-detail-item purchase-event-price">
                <FaMoneyBillWave className="purchase-event-icon" />
                <span>R 250.00</span>
              </div>
              <div className="purchase-button-group">
                <button className="purchase-view-tickets-btn">View Tickets</button>
                <button className="purchase-invoice-btn" onClick={(e) => { e.stopPropagation(); nav('/invoice', { state: { eventId: '1', eventName: 'HOD Party Celebration', eventDate: '29 February', eventLocation: 'Amanzimtoti', eventPrice: 'R 12,000.00' } }); }}>Invoice</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ReviewParchase;
