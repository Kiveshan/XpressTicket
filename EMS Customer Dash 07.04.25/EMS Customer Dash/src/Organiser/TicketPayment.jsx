import React from 'react';
import '../Organiser/TicketsRequest.css';
import { useNavigate } from 'react-router-dom';

const TickectPayment = () => {
  const nav = useNavigate();
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
        <button className="backbutton20" onClick={()=> nav('/ticketspaymentlist')}>
          Back
        </button>
      </div>

      <h2 className="section-title">Purchaser</h2>

      <div className="form-card12">
        <div className="form-grid">
          <div>
            <label>Title</label>
            <select><option>Professor</option></select>
          </div>
          <div>
            <label>Full name</label>
            <input type="text" value="Rorrik Shaun" disabled />
          </div>
          <div>
            <label>Email</label>
            <input type="email" value="rorrik@gmail.com" />
          </div>
          <div>
            <label>Cell Number</label>
            <input type="text" placeholder="Number here" />
          </div>
          <div>
            <label>Institution Name</label>
            <input type="text" value="UKZN" />
          </div>
          <div>
            <label>Institution Location</label>
            <input type="text" value="11 Magical Lane, Durban, KZN" />
          </div>
          <div>
            <label>Faculty</label>
            <input type="text" value="Faculty of Accounting and Informatics" />
          </div>
          <div>
            <label>Department</label>
            <input type="text" value="Information Systems" />
          </div>
          <div>
            <label>IEEE Number</label>
            <input type="text" value="0123" />
          </div>
          <div>
            <label>Organ VAT</label>
            <input type="text" value="0123" />
          </div>
        </div>
      </div>

      <h2 className="section-title">Delegates</h2>

      <div className="table-container12">
        <table>
          <thead>
            <tr>
              {["Package Details", "Title", "Name", "Gender", "Text", "Phone Number", "No. of Tickets", "IEEE Number", "Day Pass Duration", "Amount"].map((heading) => (
                <th key={heading}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Conference Delegate</td>
              <td>Prof</td>
              <td>Rorrik Shaun</td>
              <td>Male</td>
              <td>rorrikshaun@gmail.com</td>
              <td>0828529658</td>
              <td>1</td>
              <td>02541</td>
              <td></td>
              <td>R 7 000,00</td>
            </tr>
            <tr>
              <td>Day Pass</td>
              <td>Dr</td>
              <td>New Person</td>
              <td>Female</td>
              <td>newguy@gmail.com</td>
              <td>0316536451</td>
              <td>1</td>
              <td>56352</td>
              <td>27/08/2025 - 29/08/2025</td>
              <td>Content</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="buttons">
        <button className="view-btn">View Proof of Payment</button>
        <div className="actions">
          <button className="approve">Approve</button>
          <button className="reject">Reject</button>
        </div>
      </div>
    </div>
  );
};

export default TickectPayment;
