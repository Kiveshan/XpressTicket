import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerUploadPOP.css';

const CustomerUploadPOP = () => {
  const nav = useNavigate();
  const [uploadedFileName, setUploadedFileName] = useState(''); // State for uploaded file name

  // Handle file upload
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFileName(file.name); // Set the uploaded file name
    }
  };

  return (
    <div className="receipt-container2">
      <header className="dashboard-header">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="dashboard-logo"
        />
       <div className="profile-section">
              <button className="backbutton22" onClick={()=> nav('/')}>LogOut </button>
          </div>
      </header>
      
      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav("/invoice")}>
          Back
        </button>
      </div>
      <br />
      <div className="conference-info">
        <img src="ICTAS.png" alt="ICTAS Logo" className="ictas-logo" />
        <h3>
          9TH ANNUAL IEEE CONFERENCE ON INFORMATION COMMUNICATION TECHNOLOGY &
          SOCIETY (ICTAS 2025)
        </h3>
      </div>

      <h3 className="text-xl font-bold mb-4 upload">Upload Proof Of Payment</h3>

<div className="table-container">
  <table className="table">
    <thead>
         <tr className="bg-teal-100 text-sm">
              <th className="p-2 border">Package Details</th>
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Gender</th>
              <th className="p-2 border">Text</th>
              <th className="p-2 border">Phone Number</th>
              <th className="p-2 border">No. of Tickets</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Proof of Payment</th>
      </tr>
    </thead>
    
    <tbody>
      <tr className="bg-white">
       <td className="p-2 border">Conference Delegate</td>
              <td className="p-2 border">Prof</td>
              <td className="p-2 border">Rorrik Shaun</td>
              <td className="p-2 border">Male</td>
              <td className="p-2 border">rorrikshaun@gmail.com</td>
              <td className="p-2 border">0828529658</td>
              <td className="p-2 border">2</td>
              <td className="p-2 border">R 14 000, 00</td>
        <td className="upload-cell">
          <span>{uploadedFileName}</span>
          <label htmlFor="file-upload">
            <img src="/icons8-upload-50.png" alt="Upload" className="upload-icon" />
          </label>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileChange}
          />
        </td>
      </tr>
    </tbody>
  </table>
</div>

<button className="submit-btn" onClick={() => nav("/customerviewevent")}>Submit</button>
    </div>
  );
};

export default CustomerUploadPOP;
