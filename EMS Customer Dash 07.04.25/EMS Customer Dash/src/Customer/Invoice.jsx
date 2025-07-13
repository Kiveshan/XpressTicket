import React, { useState, useEffect } from 'react';
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
    eventVenue: '',
    eventPrice: 'R 12,000.00',
    startDate: '',
    endDate: '',
    coverImage: ''
  };
  
  // Format dates if they exist
  const formatEventDates = () => {
    let formattedStartDate = '';
    let formattedEndDate = '';
    let dateRange = eventData.eventDate || ''; // Default to eventDate if provided
    
    try {
      // Try to get start and end dates from various sources
      const startDate = eventData.startDate || 
                       (eventData.event && eventData.event.startDate) || 
                       '';
      const endDate = eventData.endDate || 
                     (eventData.event && eventData.event.endDate) || 
                     '';
      
      if (startDate) {
        // Try to parse and format the date
        const parsedStartDate = new Date(startDate);
        if (!isNaN(parsedStartDate.getTime())) {
          formattedStartDate = parsedStartDate.toLocaleDateString('en-ZA', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          });
        } else {
          formattedStartDate = startDate; // Use as is if parsing fails
        }
      }
      
      if (endDate) {
        // Try to parse and format the date
        const parsedEndDate = new Date(endDate);
        if (!isNaN(parsedEndDate.getTime())) {
          formattedEndDate = parsedEndDate.toLocaleDateString('en-ZA', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          });
        } else {
          formattedEndDate = endDate; // Use as is if parsing fails
        }
      }
      
      // Create date range string if both dates exist
      if (formattedStartDate && formattedEndDate) {
        dateRange = `${formattedStartDate} - ${formattedEndDate}`;
      } else if (formattedStartDate) {
        dateRange = formattedStartDate;
      }
      
      // If we still don't have a date range, use eventDate as fallback
      if (!dateRange) {
        dateRange = eventData.eventDate || 'Date TBA';
      }
      
      return dateRange;
    } catch (dateErr) {
      console.error('Error formatting event dates:', dateErr);
      // Use original string if there's an error
      return eventData.eventDate || 'Date TBA';
    }
  };
  
  // Get formatted event date
  const formattedEventDate = formatEventDates();
  
  // Sample ticket data - in a real app, this would come from the database or location state
  const [ticketData, setTicketData] = useState([]);
  
  // Initialize ticket data from location state or use default values
  useEffect(() => {
    if (location.state && location.state.delegateDetails) {
      try {
        // Parse delegate details
        let delegateArray = [];
        const delegateDetails = location.state.delegateDetails;
        
        if (typeof delegateDetails === 'string') {
          try {
            const parsed = JSON.parse(delegateDetails);
            delegateArray = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {
            delegateArray = [{ name: delegateDetails }];
          }
        } else if (Array.isArray(delegateDetails)) {
          delegateArray = delegateDetails;
        } else if (typeof delegateDetails === 'object') {
          delegateArray = [delegateDetails];
        }
        
        // Create ticket data from delegate details
        const processedTickets = delegateArray.map((delegate, index) => ({
          type: location.state.packageName || 'Standard Package',
          name: delegate.name || 'N/A',
          title: delegate.title || '',
          email: delegate.email || 'N/A',
          phone: delegate.phone || 'N/A',
          delegation: delegate.delegation || 'Attendee',
          quantity: 1,
          ieeeNumber: delegate.ieeeNumber || 'N/A',
          organization: delegate.organization || 'N/A',
          unitPrice: location.state.amount || 'N/A',
          total: location.state.amount || 'N/A'
        }));
        
        setTicketData(processedTickets);
      } catch (err) {
        console.error('Error processing delegate details:', err);
        // Use default data if there's an error
        setTicketData([{ 
          type: 'VIP Pass', 
          name: 'Attendee', 
          email: 'N/A',
          phone: 'N/A',
          delegation: 'Attendee',
          quantity: 1, 
          unitPrice: eventData.eventPrice, 
          total: eventData.eventPrice 
        }]);
      }
    } else {
      // Use default data if no location state
      setTicketData([{ 
        type: 'VIP Pass', 
        name: 'Attendee', 
        email: 'N/A',
        phone: 'N/A',
        delegation: 'Attendee',
        quantity: 1, 
        unitPrice: eventData.eventPrice, 
        total: eventData.eventPrice 
      }]);
    }
  }, [location.state, eventData.eventPrice]);
  
  // Generate a unique invoice number
  const invoiceNumber = `INV-${eventData.eventId}-${Date.now().toString().slice(-6)}`;
  const purchaseDate = new Date().toLocaleDateString('en-ZA');

  const handleGoBack = () => {
    window.history.back();
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Set background color for the entire page
      doc.setFillColor(249, 250, 251); // Very light gray background
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Add header bar
      doc.setFillColor(44, 62, 80); // #2c3e50 - dark blue from our design system
      doc.rect(0, 0, pageWidth, 20, 'F');
      
      // Function to load image with promise
      const loadImage = (src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = (e) => {
            console.error('Image failed to load:', e);
            reject(e);
          };
          img.src = src;
        });
      };
      
      // Try to add logo
      try {
        const logoImg = await loadImage('/XPRESS TICKETS LOGO2.png');
        // Calculate logo dimensions and position
        const logoWidth = 40;
        const logoHeight = (logoImg.height * logoWidth) / logoImg.width;
        
        // Add logo to PDF header
        doc.addImage(logoImg, 'PNG', 10, 3, logoWidth, 15);
      } catch (logoErr) {
        console.error('Error loading logo:', logoErr);
        // Continue without logo
      }
      
      // Add invoice title in header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text for header
      doc.text('INVOICE', pageWidth - 20, 13, { align: 'right' });
      
      // Add invoice number and date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Invoice #: ${invoiceNumber}`, 20, 30);
      doc.text(`Date: ${purchaseDate}`, pageWidth - 20, 30, { align: 'right' });
      
      // Try to add event cover image if available
      let imageAdded = false;
      const coverImageHeight = 40;
      
      if (eventData.coverImage) {
        try {
          const coverImg = await loadImage(eventData.coverImage);
          // Add event cover image
          doc.addImage(coverImg, 'JPEG', 20, 40, 50, coverImageHeight, undefined, 'FAST');
          imageAdded = true;
        } catch (imgErr) {
          console.error('Error adding event cover image to PDF:', imgErr);
          // Continue without the image
        }
      }
      
      // Add event details
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 62, 80); // #2c3e50 - dark blue from our design system
      
      // Position event name based on whether image was added
      const eventNameX = imageAdded ? 80 : pageWidth / 2;
      const eventNameAlign = imageAdded ? 'left' : 'center';
      doc.text(eventData.eventName, eventNameX, 50, { align: eventNameAlign });
      
      // Add event date and location
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(73, 80, 87); // #495057 - dark gray from our design system
      
      // Use formatted date
      doc.text(`Date: ${formattedEventDate}`, eventNameX, 58, { align: eventNameAlign });
      
      // Add venue if available, otherwise use location
      const locationText = eventData.eventVenue ? 
        `Venue: ${eventData.eventVenue}, ${eventData.eventLocation}` : 
        `Location: ${eventData.eventLocation}`;
      
      doc.text(locationText, eventNameX, 65, { align: eventNameAlign });
      
      // Add line
      doc.setDrawColor(76, 161, 175); // #4ca1af - teal from our design system
      doc.setLineWidth(0.5);
      doc.line(20, 75, pageWidth - 20, 75);
        
        // Add ticket details table
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80); // #2c3e50 - dark blue from our design system
        doc.text('TICKET DETAILS', 20, 85);
        
        // Create ticket table with comprehensive information
        const ticketTableHeaders = [
          ['Attendee Information', 'Contact Details', 'Ticket Information', 'Price']
        ];
        
        const ticketTableData = ticketData.map(ticket => [
          // Attendee Information column
          `${ticket.title || ''} ${ticket.name || 'N/A'}
${ticket.organization ? `Organization: ${ticket.organization}` : ''}
${ticket.delegation ? `Delegation: ${ticket.delegation}` : ''}
${ticket.ieeeNumber ? `IEEE: ${ticket.ieeeNumber}` : ''}`,
          
          // Contact Details column
          `Email: ${ticket.email || 'N/A'}
Phone: ${ticket.phone || 'N/A'}`,
          
          // Ticket Information column
          `Type: ${ticket.type || 'Standard'}
Quantity: ${ticket.quantity || 1}`,
          
          // Price column
          `${ticket.unitPrice || 'N/A'}`
        ]);
        
        // Use autoTable as a plugin with improved styling for better readability
        autoTable(doc, {
          head: ticketTableHeaders,
          body: ticketTableData,
          startY: 90,
          theme: 'grid',
          headStyles: { 
            fillColor: [76, 161, 175], // #4ca1af - teal from our design system 
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            fontSize: 11
          },
          styles: { 
            fontSize: 9,
            cellPadding: 5,
            overflow: 'linebreak',
            lineWidth: 0.1
          },
          columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 40, halign: 'right' }
          },
          margin: { left: 20, right: 20 },
          didParseCell: function(data) {
            // Add some styling to make multiline text more readable
            if (data.section === 'body') {
              data.cell.styles.lineWidth = 0.1;
            }
          }
        });
        
        // Calculate total amount from all tickets
        let totalAmount = 0;
        try {
          // Try to parse and sum the ticket prices
          totalAmount = ticketData.reduce((sum, ticket) => {
            // Handle different currency formats
            const priceString = ticket.total || ticket.unitPrice || '0';
            const numericValue = parseFloat(priceString.replace(/[^0-9.]/g, ''));
            return sum + (isNaN(numericValue) ? 0 : numericValue);
          }, 0);
        } catch (error) {
          console.error('Error calculating total:', error);
          // Fallback to eventData price if calculation fails
          const priceString = eventData.eventPrice || '0';
          totalAmount = parseFloat(priceString.replace(/[^0-9.]/g, '')) || 0;
        }
        
        // Format total amount with currency
        const formattedTotal = `R ${totalAmount.toLocaleString('en-ZA', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;
        
        // Add total amount
        // Get the final Y position after the table
        const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 100) + 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80); // #2c3e50 - dark blue from our design system
        doc.text('Total Amount:', pageWidth - 70, finalY);
        doc.text(formattedTotal, pageWidth - 20, finalY, { align: 'right' });
        
        // Add a subtle line above the total
        doc.setDrawColor(76, 161, 175); // #4ca1af - teal from our design system
        doc.setLineWidth(0.5);
        doc.line(pageWidth - 120, finalY - 5, pageWidth - 20, finalY - 5);
        
        // Add payment information
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('PAYMENT INFORMATION', 20, finalY + 20);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Payment Status: Paid', 20, finalY + 28);
        doc.text('Payment Date: ' + purchaseDate, 20, finalY + 35);
        doc.text('Transaction ID: ' + invoiceNumber, 20, finalY + 42);
        
        // Add notes section
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('NOTES', 20, finalY + 55);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('• This invoice serves as proof of purchase for the event tickets.', 20, finalY + 63);
        doc.text('• Please retain this invoice for your records and present it if required.', 20, finalY + 70);
        
        // Add footer
        doc.setFillColor(44, 62, 80); // #2c3e50 - dark blue from our design system
        doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(255, 255, 255); // White text for footer
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, pageHeight - 4);
        doc.text('Powered by XpressTicket', pageWidth - 10, pageHeight - 4, { align: 'right' });
        
        // Save the PDF with sanitized filename
        try {
          const sanitizedName = eventData.eventName.replace(/\s+/g, '_');
          doc.save(`${sanitizedName}_Invoice_${invoiceNumber}.pdf`);
        } catch (error) {
          console.error('Error saving PDF with custom filename:', error);
          // Fallback to generic filename
          doc.save('invoice.pdf');
        }
        
        setIsGenerating(false);
      } catch (error) {
        console.error('Error generating PDF:', error);
        setIsGenerating(false);
        alert('Error generating PDF. Please try again.');
      }
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
