import React, { useState } from 'react';
import '../Customer/InformationForm.css';
import { useNavigate } from 'react-router-dom';

const ViewingCustomer = () => {
  const nav = useNavigate();

  // Initialize formData with default values
  const [formData] = useState({
    name: 'John Doe',
    title: 'Mr',
    dropdown: 'Mr',
    email: 'johndoe@example.com',
    cellNumber: '123-456-7890',
    institutionLocation: 'New York University',
    faculty: 'Engineering',
    department: 'Computer Science',
    ieeeNumber: '123456789',
    organVAT: '987654321'
  });

  return (
    <>
      <br />
                <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav("/users")}>
          Back
        </button>
      </div>
      <div className="form-container">
        <form>
          <div className="form-section">
            <h2>Full Name</h2>
            <div className="input-group">
              <input
                type="text"
                name="name"
                placeholder="Name here"
                value={formData.name}
                readOnly
              />
              <select
                className="inputselect"
                name="dropdown"
                value={formData.dropdown}
                disabled
              >
                <option value="">Title</option>
                <option value="Mr">Mr</option>
                <option value="Dr">Dr</option>
                <option value="Miss">Miss</option>
                <option value="Mrs">Mrs</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h2>Email</h2>
            <div className="input-group">
              <input
                className="inputselect"
                type="email"
                name="email"
                placeholder="Email here"
                value={formData.email}
                readOnly
              />
              <input
                className="inputselect"
                type="tel"
                name="cellNumber"
                placeholder="Cell Number"
                value={formData.cellNumber}
                readOnly
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Institution Name</h2>
            <div className="input-group">
              <input
                className="inputselect"
                type="text"
                name="institutionLocation"
                placeholder="Institution Location"
                value={formData.institutionLocation}
                readOnly
              />
              <input
                className="inputselect"
                type="text"
                name="faculty"
                placeholder="Faculty"
                value={formData.faculty}
                readOnly
              />
              <input
                className="inputselect"
                type="text"
                name="department"
                placeholder="Department"
                value={formData.department}
                readOnly
              />
            </div>
          </div>

          <div className="form-section">
            <h2>IEEE Number</h2>
            <div className="input-group">
              <input
                className="inputselect"
                type="text"
                name="ieeeNumber"
                placeholder="IEEE Number"
                value={formData.ieeeNumber}
                readOnly
              />
            </div>
            <h2>Organ VAT</h2>
            <div className="input-group">
              <input
                className="inputselect"
                type="text"
                name="organVAT"
                placeholder="Organ VAT"
                value={formData.organVAT}
                readOnly
              />
            </div>
          </div>

          {/* Disabled Button */}
          <div className="form-section">
            <button className="disabled-button">
              Disable
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ViewingCustomer;
