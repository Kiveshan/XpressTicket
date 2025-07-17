import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSignOutAlt, FaArrowLeft, FaDownload } from 'react-icons/fa';
import '../shared/ModernDashboard.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Receipt = () => {
  const nav = useNavigate();
  const location = useLocation();
  const receiptRef = useRef(null);
  // Track downloading state for each package separately
  const [isDownloading, setIsDownloading] = useState({});
  
  // Initialize purchase data from location state
  const [purchaseData, setPurchaseData] = useState({ event: {}, packages: [] });
  
  // Redirect if no data is present
  useEffect(() => {
    if (location.state?.purchaseData) {
      console.log('Receipt data received:', location.state.purchaseData);
      // Log the event object structure for debugging
      console.log('Event data structure:', location.state.purchaseData.event);
      setPurchaseData(location.state.purchaseData);
    } else {
      // If no data is passed, redirect back to dashboard
      console.log('No purchase data found, redirecting...');
      setTimeout(() => {
        nav('/customerdash');
      }, 1000);
    }
  }, [location, nav]);

  // Calculate totals
  const [totals, setTotals] = useState({
    subtotal: 0,
    tax: 0,
    total: 0,
  });

  useEffect(() => {
    // Calculate totals from packages
    if (purchaseData.packages && purchaseData.packages.length > 0) {
      let subtotal = 0;
      
      purchaseData.packages.forEach(pkg => {
        // Extract numeric price from amount (remove R, spaces, commas)
        const priceStr = pkg.amount.replace(/[R\s,]/g, '');
        const price = parseFloat(priceStr);
        if (!isNaN(price)) {
          subtotal += price;
        }
      });
      
      // Calculate tax (15% VAT for South Africa)
      const tax = subtotal * 0.15;
      const total = subtotal + tax;
      
      setTotals({
        subtotal,
        tax,
        total
      });
    }
  }, [purchaseData]);

  // Format currency consistently
  const formatCurrency = (amount) => {
    return `R ${amount.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };
  
  // Helper function to fix duplicated URLs
  const fixImageUrl = (url) => {
    if (!url) return '';
    
    // Check if the URL has a duplicated base URL
    const s3BaseUrl = 'https://xpressticket.s3.af-south-1.amazonaws.com/';
    
    if (url && url.includes(s3BaseUrl + s3BaseUrl)) {
      // Remove the duplicate base URL
      return url.replace(s3BaseUrl + s3BaseUrl, s3BaseUrl);
    }
    
    return url;
  };

  // Handle download ticket
  const handleDownload = async (pkg, index) => {
    if (!purchaseData || !purchaseData.packages || purchaseData.packages.length === 0) {
      alert('No ticket information available');
      return;
    }
    
    try {
      // Set the specific package as downloading
      setIsDownloading(prev => ({ ...prev, [index]: true }));
      
      // Use the provided package
      
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
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Add header with gradient
      doc.setFillColor(44, 62, 80); // #2c3e50 - dark blue from our design system
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      // Add logo
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('XpressTicket', 15, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Your Official Event Ticket', 15, 25);
      
      // Add ticket type badge
      doc.setFillColor(76, 161, 175); // #4ca1af - teal from our design system
      doc.roundedRect(pageWidth - 60, 10, 45, 15, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      
      // Get package name from the purchaseData
      const packageName = pkg.packageName || pkg.package || 'Standard Package';
      doc.text(packageName.toUpperCase(), pageWidth - 38, 20, { align: 'center' });
      
      // Extract event information
      const eventName = purchaseData.event?.name || 'Event';
      const venue = purchaseData.event?.venue || '';
      const location = purchaseData.event?.location || '';
      
      // Extract date and time information if available
      const eventDate = purchaseData.event?.formattedDate || 
                     purchaseData.event?.startdate || 
                     purchaseData.event?.start_date || 
                     purchaseData.event?.date || 
                     'TBA';
      
      const eventTime = purchaseData.event?.formattedTime || 
                      purchaseData.event?.time || 
                      purchaseData.event?.start_time || 
                      'TBA';
      
      // Try to add event cover image if available
      const coverImageHeight = 50;
      let imageAdded = false;
      
      try {
        // Check for event image
        let eventImageUrl = purchaseData.event?.coverImage;
        
        // Fix the URL if it has duplicated base URLs
        eventImageUrl = fixImageUrl(eventImageUrl);
        
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
      
      if (eventDate) {
        doc.text(`Date: ${eventDate}`, eventNameX, 60, { align: eventNameAlign, maxWidth: pageWidth - 80 });
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
      
      // Extract user details from purchaseData
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const name = userInfo.name || 'Attendee';
      const email = userInfo.email || '';
      const phone = userInfo.phone || '';
      
      // Attendee details
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(73, 80, 87); // #495057 - dark gray from our design system
      
      // Name
      doc.setFont('helvetica', 'bold');
      doc.text('Name:', 20, startY);
      doc.setFont('helvetica', 'normal');
      doc.text(name, leftCol, startY);
      
      // Email
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', 20, startY + lineHeight);
      doc.setFont('helvetica', 'normal');
      doc.text(email, leftCol, startY + lineHeight);
      
      // Phone
      doc.setFont('helvetica', 'bold');
      doc.text('Phone:', 20, startY + lineHeight * 2);
      doc.setFont('helvetica', 'normal');
      doc.text(phone || 'N/A', leftCol, startY + lineHeight * 2);
      
      // Ticket information
      doc.setFont('helvetica', 'bold');
      doc.text('Ticket ID:', rightCol, startY);
      doc.setFont('helvetica', 'normal');
      doc.text(ticketId, rightCol + 30, startY);
      
      // Package
      doc.setFont('helvetica', 'bold');
      doc.text('Package:', rightCol, startY + lineHeight);
      doc.setFont('helvetica', 'normal');
      doc.text(packageName, rightCol + 30, startY + lineHeight);
      
      // Number of tickets
      doc.setFont('helvetica', 'bold');
      doc.text('Tickets:', rightCol, startY + lineHeight * 2);
      doc.setFont('helvetica', 'normal');
      // Check multiple possible field names for ticket count
      const ticketCountValue = pkg.ticketCount || pkg.quantity || pkg.count || pkg.tickets || 1;
      doc.text(ticketCountValue.toString(), rightCol + 30, startY + lineHeight * 2);
      
      // Amount
      doc.setFont('helvetica', 'bold');
      doc.text('Amount:', rightCol, startY + lineHeight * 3);
      doc.setFont('helvetica', 'normal');
      doc.text(pkg.amount || formatCurrency(totals.total), rightCol + 30, startY + lineHeight * 3);
      
      // Add QR code placeholder
      const qrSize = 40;
      const qrX = pageWidth - qrSize - 20;
      const qrY = startY - 5;
      
      // Draw QR code placeholder with black squares
      doc.setFillColor(0, 0, 0);
      
      // Draw a border for the QR code
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(qrX, qrY, qrSize, qrSize);
      
      // Create a simple pattern to simulate a QR code
      const cellSize = qrSize / 10;
      const margin = 0;
      
      // Create a simple pattern to simulate a QR code
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
      doc.text('• This e-ticket must be presented at the event entrance either printed or on a mobile device.', 20, pageHeight - 28);
      doc.text(`• Event Date: ${eventDate}. Please arrive at least 30 minutes before the event starts.`, 20, pageHeight - 23);
      doc.text('• This ticket is non-transferable and valid only for the named attendee.', 20, pageHeight - 18);
      
      // Add footer
      doc.setFillColor(44, 62, 80); // #2c3e50 - dark blue from our design system
      doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255); // White text for footer
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, pageHeight - 4);
      doc.text('Powered by XpressTicket', pageWidth - 10, pageHeight - 4, { align: 'right' });
      
      // Generate filename and save the PDF
      const dateStr = new Date().toISOString().slice(0, 10);
      const sanitizedEvent = eventName.replace(/[^a-z0-9]/gi, '-');
      const filename = `${sanitizedEvent}_ticket_${dateStr}.pdf`;
      
      // Save the PDF
      doc.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to download ticket. Please try again.');
    } finally {
      // Reset downloading state for this specific package
      setIsDownloading(prev => ({ ...prev, [index]: false }));
    }
  };

  // Generate receipt date
  const receiptDate = new Date().toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generate receipt number
  const receiptNumber = `XPT-${Date.now().toString().slice(-8)}`;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa'
    }}>
      {/* Modern Header */}
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
      
      {/* Back Button - Modern Style */}
      <div className="modern-back-button-container">
        <button className="modern-back-btn" onClick={() => nav('/customerdash')}>
          <FaArrowLeft /> Back to Dashboard
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        flex: 1
      }}>
        {/* Receipt Card - Simplified Checkout Style */}
        <div ref={receiptRef} style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          padding: '30px',
          marginBottom: '20px'
        }}>
          {/* Receipt Header with Company */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div>
              <p style={{
                fontSize: '16px',
                color: '#6c757d',
                margin: '0'
              }}>Receipt from</p>
              <h2 style={{
                fontSize: '18px',
                color: '#2c3e50',
                margin: '4px 0 0 0',
                fontWeight: '600'
              }}>XpressTicket</h2>
            </div>
            <img
              src="/XPRESS TICKETS LOGO2.png"
              alt="XpressTicket Logo"
              style={{
                height: '40px'
              }}
            />
          </div>

          {/* Large Price Display */}
          <div style={{
            marginBottom: '20px',
            borderBottom: '1px solid #eee',
            paddingBottom: '20px'
          }}>
            <h1 style={{
              fontSize: '38px',
              fontWeight: '700',
              margin: '0 0 5px 0',
              color: '#2c3e50'
            }}>{formatCurrency(totals.total)}</h1>
            <p style={{
              fontSize: '14px',
              color: '#6c757d',
              margin: '0'
            }}>Paid {receiptDate}</p>
          </div>
          
          {/* Receipt details section starts directly here */}

          {/* Receipt Details */}
          <div style={{
            marginBottom: '25px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              padding: '8px 0',
              borderBottom: '1px solid #f5f5f5'
            }}>
              <span style={{ color: '#6c757d' }}>Receipt number</span>
              <span style={{ fontWeight: '500' }}>{receiptNumber}</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              padding: '8px 0',
              borderBottom: '1px solid #f5f5f5'
            }}>
              <span style={{ color: '#6c757d' }}>Event</span>
              <span style={{ fontWeight: '500' }}>{purchaseData.event?.name || 'Event'}</span>
            </div>
          </div>

          {/* Event Summary */}
          <div style={{
            marginBottom: '25px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{
              marginBottom: '15px'
            }}>
              <h3 style={{
                fontSize: '16px',
                margin: '0 0 15px 0'
              }}>{purchaseData.event?.name || 'Event'}</h3>
              <div style={{
                fontSize: '14px',
                color: '#495057'
              }}>
                <p style={{ margin: '5px 0' }}>
                  <span style={{ color: '#6c757d' }}>Location:</span> {purchaseData.event?.location || 'TBA'}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <span style={{ color: '#6c757d' }}>Date:</span> {
                    purchaseData.event?.formattedDate ||
                    purchaseData.event?.startdate ||
                    purchaseData.event?.start_date ||
                    purchaseData.event?.date ||
                    'TBA'
                  }
                </p>
                <p style={{ margin: '5px 0' }}>
                  <span style={{ color: '#6c757d' }}>Time:</span> {
                    purchaseData.event?.formattedTime ||
                    purchaseData.event?.time ||
                    purchaseData.event?.start_time ||
                    'TBA'
                  }
                </p>
              </div>
            </div>
          </div>
          
          {/* Items List */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{
              fontSize: '14px',
              margin: '0 0 10px 0',
              fontWeight: '600',
              color: '#2c3e50'
            }}>Items</h4>
            
            {purchaseData.packages.map((pkg, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '14px',
                padding: '10px 0',
                borderBottom: index < purchaseData.packages.length - 1 ? '1px solid #f5f5f5' : 'none'
              }}>
                <div>
                  <div style={{ fontWeight: '500', marginBottom: '3px' }}>{pkg.packageDetails}</div>
                  <div style={{ fontSize: '13px', color: '#6c757d' }}>Quantity: {pkg.tickets}</div>
                </div>
                <div style={{ fontWeight: '500' }}>
                  {pkg.amount}
                </div>
              </div>
            ))}
          </div>
          
          {/* Totals */}
          <div style={{ marginTop: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              marginBottom: '8px',
              color: '#6c757d'
            }}>
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              marginBottom: '8px',
              color: '#6c757d'
            }}>
              <span>VAT (15%)</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '16px',
              fontWeight: '600',
              color: '#2c3e50',
              marginTop: '15px',
              paddingTop: '15px',
              borderTop: '1px solid #eee'
            }}>
              <span>Amount paid</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
          
          {/* Contact Info */}
          <div style={{
            marginTop: '30px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#6c757d'
          }}>
            <p style={{ margin: '0' }}>Questions? Contact us at <span style={{ color: '#4ca1af', cursor: 'pointer' }}>support@xpressticket.com</span></p>
          </div>
        </div>

        {/* Ticket List with Download Buttons */}
        <div className="ticket-list-container" style={{ marginTop: '30px', marginBottom: '30px' }}>
          <h3 style={{ fontSize: '18px', margin: '0 0 15px', color: '#2c3e50', textAlign: 'center' }}>Your Tickets</h3>
          
          {purchaseData.packages && purchaseData.packages.length > 0 ? (
            <div className="ticket-list">
              {purchaseData.packages.map((pkg, index) => {
                // Determine the person name from the package data
                // First check if delegate info exists
                let personName = '';
                if (pkg.delegateInfo) {
                  try {
                    // Try to parse delegate info if it's a string
                    const delegateData = typeof pkg.delegateInfo === 'string' 
                      ? JSON.parse(pkg.delegateInfo) 
                      : pkg.delegateInfo;
                    
                    if (delegateData && delegateData.length > 0 && delegateData[0].name) {
                      personName = delegateData[0].name;
                    }
                  } catch (e) {
                    console.error('Error parsing delegate info:', e);
                  }
                }
                
                // Fall back to ticket holder name if available
                if (!personName && pkg.ticketHolder) {
                  personName = pkg.ticketHolder;
                }
                
                // If still no name, fall back to the package name
                if (!personName) {
                  personName = pkg.packageName || pkg.package || `Ticket ${index + 1}`;
                }
                
                // Get the package details
                const packageName = pkg.packageName || pkg.package || 'Standard Package';
                
                // Get ticket count - check multiple possible field names
                const ticketCount = pkg.ticketCount || pkg.quantity || pkg.count || pkg.tickets || 1;
                const amount = pkg.amount || formatCurrency(totals.total / purchaseData.packages.length);
                
                return (
                  <div 
                    key={index} 
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '15px',
                      marginBottom: '10px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      flexWrap: 'nowrap' // Prevent wrapping on smaller screens
                    }}
                  >
                    {/* Ticket Details (Left Side) */}
                    <div className="ticket-details" style={{ flex: '1', paddingRight: '15px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2c3e50', marginBottom: '4px' }}>
                        {personName}
                      </div>
                      <div style={{ fontSize: '14px', color: '#495057' }}>
                        Package: {packageName}
                      </div>
                      <div style={{ fontSize: '14px', color: '#495057', display: 'flex', gap: '15px' }}>
                        <span>Tickets: {ticketCount}</span>
                        <span>Amount: {amount}</span>
                      </div>
                    </div>
                    
                    {/* Download Button (Right Side) */}
                    <div className="ticket-action" style={{ minWidth: '140px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="download-btn"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px 15px',
                          backgroundColor: isDownloading[index] ? '#cccccc' : '#4ca1af',
                          background: isDownloading[index] ? '#cccccc' : 'linear-gradient(135deg, #2c3e50, #4ca1af)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: isDownloading[index] ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          whiteSpace: 'nowrap',
                          minWidth: '125px'
                        }}
                        onClick={() => handleDownload(pkg, index)}
                        disabled={isDownloading[index]}
                      >
                        {isDownloading[index] ? (
                          <span>Generating...</span>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                            </svg>
                            {personName.length > 15 ? 
                              `Download Ticket` : 
                              `Download for ${personName}`
                            }
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ textAlign: 'center' }}>No tickets available for download.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Receipt;
