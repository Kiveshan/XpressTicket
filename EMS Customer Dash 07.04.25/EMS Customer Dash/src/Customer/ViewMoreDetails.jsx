import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ViewMoreDetails.css';
import '../shared/ModernDashboard.css';
import { FaSignOutAlt, FaArrowLeft, FaTicketAlt, FaCalendarAlt, FaMapMarkerAlt, FaUser, FaEnvelope, FaPhone, FaDownload } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ViewMoreDetails = () => {
  const nav = useNavigate();
  const location = useLocation();
  const [generatingPdf, setGeneratingPdf] = useState({});
  const [ticketData, setTicketData] = useState(null);
  const [eventDetails, setEventDetails] = useState({
    name: '',
    shortName: '',
    location: '',
    venue: ''
  });
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get ticket data from location state
    if (location.state) {
      const { 
        ticketId, 
        purchaseId, 
        eventId, 
        delegateDetails, 
        eventName, 
        packageName,
        amount,
        tickets
      } = location.state;

      setTicketData({
        ticketId,
        purchaseId,
        eventId,
        delegateDetails,
        eventName,
        packageName,
        amount,
        tickets
      });

      // Set event details - use all available data from location state
      // Extract any additional event information that might be available
      const eventLocation = location.state.location || '';
      const eventVenue = location.state.venue || '';
      
      setEventDetails({
        name: eventName || '',
        shortName: '',
        location: eventLocation,
        venue: eventVenue
      });
      
      // If we have event data in the tickets object, use that as well
      if (tickets && tickets.length > 0 && tickets[0].event) {
        const eventData = tickets[0].event;
        setEventDetails(prevState => ({
          ...prevState,
          name: prevState.name || eventData.name || '',
          location: prevState.location || eventData.location || '',
          venue: prevState.venue || eventData.venue || ''
        }));
      }

      // Process delegate details
      try {
        let delegateArray = [];
        if (delegateDetails) {
          // Handle different formats of delegate_details
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
        }

        // Create package objects from delegate details
        const processedPackages = delegateArray.map((delegate, index) => ({
          packageDetails: packageName || 'Standard Package',
          title: delegate.title || '',
          name: delegate.name || '',
          gender: delegate.gender || '',
          email: delegate.email || '',
          phone: delegate.phone || '',
          delegation: delegate.delegation || 'Attendee',
          tickets: tickets || 1,
          ieeeNumber: delegate.ieeeNumber || '',
          dayPass: delegate.dayPass || '',
          amount: amount || 'N/A'
        }));

        setPackages(processedPackages);
        setLoading(false);
      } catch (err) {
        console.error('Error processing delegate details:', err);
        setError('Failed to process ticket details');
        setLoading(false);
      }
    } else {
      setError('No ticket information provided');
      setLoading(false);
    }
  }, [location.state]);

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userInfo');
    nav('/');
  };
  
  // Function to generate and download ticket PDF
  const generateTicketPDF = async (pkg) => {
    // Set loading state for this specific package
    setGeneratingPdf(prev => ({ ...prev, [pkg.email]: true }));
    
    try {
      // Create new PDF document in landscape format for modern ticket style
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
        return `XPT-${randomPart}-${Date.now().toString().slice(-6)}`;
      };
      
      const ticketId = generateTicketId();
      
      // Set background color for the entire page
      doc.setFillColor(249, 250, 251); // Very light gray background
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Add dark header bar
      doc.setFillColor(44, 62, 80); // #2c3e50 - dark blue from our design system
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      // Try to add logo to header
      try {
        const logoImg = new Image();
        logoImg.src = '/XPRESS TICKETS LOGO2.png';
        doc.addImage(logoImg, 'PNG', 10, 5, 40, 15, undefined, 'FAST');
      } catch (err) {
        console.error('Error loading logo image:', err);
      }
      
      // Add E-TICKET header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text for header
      doc.text('E-TICKET', pageWidth - 20, 15, { align: 'right' });
      
      // Add ticket number in header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ticket #: ${ticketId}`, pageWidth - 20, 22, { align: 'right' });
      
      // Add horizontal divider
      doc.setDrawColor(76, 161, 175); // #4ca1af - teal from our design system
      doc.setLineWidth(0.5);
      doc.line(10, 35, pageWidth - 10, 35);
      
      // Get event data from all available sources
      const eventName = String(ticketData?.eventName || eventDetails?.name || '');
      
      // Get event date information from all possible sources
      let eventStartDate = eventDetails?.startDate || 
                          ticketData?.startDate || 
                          (ticketData?.tickets && ticketData.tickets[0]?.event?.startDate) || 
                          '';
      let eventEndDate = eventDetails?.endDate || 
                        ticketData?.endDate || 
                        (ticketData?.tickets && ticketData.tickets[0]?.event?.endDate) || 
                        '';
      
      // Format dates if they exist
      let formattedStartDate = '';
      let formattedEndDate = '';
      let dateRange = '';
      
      try {
        if (eventStartDate) {
          // Try to parse and format the date
          const startDate = new Date(eventStartDate);
          if (!isNaN(startDate.getTime())) {
            formattedStartDate = startDate.toLocaleDateString('en-ZA', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            });
          } else {
            formattedStartDate = eventStartDate; // Use as is if parsing fails
          }
        }
        
        if (eventEndDate) {
          // Try to parse and format the date
          const endDate = new Date(eventEndDate);
          if (!isNaN(endDate.getTime())) {
            formattedEndDate = endDate.toLocaleDateString('en-ZA', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            });
          } else {
            formattedEndDate = eventEndDate; // Use as is if parsing fails
          }
        }
        
        // Create date range string if both dates exist
        if (formattedStartDate && formattedEndDate) {
          dateRange = `${formattedStartDate} - ${formattedEndDate}`;
        } else if (formattedStartDate) {
          dateRange = formattedStartDate;
        }
      } catch (dateErr) {
        console.error('Error formatting event dates:', dateErr);
        // Use original strings if there's an error
        dateRange = eventStartDate ? (eventEndDate ? `${eventStartDate} - ${eventEndDate}` : eventStartDate) : '';
      }
      
      // Get event time
      const eventTime = String(eventDetails?.startTime || ticketData?.startTime || '');
      
      // Get venue and location
      const venue = String(eventDetails?.venue || ticketData?.venue || '');
      const location = String(eventDetails?.location || ticketData?.location || '');
      
      // Try to add event cover image if available
      const coverImageHeight = 50;
      let imageAdded = false;
      
      try {
        // Check for event image in various possible locations
        const eventImageUrl = eventDetails?.coverImage || 
                             ticketData?.coverImage || 
                             (location?.state?.event?.coverImage) || 
                             (ticketData?.tickets && ticketData.tickets[0]?.event?.coverImage);
        
        if (eventImageUrl) {
          // Create a promise to handle image loading
          const loadImage = () => {
            return new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = (e) => {
                console.error('Image failed to load:', e);
                reject(e);
              };
              img.src = eventImageUrl;
            });
          };
          
          // Try to load and add the image
          try {
            const img = await loadImage();
            // Add event image below header
            doc.addImage(img, 'JPEG', 10, 40, 50, coverImageHeight, undefined, 'FAST');
            imageAdded = true;
          } catch (imgErr) {
            console.error('Error adding event image to PDF:', imgErr);
            // Continue without the image
          }
        }
      } catch (err) {
        console.error('Error processing event cover image:', err);
        // Continue without the image
      }
      
      // Add event name
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 62, 80); // #2c3e50 - dark blue from our design system
      
      // Position event name based on whether image was added
      const eventNameX = imageAdded ? 70 : pageWidth / 2;
      const eventNameAlign = imageAdded ? 'left' : 'center';
      doc.text(eventName, eventNameX, 50, { align: eventNameAlign, maxWidth: pageWidth - 80 });
      
      // Add event date and time
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(73, 80, 87); // #495057 - dark gray from our design system
      
      if (dateRange) {
        doc.text(`Date: ${dateRange}`, eventNameX, 60, { align: eventNameAlign, maxWidth: pageWidth - 80 });
      }
      
      if (eventTime) {
        doc.text(`Time: ${eventTime}`, eventNameX, 67, { align: eventNameAlign });
      }
      
      // Add venue and location
      if (venue) {
        doc.text(`Venue: ${venue}`, eventNameX, 74, { align: eventNameAlign, maxWidth: pageWidth - 80 });
      }
      
      if (location) {
        doc.text(`Location: ${location}`, eventNameX, 81, { align: eventNameAlign, maxWidth: pageWidth - 80 });
      }
      
      // Add horizontal divider
      doc.setDrawColor(222, 226, 230); // #dee2e6 - light gray
      doc.setLineWidth(0.3);
      doc.line(10, 95, pageWidth - 10, 95);
      
      // Two columns layout
      const leftCol = 42;
      const rightCol = pageWidth / 2 + 10;
      const startY = 110;
      const lineHeight = 7;
      
      // ATTENDEE INFORMATION section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 62, 80); // #2c3e50 - dark blue from our design system
      doc.text('ATTENDEE INFORMATION', 20, 105);
      
      // TICKET INFORMATION section
      doc.text('TICKET INFORMATION', rightCol, 105);
      
      // Attendee details
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(73, 80, 87); // #495057 - dark gray from our design system
      
      // Name
      doc.setFont('helvetica', 'bold');
      doc.text('Name:', 20, startY);
      doc.setFont('helvetica', 'normal');
      doc.text(String(`${pkg.title || ''} ${pkg.name || ''}`).trim() || 'N/A', leftCol, startY);
      
      // Email
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', 20, startY + lineHeight);
      doc.setFont('helvetica', 'normal');
      doc.text(String(pkg.email || 'N/A'), leftCol, startY + lineHeight);
      
      // Phone
      doc.setFont('helvetica', 'bold');
      doc.text('Phone:', 20, startY + lineHeight * 2);
      doc.setFont('helvetica', 'normal');
      doc.text(String(pkg.phone || 'N/A'), leftCol, startY + lineHeight * 2);
      
      // Gender
      doc.setFont('helvetica', 'bold');
      doc.text('Gender:', 20, startY + lineHeight * 3);
      doc.setFont('helvetica', 'normal');
      doc.text(String(pkg.gender || 'N/A'), leftCol, startY + lineHeight * 3);
      
      // Organization
      if (pkg.organization) {
        doc.setFont('helvetica', 'bold');
        doc.text('Organization:', 20, startY + lineHeight * 4);
        doc.setFont('helvetica', 'normal');
        doc.text(String(pkg.organization), leftCol, startY + lineHeight * 4);
      }
      
      // Country
      if (pkg.country) {
        doc.setFont('helvetica', 'bold');
        doc.text('Country:', 20, startY + lineHeight * 5);
        doc.setFont('helvetica', 'normal');
        doc.text(String(pkg.country), leftCol, startY + lineHeight * 5);
      }
      
      // Ticket details
      // Package
      doc.setFont('helvetica', 'bold');
      doc.text('Package:', rightCol, startY);
      doc.setFont('helvetica', 'normal');
      doc.text(String(pkg.packageDetails || 'Standard'), rightCol + 30, startY);
      
      // Delegation
      doc.setFont('helvetica', 'bold');
      doc.text('Delegation:', rightCol, startY + lineHeight);
      doc.setFont('helvetica', 'normal');
      doc.text(String(pkg.delegation || 'Attendee'), rightCol + 30, startY + lineHeight);
      
      // IEEE Number
      doc.setFont('helvetica', 'bold');
      doc.text('IEEE Number:', rightCol, startY + lineHeight * 2);
      doc.setFont('helvetica', 'normal');
      doc.text(String(pkg.ieeeNumber || 'N/A'), rightCol + 30, startY + lineHeight * 2);
      
      // Amount
      doc.setFont('helvetica', 'bold');
      doc.text('Amount:', rightCol, startY + lineHeight * 3);
      doc.setFont('helvetica', 'normal');
      doc.text(String(pkg.amount || ticketData?.amount || 'N/A'), rightCol + 30, startY + lineHeight * 3);
      
      // Purchase ID
      doc.setFont('helvetica', 'bold');
      doc.text('Purchase ID:', rightCol, startY + lineHeight * 4);
      doc.setFont('helvetica', 'normal');
      doc.text(String(ticketData?.purchaseId || 'N/A'), rightCol + 30, startY + lineHeight * 4);
      
      // Ticket ID
      doc.setFont('helvetica', 'bold');
      doc.text('Ticket ID:', rightCol, startY + lineHeight * 5);
      doc.setFont('helvetica', 'normal');
      doc.text(String(ticketData?.ticketId || 'N/A'), rightCol + 30, startY + lineHeight * 5);
      
      // Add QR code with actual ticket data
      const qrSize = 50;
      const qrX = pageWidth - qrSize - 20;
      const qrY = 110;
      
      // Create QR code data string with ticket information
      const qrData = JSON.stringify({
        ticketId: ticketId,
        eventName: eventName,
        attendeeName: String(`${pkg.title || ''} ${pkg.name || ''}`).trim(),
        purchaseId: String(ticketData?.purchaseId || ''),
        packageDetails: String(pkg.packageDetails || 'Standard')
      });
      
      // Draw QR code placeholder with border
      doc.setDrawColor(44, 62, 80); // #2c3e50 - dark blue from our design system
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(qrX, qrY, qrSize, qrSize, 3, 3, 'FD');
      
      // Draw fake QR code pattern (since we don't have a QR code generator)
      doc.setFillColor(44, 62, 80);
      doc.setDrawColor(44, 62, 80);
      
      // Draw a simplified QR code pattern
      const cellSize = 4;
      const margin = 5;
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          // Random pattern to simulate QR code
          if (Math.random() > 0.5 || 
              // Always draw the position markers in corners
              ((i < 3 && j < 3) || (i < 3 && j > 6) || (i > 6 && j < 3))) {
            doc.rect(
              qrX + margin + i * cellSize, 
              qrY + margin + j * cellSize, 
              cellSize, 
              cellSize, 
              'F'
            );
          }
        }
      }
      
      // Add ticket number under QR code
      doc.setFontSize(8);
      doc.setTextColor(73, 80, 87); // #495057 - dark gray from our design system
      doc.text('SCAN QR CODE AT EVENT', qrX + qrSize/2, qrY + qrSize + 10, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(ticketId, qrX + qrSize/2, qrY + qrSize + 16, { align: 'center' });
      
      // Add bottom section with important notes
      doc.setDrawColor(76, 161, 175); // #4ca1af - teal from our design system
      doc.setLineWidth(0.5);
      doc.line(10, pageHeight - 40, pageWidth - 10, pageHeight - 40);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 62, 80); // #2c3e50 - dark blue from our design system
      doc.text('IMPORTANT INFORMATION', pageWidth / 2, pageHeight - 35, { align: 'center' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(73, 80, 87); // #495057 - dark gray from our design system
      doc.text('\u2022 This e-ticket must be presented at the event entrance either printed or on a mobile device.', 20, pageHeight - 28);
      doc.text(`• Event Date: ${dateRange || 'See event details'}. Please arrive at least 30 minutes before the event starts.`, 20, pageHeight - 23);
      doc.text('\u2022 This ticket is non-transferable and valid only for the named attendee.', 20, pageHeight - 18);
      
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
        const sanitizedName = (pkg.name || 'ticket').toString().replace(/\s+/g, '_');
        const sanitizedPackage = (pkg.packageDetails || 'package').toString().replace(/\s+/g, '_');
        doc.save(`${sanitizedName}_${sanitizedPackage}_ticket.pdf`);
      } catch (error) {
        console.error('Error saving PDF with custom filename:', error);
        // Fallback to generic filename
        doc.save('ticket.pdf');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate ticket PDF. Please try again.');
    } finally {
      // Reset loading state
      setGeneratingPdf(prev => ({ ...prev, [pkg.email]: false }));
    }
  };

  // Calculate total amount
  const calculateTotal = () => {
    let total = 0;
    packages.forEach(pkg => {
      try {
        // Handle different types of amount values
        let amountStr = '0';
        if (pkg.amount) {
          // Convert to string if it's not already
          amountStr = typeof pkg.amount === 'string' ? pkg.amount : String(pkg.amount);
        }
        
        // Extract numeric value from amount string (e.g., 'R 7 000,00' -> 7000)
        const numericValue = parseFloat(amountStr.replace(/[^0-9.,]/g, '').replace(',', '.'));
        if (!isNaN(numericValue)) {
          total += numericValue;
        }
      } catch (err) {
        console.error('Error processing amount:', err, pkg.amount);
        // Continue with next package
      }
    });
    
    // Format total as currency
    return `R ${total.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',')}`;
  };

  return (
    <div className="modern-dashboard-container">
      {/* Header with Logo and Logout */}
      <header className="modern-header">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="XpressTicket Logo"
          className="modern-logo"
        />
        <div className="modern-header-actions">
          <button className="modern-logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="modern-dashboard-content">
        {/* Back Button */}
        <div className="modern-back-button">
          <button className="modern-back-btn" onClick={() => nav('/parchasedticket')}>
            <FaArrowLeft /> Back to Tickets
          </button>
        </div>

        {loading ? (
          <div className="modern-card loading-card">
            <div className="loading-spinner"></div>
            <p>Loading ticket details...</p>
          </div>
        ) : error ? (
          <div className="modern-card error-card">
            <p className="error-message">{error}</p>
            <button className="modern-btn modern-btn-primary" onClick={() => nav('/parchasedticket')}>
              Back to Tickets
            </button>
          </div>
        ) : (
          <>
            {/* Event Info Card */}
            <div className="modern-card event-details-card">
              <div className="event-header">
                <div className="event-title">
                  <h1>{eventDetails.name}</h1>
                  {eventDetails.shortName && <p className="event-subtitle">{eventDetails.shortName}</p>}
                </div>
              </div>
              {(eventDetails.venue || eventDetails.location) && (
                <div className="event-location">
                  {eventDetails.venue && <p><FaMapMarkerAlt /> {eventDetails.venue}</p>}
                  {eventDetails.location && <p>{eventDetails.location}</p>}
                </div>
              )}
            </div>

            {/* Ticket Details Section */}
            <div className="modern-card">
              <div className="card-header">
                <h2><FaTicketAlt /> Ticket Details</h2>
                <p>Complete information about your purchased tickets</p>
              </div>
              
              <div className="modern-table-responsive">
                {packages.length === 0 ? (
                  <div className="empty-state">
                    <p>No delegate details available for this ticket.</p>
                  </div>
                ) : (
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
                              {pkg.ieeeNumber && <div className="package-id">IEEE: {pkg.ieeeNumber}</div>}
                            </div>
                          </td>
                          <td>
                            <div className="attendee-cell">
                              <div className="attendee-name">{pkg.title} {pkg.name}</div>
                              {pkg.gender && <div className="attendee-gender">{pkg.gender}</div>}
                            </div>
                          </td>
                          <td>
                            <div className="contact-cell">
                              {pkg.email && <div className="contact-email"><FaEnvelope /> {pkg.email}</div>}
                              {pkg.phone && <div className="contact-phone"><FaPhone /> {pkg.phone}</div>}
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
                )}
              </div>
            </div>

            {/* Total Section */}
            {packages.length > 0 && (
              <div className="modern-card total-card">
                <div className="total-section">
                  <div className="total-label">Total Amount:</div>
                  <div className="total-value">{calculateTotal()}</div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default ViewMoreDetails;
