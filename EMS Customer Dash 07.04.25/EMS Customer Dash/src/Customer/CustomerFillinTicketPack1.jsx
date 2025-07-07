import React, { useState } from 'react';
import './CustomerFillinTicketPack1.css';
import { useNavigate } from 'react-router-dom';

const titles = ['Prof', 'Dr', 'Mr', 'Ms'];
const genders = ['Male', 'Female', 'Other'];
const delegations = ['Key Note Speaker', 'Panelist', 'Attendee'];

function CustomerFillinTicketPack1() {
  const nav= useNavigate();
  const [delegates, setDelegates] = useState([
    { title: 'Prof', name: '', gender: 'Male', email: '', phone: '', ieee: '', delegation: 'Key Note Speaker' }
  ]);
  const [showModal, setShowModal] = useState(false);

  const handleAddRow = () => {
    setDelegates([
      ...delegates,
      { title: 'Prof', name: '', gender: 'Male', email: '', phone: '', ieee: '', delegation: 'Key Note Speaker' }
    ]);
  };

  const handleRemoveRow = () => {
    if (delegates.length > 1) {
      setDelegates(delegates.slice(0, -1));
    }
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...delegates];
    updated[index][field] = value;
    setDelegates(updated);
  };

  const selectPackage = (packageName) => {
    alert(`You selected ${packageName}`);
    handleAddRow();
    setShowModal(false);
  };

  return (
    <div className="ictas-container1">
      <header className="dashboard-header4">
        <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="dashboard-logo" />
        <div className="profile-section">
              <button className="backbutton22" onClick={()=> nav('/')}>LogOut </button>
          </div>
      </header>
      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav("/eventticketpackage")}>
          Back
        </button>
      </div>

      <div className="event-details1">
        <div className="conference-info1">
          <img src="ICTAS.png" alt="ICTAS Logo" className="ictas-logo" />
          <h3>9TH ANNUAL IEEE CONFERENCE ON INFORMATION COMMUNICATION TECHNOLOGY & SOCIETY (ICTAS 2025)</h3>
        </div>
      </div>
      <div className="eventdestription">
        <p className="packageprice">Conference Delegate</p>
        <p>Partner Logo on conference website, brochure, promo screen. Exhibition table at the conference with 1 exhibitor. 2 complimentary physical attendance conference registrations. 15 minutes presentation at ICTAS conference. 30 minutes presentation at Symposium. Inclusion of partner promotional material in conference pack.</p>

        <p className="eventprice"><strong>Price: R7 000, 00</strong></p>
      
      </div>
      <br />
      
      <div className="quantity1">
        <button onClick={handleRemoveRow}>-</button>
        <span>{delegates.length}</span>
        <button onClick={handleAddRow}>+</button>
      </div>
      <br />
<div className="addpeople">
      {delegates.map((delegate, index) => (
        <div className="row" key={index}>
          <select value={delegate.title} onChange={(e) => handleInputChange(index, 'title', e.target.value)}>
            {titles.map((t, i) => <option key={i}>{t}</option>)}
          </select>
          <input type="text" placeholder="Delegate Name" value={delegate.name} onChange={(e) => handleInputChange(index, 'name', e.target.value)} />
          <select value={delegate.gender} onChange={(e) => handleInputChange(index, 'gender', e.target.value)}>
            {genders.map((g, i) => <option key={i}>{g}</option>)}
          </select>
          <input type="email" placeholder="Email Address" value={delegate.email} onChange={(e) => handleInputChange(index, 'email', e.target.value)} />
          <input type="text" placeholder="Phone Number" value={delegate.phone} onChange={(e) => handleInputChange(index, 'phone', e.target.value)} />
          <input type="text" placeholder="IEEE Number" value={delegate.ieee} onChange={(e) => handleInputChange(index, 'ieee', e.target.value)} />
          <select value={delegate.delegation} onChange={(e) => handleInputChange(index, 'delegation', e.target.value)}>
            {delegations.map((d, i) => <option key={i}>{d}</option>)}
          </select>
        </div>
      ))}

      
      </div>
      <div className="footer1">
        <button className="btn2" onClick={() => nav('/confirm-ticket-package')}>Purchase Package</button>
      </div>
    
    </div>
  );
}

export default CustomerFillinTicketPack1;
