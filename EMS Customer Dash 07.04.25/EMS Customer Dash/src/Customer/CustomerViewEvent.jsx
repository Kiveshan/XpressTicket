import React, { useState } from "react";
import "./CustomerViewEvent.css";
import { useNavigate } from 'react-router-dom';

 
const CustomerViewEvent = () => {
  const [showThemes, setShowThemes] = useState(false);
  const nav= useNavigate();
  return (
    <div className="dashboard-container">
      <header className="dashboard-header2">
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
        <button className="backbutton20" onClick={() => nav("/eventmenu")}>
          Back
        </button>
      </div>

<div className="btn extra">
<button  onClick={()=> nav('/invoice')}>Invoice</button>
<button  onClick={()=> nav('/tickets')}>Tickets</button>
</div>
<br />
      <div className="container">
        <div className="content">
          <div className="conference-info">
            <img src="ICTAS.png" alt="ICTAS Logo" className="ictas-logo" />
            <h3>
              9TH ANNUAL IEEE CONFERENCE ON INFORMATION COMMUNICATION TECHNOLOGY & SOCIETY (ICTAS 2025)
            </h3>
          </div>

          <div className="event-details">
            <h4><strong>📍 Capital Zimbali Hotel, Ballito, KZN, South Africa | 📅 23rd June 2025 - 25th June 2025 |⏰ 9am - 3pm</strong></h4>

          </div>
          <nav className="tabs">
            <button onClick={() => setShowThemes(false)}>About Us</button>
            <button onClick={() => setShowThemes(true)}>Themes</button>
            <button>Important Dates</button>
            <button>Paper Submission Institution</button>
          </nav>
          <div className="event-description">
        
          
          {showThemes ? (
            <div className="themes">
              <div className="p-8 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold text-center mb-8">Call for Submissions</h2>
      <p className="text-center text-gray-600 mb-12">
        We invite submissions of previously unpublished work on the following topics and technical areas of interest.
      </p>
      <div className="grid md:grid-cols-3 gap-8">
        {/* Information Technology Track */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-blue-600">Information Technology Track</h3>
          <ul className="list-disc pl-5 text-gray-700">
            <li>Computer Networks and Cybersecurity</li>
            <li>Data Science and Big Data</li>
            <li>Digital Transformation</li>
            <li>Edge, Cloud and Crowd Computing</li>
            <li>Computer Vision and Image Processing</li>
            <li>Information Systems</li>
            <li>Artificial Intelligence and Machine Learning</li>
            <li>Semantic Web Technologies</li>
          </ul>
        </div>
        
        {/* Engineering Track */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-green-600">Engineering Track</h3>
          <ul className="list-disc pl-5 text-gray-700">
            <li>Engineering Education</li>
            <li>Renewable Energy Systems</li>
            <li>Energy Sustainability</li>
            <li>Smart Grids and Microgrids</li>
            <li>Cybersecurity and Risk Analysis</li>
            <li>Energy Storage</li>
          </ul>
        </div>

        {/* Digital Finance Track */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-purple-600">Digital Finance Track</h3>
          <ul className="list-disc pl-5 text-gray-700">
            <li>Cryptocurrency and Blockchain</li>
            <li>Digital Economy</li>
            <li>Financial Inclusion</li>
            <li>Cybersecurity in Finance</li>
            <li>Regulatory Technology</li>
            <li>Web2 Partnerships and Web3 Users</li>
            <li>Real-World Assets</li>
            <li>Tokenization and Data Security</li>
          </ul>
        </div>
      </div>
    </div>
            </div>
          ) : (
            <div className="description">
              <p>
              The annual ICTAS international conference, which was established in 2017 serves as an engagement platform for researchers in academia and industry to communicate their latest contributions in the disciplines of Information Communication Technology (ICT) and foster networking. Since its inception in 2017, each paper presented at the conference has been published on IEEE Xplore with a growing h5-index of 16 and h5-median of 23.The ICTAS conference encourages the exchange of creative ideas through keynotes, panel discussions, and industry exhibits to bridge the gap between academic and industry innovations. The 2025 IEEE ICTAS conference promises to showcase the most recent advancements in the disciplines of ICT, including Engineering and Digital Finance. <br /> Accepted papers that are physically presented at the conference will be submitted for consideration for inclusion in IEEE Xplore® database. IEEE has granted technical sponsorship for the hosting of ICTAS 2025 with application number 64866. 
              </p>
            </div>
          )}
          </div>
          <br />
          <button className="explore-button" onClick={()=> nav('/eventticketpackage')}>Explore Packages</button>
        </div>
      </div>
    </div>
  );
};

export default CustomerViewEvent;
