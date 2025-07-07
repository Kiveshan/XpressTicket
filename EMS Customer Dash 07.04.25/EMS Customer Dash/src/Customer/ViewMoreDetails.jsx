import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ViewMoreDetails.css';
import '../shared/ModernDashboard.css';
import { FaSignOutAlt, FaArrowLeft, FaTicketAlt, FaCalendarAlt, FaMapMarkerAlt, FaUser, FaEnvelope, FaPhone, FaDownload } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ViewMoreDetails = () => {
  const nav = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState({});
  
  // Event details
  const eventDetails = {
    name: "9TH ANNUAL IEEE CONFERENCE ON INFORMATION COMMUNICATION TECHNOLOGY & SOCIETY",
    shortName: "ICTAS 2025",
    location: "Durban, South Africa",
    venue: "Durban International Convention Center"
  };
  const [packages, setPackages] = useState([
    {
      packageDetails: 'Conference Delegate',
      title: 'Prof',
      name: 'Ronrik Shaun',
      gender: 'Male',
      email: 'ronrikshaun@gmail.com',
      phone: '0828529658',
      delegation: 'Key Note Speaker',
      tickets: 1,
      ieeeNumber: '02541',
      dayPass: '',
      amount: 'R 7 000,00'
    },
    {
      packageDetails: 'Day Pass',
      title: 'Dr',
      name: 'New Person',
      gender: 'Female',
      email: 'newguye@gmail.com',
      phone: '0316536451',
      delegation: 'Guest',
      tickets: 1,
      ieeeNumber: '56352',
      dayPass: '27/08/2025 - 29/08/2025',
      amount: 'R 2 000'
    }
  ]);

  const handleAddPackage = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  
  // Function to generate and download ticket PDF
  const generateTicketPDF = async (pkg) => {
    // Set loading state for this specific package
    setGeneratingPdf(prev => ({ ...prev, [pkg.email]: true }));
    
    try {
      // Create new PDF document - use landscape for e-ticket style
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Generate a unique ticket ID
      const generateTicketId = () => {
        const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `XPT-${pkg.ieeeNumber || randomPart}-${Date.now().toString().slice(-6)}`;
      };
      
      // Function to add a single ticket to the PDF
      const addTicketToPdf = (pageNum, ticketId) => {
        // If not the first page, add a new page
        if (pageNum > 0) {
          doc.addPage();
        }
        
        // Set background color
        doc.setFillColor(249, 250, 251); // Very light gray background
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Add colored header bar
        doc.setFillColor(44, 62, 80); // #2c3e50 - dark blue
        doc.rect(0, 0, pageWidth, 25, 'F');
        
        // Add logo to header
        try {
          const logoImg = new Image();
          logoImg.src = '/XPRESS TICKETS LOGO2.png';
          doc.addImage(logoImg, 'PNG', 10, 5, 40, 15, undefined, 'FAST');
        } catch (err) {
          console.error('Error loading logo image:', err);
        }
        
        // Add e-ticket title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255); // White text for header
        doc.text('E-TICKET', pageWidth - 20, 15, { align: 'right' });
        
        // Add ticket number in header
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Ticket #: ${ticketId}`, pageWidth - 20, 22, { align: 'right' });
        
        // Add event details section
        doc.setDrawColor(76, 161, 175); // #4ca1af - teal
        doc.setLineWidth(0.5);
        doc.line(10, 35, pageWidth - 10, 35);
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80); // #2c3e50 - dark blue
        doc.text(eventDetails.name, pageWidth / 2, 40, { align: 'center', maxWidth: pageWidth - 40 });
        
        doc.setFontSize(14);
        doc.text(eventDetails.shortName, pageWidth / 2, 48, { align: 'center' });
        
        // Add event info
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(73, 80, 87); // #495057 - dark gray
        doc.text(`Venue: ${eventDetails.venue}`, pageWidth / 2, 56, { align: 'center' });
        doc.text(`Location: ${eventDetails.location}`, pageWidth / 2, 62, { align: 'center' });
        
        // Add divider
        doc.setDrawColor(222, 226, 230); // #dee2e6 - light gray
        doc.setLineWidth(0.3);
        doc.line(10, 70, pageWidth - 10, 70);
        
        // Left column - Attendee info
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80); // #2c3e50 - dark blue
        doc.text('ATTENDEE INFORMATION', 20, 80);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(73, 80, 87); // #495057 - dark gray
        
        const leftColumnY = 90;
        const lineHeight = 7;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Name:', 20, leftColumnY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${pkg.title} ${pkg.name}`, 60, leftColumnY);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Email:', 20, leftColumnY + lineHeight);
        doc.setFont('helvetica', 'normal');
        doc.text(pkg.email, 60, leftColumnY + lineHeight);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Phone:', 20, leftColumnY + lineHeight * 2);
        doc.setFont('helvetica', 'normal');
        doc.text(pkg.phone, 60, leftColumnY + lineHeight * 2);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Gender:', 20, leftColumnY + lineHeight * 3);
        doc.setFont('helvetica', 'normal');
        doc.text(pkg.gender, 60, leftColumnY + lineHeight * 3);
        
        // Right column - Ticket info
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80); // #2c3e50 - dark blue
        doc.text('TICKET INFORMATION', pageWidth / 2 + 10, 80);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(73, 80, 87); // #495057 - dark gray
        
        const rightColumnY = 90;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Package:', pageWidth / 2 + 10, rightColumnY);
        doc.setFont('helvetica', 'normal');
        doc.text(pkg.packageDetails, pageWidth / 2 + 50, rightColumnY);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Delegation:', pageWidth / 2 + 10, rightColumnY + lineHeight);
        doc.setFont('helvetica', 'normal');
        doc.text(pkg.delegation, pageWidth / 2 + 50, rightColumnY + lineHeight);
        
        doc.setFont('helvetica', 'bold');
        doc.text('IEEE Number:', pageWidth / 2 + 10, rightColumnY + lineHeight * 2);
        doc.setFont('helvetica', 'normal');
        doc.text(pkg.ieeeNumber || 'N/A', pageWidth / 2 + 50, rightColumnY + lineHeight * 2);
        
        if (pkg.dayPass) {
          doc.setFont('helvetica', 'bold');
          doc.text('Duration:', pageWidth / 2 + 10, rightColumnY + lineHeight * 3);
          doc.setFont('helvetica', 'normal');
          doc.text(pkg.dayPass, pageWidth / 2 + 50, rightColumnY + lineHeight * 3);
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text('Amount:', pageWidth / 2 + 10, rightColumnY + lineHeight * 4);
        doc.setFont('helvetica', 'normal');
        doc.text(pkg.amount, pageWidth / 2 + 50, rightColumnY + lineHeight * 4);
        
        // Add QR code placeholder
        doc.setDrawColor(44, 62, 80); // #2c3e50 - dark blue
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(pageWidth - 60, 80, 40, 40, 3, 3, 'FD');
        
        // Add ticket number under QR code
        doc.setFontSize(8);
        doc.setTextColor(73, 80, 87); // #495057 - dark gray
        doc.text('SCAN QR CODE AT EVENT', pageWidth - 40, 130, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(ticketId, pageWidth - 40, 136, { align: 'center' });
        
        // Add bottom section with important notes
        doc.setDrawColor(76, 161, 175); // #4ca1af - teal
        doc.setLineWidth(0.5);
        doc.line(10, pageHeight - 40, pageWidth - 10, pageHeight - 40);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80); // #2c3e50 - dark blue
        doc.text('IMPORTANT INFORMATION', pageWidth / 2, pageHeight - 35, { align: 'center' });
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(73, 80, 87); // #495057 - dark gray
        doc.text('• This e-ticket must be presented at the event entrance either printed or on a mobile device.', 20, pageHeight - 28);
        doc.text('• Please arrive at least 30 minutes before the event starts to avoid delays.', 20, pageHeight - 23);
        doc.text('• This ticket is non-transferable and valid only for the named attendee.', 20, pageHeight - 18);
        
        // Add footer
        doc.setFillColor(44, 62, 80); // #2c3e50 - dark blue
        doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(255, 255, 255); // White text for footer
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, pageHeight - 4);
        doc.text('Powered by XpressTicket', pageWidth - 10, pageHeight - 4, { align: 'right' });
        doc.text(`Ticket ${pageNum + 1} of ${pkg.tickets}`, pageWidth / 2, pageHeight - 4, { align: 'center' });
      };
      
      // Generate the specified number of tickets
      for (let i = 0; i < pkg.tickets; i++) {
        const ticketId = generateTicketId();
        addTicketToPdf(i, ticketId);
      }
      
      // Save the PDF
      doc.save(`${pkg.name.replace(/\s+/g, '_')}_${pkg.packageDetails.replace(/\s+/g, '_')}_tickets.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate ticket PDF. Please try again.');
    } finally {
      // Reset loading state
      setGeneratingPdf(prev => ({ ...prev, [pkg.email]: false }));
    }
  };

  const packageOptions = [
    { name: 'Conference Delegate', price: 'R 7,000.00' , path: '/customerticketdetails1' },
    { name: 'Day Pass', price: 'R 2,000.00', path: '/customer-ticket-details2' },
    { name: 'Student Package', price: 'R 3,500.00', path: '/customer-ticket-details3' }
  ];

  return (
    <div className="modern-dashboard-container">
      {/* Header */}
      <header className="modern-dashboard-header">
        <div className="modern-dashboard-logo-container">
          <img src="/XPRESS TICKETS LOGO2.png" alt="XpressTicket Logo" className="modern-dashboard-logo" />
        </div>
        <div className="modern-dashboard-header-actions">
          <button className="modern-dashboard-logout-btn" onClick={() => nav('/')}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="modern-dashboard-content">
        {/* Back Button */}
        <div className="modern-dashboard-back-btn-container">
          <button className="modern-dashboard-back-btn" onClick={() => nav('/parchasedticket')}>
            <FaArrowLeft /> Back to Tickets
          </button>
        </div>

        {/* Event Info Card */}
        <div className="modern-card event-details-card">
          <div className="event-header">
            <div className="event-logo">
              <img src="/ICTAS.png" alt="ICTAS Logo" />
            </div>
            <div className="event-title">
              <h1>9TH ANNUAL IEEE CONFERENCE ON INFORMATION COMMUNICATION TECHNOLOGY & SOCIETY</h1>
              <p className="event-subtitle">ICTAS 2025</p>
            </div>
          </div>
        </div>

        {/* Ticket Details Section */}
        <div className="modern-card">
          <div className="card-header">
            <h2><FaTicketAlt /> Ticket Details</h2>
            <p>Complete information about your purchased tickets</p>
          </div>
          
          <div className="modern-table-responsive">
            <table className="modern-table ticket-details-table">
              <thead>
                <tr>
                  <th>Package</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Delegation</th>
                  <th>Tickets</th>
                  <th>Duration</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg, index) => (
                  <tr key={index}>
                    <td>
                      <div className="package-cell">
                        <div className="package-type">{pkg.packageDetails}</div>
                        <div className="package-id">IEEE: {pkg.ieeeNumber}</div>
                      </div>
                    </td>
                    <td>
                      <div className="attendee-cell">
                        <div className="attendee-name">{pkg.title} {pkg.name}</div>
                        <div className="attendee-gender">{pkg.gender}</div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <div className="contact-email"><FaEnvelope /> {pkg.email}</div>
                        <div className="contact-phone"><FaPhone /> {pkg.phone}</div>
                      </div>
                    </td>
                    <td>
                      <span className="delegation-badge">{pkg.delegation}</span>
                    </td>
                    <td>
                      <span className="ticket-count">{pkg.tickets}</span>
                    </td>
                    <td>
                      {pkg.dayPass ? (
                        <div className="date-range">
                          <FaCalendarAlt /> {pkg.dayPass}
                        </div>
                      ) : (
                        <span className="not-applicable">N/A</span>
                      )}
                    </td>
                    <td>
                      <div className="amount-cell">{pkg.amount}</div>
                    </td>
                    <td>
                      <button 
                        className="modern-btn modern-btn-download"
                        onClick={() => generateTicketPDF(pkg)}
                        disabled={generatingPdf[pkg.email]}
                      >
                        {generatingPdf[pkg.email] ? 'Generating...' : <><FaDownload /> Ticket</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Section */}
        <div className="modern-card total-card">
          <div className="total-section">
            <div className="total-label">Total Amount:</div>
            <div className="total-value">R 9 000,00</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ViewMoreDetails;
