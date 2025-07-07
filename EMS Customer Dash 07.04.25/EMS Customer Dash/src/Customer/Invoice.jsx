import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../shared/ModernDashboard.css';
import { FaSignOutAlt, FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaDownload, FaEnvelope, FaTicketAlt } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Invoice = () => {
  const location = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Get event data from navigation state or use default values
  const eventData = location.state || {
    eventId: 'default',
    eventName: 'ICTAS 2025',
    eventDate: '29 February 2025',
    eventLocation: 'Durban',
    eventPrice: 'R 12,000.00'
  };
  
  // Sample ticket data - in a real app, this would come from the database
  const ticketData = [
    { type: 'VIP Pass', quantity: 2, unitPrice: 'R 6,000.00', total: 'R 12,000.00' }
  ];
  
  // Generate a unique invoice number
  const invoiceNumber = `INV-${eventData.eventId}-${Date.now().toString().slice(-6)}`;
  const purchaseDate = new Date().toLocaleDateString('en-ZA');

  const handleGoBack = () => {
    window.history.back();
  };

  const generatePDF = () => {
    setIsGenerating(true);
    
    // Create a new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add logo
    const logoImg = new Image();
    logoImg.src = '/XPRESS TICKETS LOGO2.png';
    
    logoImg.onload = () => {
      try {
        // Calculate logo dimensions and position
        const logoWidth = 60;
        const logoHeight = (logoImg.height * logoWidth) / logoImg.width;
        const logoX = (pageWidth - logoWidth) / 2;
        
        // Add logo to PDF
        doc.addImage(logoImg, 'PNG', logoX, 15, logoWidth, logoHeight);
        
        // Add invoice title
        doc.setFontSize(22);
        doc.setTextColor(32, 32, 32);
        doc.text('INVOICE', pageWidth / 2, 50, { align: 'center' });
        
        // Add invoice number and date
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Invoice #: ${invoiceNumber}`, 20, 60);
        doc.text(`Date: ${purchaseDate}`, pageWidth - 20, 60, { align: 'right' });
        
        // Add event details
        doc.setFontSize(16);
        doc.setTextColor(32, 201, 151); // Green color
        doc.text(eventData.eventName, pageWidth / 2, 70, { align: 'center' });
        
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text(`Date: ${eventData.eventDate} | Location: ${eventData.eventLocation}`, pageWidth / 2, 78, { align: 'center' });
        
        // Add line
        doc.setDrawColor(220, 220, 220);
        doc.line(20, 85, pageWidth - 20, 85);
        
        // Add ticket details table
        doc.setFontSize(12);
        doc.text('Ticket Details', 20, 95);
        
        // Create ticket table
        const ticketTableHeaders = [['Ticket Type', 'Quantity', 'Unit Price', 'Total']];
        const ticketTableData = ticketData.map(ticket => [
          ticket.type,
          ticket.quantity,
          ticket.unitPrice,
          ticket.total
        ]);
        
        // Use autoTable as a plugin
        autoTable(doc, {
          head: ticketTableHeaders,
          body: ticketTableData,
          startY: 100,
          theme: 'grid',
          headStyles: { fillColor: [32, 201, 151], textColor: [255, 255, 255] },
          styles: { fontSize: 10 },
          margin: { left: 20, right: 20 }
        });
        
        // Add total amount
        // Get the final Y position after the table
        const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 100) + 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Total Amount:', pageWidth - 70, finalY);
        doc.text(eventData.eventPrice, pageWidth - 20, finalY, { align: 'right' });
        
        // Add footer
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Thank you for your purchase!', pageWidth / 2, finalY + 20, { align: 'center' });
        doc.text('XpressTicket - Your Event Partner', pageWidth / 2, finalY + 26, { align: 'center' });
        
        // Save the PDF
        doc.save(`${eventData.eventName.replace(/\s+/g, '_')}_Invoice_${invoiceNumber}.pdf`);
        
        setIsGenerating(false);
      } catch (error) {
        console.error('Error generating PDF:', error);
        setIsGenerating(false);
        alert('Error generating PDF. Please try again.');
      }
    };
    
    logoImg.onerror = () => {
      console.error('Error loading logo image');
      setIsGenerating(false);
      alert('Error loading logo image. Please try again.');
    };
  };
  
  const handleDownload = (e) => {
    e.preventDefault();
    generatePDF();
  };
  
  const nav = useNavigate();

  return (
    <div className="modern-dashboard-container">
      {/* Header with Logo and Logout */}
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
        <button className="modern-back-btn" onClick={() => nav("/reviewparchase")}>
          <FaArrowLeft /> Back to Purchases
        </button>
      </div>

      <main className="modern-main-content">
        {/* Compact Invoice Card */}
        <div className="modern-invoice-card compact">
          <div className="modern-invoice-header compact">
            <img src="/XPRESS TICKETS LOGO2.png" alt="Event Logo" className="modern-invoice-logo" />
            <h2 className="modern-invoice-title">Invoice</h2>
          </div>
          
          <div className="modern-event-banner compact">
            <h3 className="modern-event-name">{eventData.eventName}</h3>
            <div className="modern-event-meta">
              <div className="modern-event-meta-item">
                <FaCalendarAlt /> {eventData.eventDate}
              </div>
              <div className="modern-event-meta-item">
                <FaMapMarkerAlt /> {eventData.eventLocation}
              </div>
            </div>
          </div>
          
          <div className="modern-invoice-content-wrapper">
            <div className="modern-invoice-details compact">
              <h4 className="modern-section-title">Invoice Details</h4>
              
              <div className="modern-invoice-table">
                <div className="modern-invoice-row">
                  <div className="modern-invoice-label">Event</div>
                  <div className="modern-invoice-value">{eventData.eventName}</div>
                </div>
                <div className="modern-invoice-row">
                  <div className="modern-invoice-label">Date</div>
                  <div className="modern-invoice-value">{eventData.eventDate}</div>
                </div>
                <div className="modern-invoice-row">
                  <div className="modern-invoice-label">Location</div>
                  <div className="modern-invoice-value">{eventData.eventLocation}</div>
                </div>
                <div className="modern-invoice-row modern-invoice-total">
                  <div className="modern-invoice-label">Total Amount</div>
                  <div className="modern-invoice-value">{eventData.eventPrice}</div>
                </div>
              </div>
            </div>
            
            <div className="modern-invoice-actions-wrapper">
              <div className="modern-invoice-actions compact">
                <button 
                  className="modern-invoice-action-btn modern-email-btn" 
                  onClick={() => alert('Invoice sent to your email!')}
                >
                  <FaEnvelope /> Email
                </button>
                <button 
                  className="modern-invoice-action-btn modern-download-btn" 
                  onClick={handleDownload}
                  disabled={isGenerating}
                >
                  <FaDownload /> {isGenerating ? 'Generating...' : 'Download'}
                </button>
                <button className="modern-invoice-action-btn modern-next-btn" onClick={() => nav('/parchasedticket', { state: eventData })}>
                  <FaTicketAlt /> View Tickets
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Use regular style tag instead of jsx style */}
      <style>{`
        /* Modern Invoice Styles - Compact Version */
        .modern-invoice-card {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
          margin: 10px auto;
          max-width: 800px;
          overflow: hidden;
        }
        
        .modern-invoice-card.compact {
          max-height: calc(100vh - 150px);
          display: flex;
          flex-direction: column;
        }
        
        .modern-invoice-header {
          background-color: #f8f9fa;
          padding: 25px;
          text-align: center;
          border-bottom: 1px solid #eee;
          position: relative;
        }
        
        .modern-invoice-header.compact {
          padding: 15px;
        }
        
        .modern-invoice-logo {
          height: 50px;
          margin-bottom: 10px;
        }
        
        .modern-invoice-title {
          font-size: 24px;
          color: #333;
          margin: 0;
          font-weight: 600;
        }
        
        .modern-event-banner {
          background: linear-gradient(135deg, #20c997, #0ca678);
          color: white;
          padding: 25px;
          text-align: center;
        }
        
        .modern-event-banner.compact {
          padding: 15px;
        }
        
        .modern-event-name {
          font-size: 22px;
          margin: 0 0 10px;
          font-weight: 600;
        }
        
        .modern-event-meta {
          display: flex;
          justify-content: center;
          gap: 30px;
        }
        
        .modern-event-meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }
        
        .modern-invoice-content-wrapper {
          display: flex;
          flex-direction: row;
          flex: 1;
        }
        
        .modern-invoice-details {
          padding: 30px;
          flex: 3;
        }
        
        .modern-invoice-details.compact {
          padding: 15px 20px;
        }
        
        .modern-section-title {
          font-size: 18px;
          color: #333;
          margin: 0 0 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #20c997;
        }
        
        .modern-invoice-table {
          width: 100%;
        }
        
        .modern-invoice-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        
        .modern-invoice-label {
          font-weight: 500;
          color: #555;
          flex: 1;
        }
        
        .modern-invoice-value {
          color: #333;
          text-align: right;
          flex: 1;
          font-weight: 500;
        }
        
        .modern-invoice-total {
          margin-top: 10px;
          border-top: 2px solid #eee;
          border-bottom: none;
          padding-top: 15px;
          font-weight: 600;
        }
        
        .modern-invoice-total .modern-invoice-label,
        .modern-invoice-total .modern-invoice-value {
          font-size: 16px;
          color: #20c997;
        }
        
        .modern-invoice-actions-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          background-color: #f8f9fa;
          border-left: 1px solid #eee;
        }
        
        .modern-invoice-actions {
          display: flex;
          gap: 10px;
          padding: 0 20px;
          width: 100%;
        }
        
        .modern-invoice-actions.compact {
          flex-direction: column;
          padding: 20px;
        }
        
        .modern-invoice-action-btn {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        
        .modern-email-btn {
          background-color: #f8f9fa;
          color: #495057;
          border: 1px solid #dee2e6;
        }
        
        .modern-email-btn:hover {
          background-color: #e9ecef;
        }
        
        .modern-download-btn {
          background-color: #20c997;
          color: white;
        }
        
        .modern-download-btn:hover {
          background-color: #0ca678;
        }
        
        .modern-next-btn {
          background-color: #343a40;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        
        .modern-next-btn:hover {
          background-color: #212529;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .modern-invoice-content-wrapper {
            flex-direction: column;
          }
          
          .modern-invoice-actions-wrapper {
            border-left: none;
            border-top: 1px solid #eee;
          }
          
          .modern-invoice-actions.compact {
            flex-direction: row;
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default Invoice;
