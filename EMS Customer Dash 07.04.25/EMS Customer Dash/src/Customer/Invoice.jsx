import React from 'react';
import { useNavigate } from 'react-router-dom';

const Invoice = () => {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleDownload = (e) => {
    e.preventDefault();
    alert('Download link clicked!');
  };
  
const nav= useNavigate();

  return (
    <div className="receipt-container">
     
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
        <button className="backbutton20" onClick={() => nav("/customerviewevent")}>
          Back
        </button>
      </div>
  <br />
  <div className="conference-info">
            <img src="ICTAS.png" alt="ICTAS Logo" className="ictas-logo" />
            <h3>
              9TH ANNUAL IEEE CONFERENCE ON INFORMATION COMMUNICATION TECHNOLOGY & SOCIETY (ICTAS 2025)
            </h3>
          </div>
      
    


      <p className="invoice-message">
        Invoice will be sent via Email. Please check your inbox.<br />
        If you have not received it{' '}
        <a href="#" className="download-link" onClick={handleDownload}>
          Click Here to Download
        </a>
      </p>

      <button className="next-button" onClick={()=> nav('/uploadpop')}>
        Next
      </button>

      <style jsx>{`
        .receipt-container {
          max-width: 1800px;
          margin: 2px auto;
         
          font-family: Arial, sans-serif;
        }

        .header {
          margin-bottom: 30px;
        }

        .back-link {
          text-decoration: none;
          color: #0066cc;
          font-weight: bold;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        h1 {
          font-size: 24px;
          margin: 10px 0;
          color: #333;
        }

        h2 {
          font-size: 20px;
          margin: 8px 0;
          color: #666;
        }

        hr {
          border: 1px solid #ddd;
          margin: 20px 0;
        }

        .book-section {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }

        .book-title {
          font-weight: bold;
          margin-bottom: 10px;
        }

        .invoice-message {
          
          line-height: 1.6;
          color: #444;
            font-size: 18px;
            
            width: 100%;
            margin-top: 130px;
            item-align: 
            margin-left: 100px;
            border-radius: 5px;
            padding: 20px 20px;
            Text-align: justify;

            background-color: #f9f9f9;
        }

        .download-link {
          color: #0066cc;
          text-decoration: none;
          font-weight: bold;
        }

        .download-link:hover {
          text-decoration: underline;
        }

        .next-button {
          background-color: #0066cc;
          color: white;
          padding: 12px 30px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          display: block;
          margin: 30px auto;
        }

        .next-button:hover {
          background-color: #0052a3;
        }
      `}</style>
    </div>
  );
};

export default Invoice;
