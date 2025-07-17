import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSignOutAlt, FaArrowLeft, FaDownload, FaCreditCard, FaCheck } from 'react-icons/fa';
import '../shared/ModernDashboard.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Receipt = () => {
  const nav = useNavigate();
  const location = useLocation();
  const receiptRef = useRef(null);
  // Track downloading state for each package separately
  const [isDownloading, setIsDownloading] = useState({});
  // Track payment status
  const [isPaid, setIsPaid] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState('');
  const [ticketIds, setTicketIds] = useState([]); // Store ticket IDs from the backend
  
  // Initialize purchase data from location state
  const [purchaseData, setPurchaseData] = useState({ event: {}, packages: [] });
  
  // Handle payment process
  const handlePayNow = async () => {
    if (!purchaseData || !purchaseData.packages || purchaseData.packages.length === 0) {
      alert('No ticket information available');
      return;
    }
    
    try {
      setIsProcessingPayment(true);
      
      // Get token from session storage
      const token = sessionStorage.getItem('token');
      const userId = sessionStorage.getItem('userId');
      
      if (!token || !userId) {
        alert('Authentication required. Please log in again.');
        nav('/login');
        return;
      }
      
      // Extract ticket IDs from the purchase data
      const ticketIdsToUpdate = purchaseData.packages.map(pkg => pkg.ticketId).filter(id => id);
      
      // Call the API to update ticket status to 'Approved'
      const response = await fetch('http://localhost:5000/api/update-ticket-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: parseInt(userId),
          event_id: parseInt(purchaseData.event.event_id),
          status: 'Approved'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Payment failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Set the ticket IDs from the response if available
      if (result.ticketIds) {
        setTicketIds(result.ticketIds);
      }
      
      // Show success message and reveal receipt
      setPaymentSuccessMessage('Payment successful! Your tickets are now approved.');
      setIsPaid(true);
    } catch (error) {
      console.error('Payment error:', error);
      alert(`Payment process failed: ${error.message}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };
  
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
    <div className="modern-dashboard-container" style={{ overflowX: 'hidden' }}>
      {/* Header Section */}
      <header className="modern-dashboard-header">
        <div className="header-content">
          <h1>{isPaid ? 'Receipt' : 'Complete Your Purchase'}</h1>
          <button 
            className="logout-button" 
            onClick={() => {
              sessionStorage.removeItem('token');
              sessionStorage.removeItem('userId');
              sessionStorage.removeItem('userType');
              nav('/login');
            }}
          >
            <FaSignOutAlt style={{ marginRight: '8px' }} /> Logout
          </button>
        </div>
      </header>

      {/* Back Button */}
      <div className="back-button-container">
        <button className="back-button" onClick={() => nav('/customerdash')}>
          <FaArrowLeft style={{ marginRight: '8px' }} /> Back to Dashboard
        </button>
      </div>
      
      {!isPaid ? (
        // Payment section - shown when isPaid is false
        <div className="content-container">
          <div className="payment-container" style={{ 
            textAlign: 'center',
            padding: '40px 20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            maxWidth: '600px',
            margin: '40px auto'
          }}>
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
          
          {/* Pay Now Button */}
          <div style={{ marginTop: '30px' }}>
            <button
              className="pay-now-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 30px',
                backgroundColor: isProcessingPayment ? '#cccccc' : '#4ca1af',
                background: isProcessingPayment ? '#cccccc' : 'linear-gradient(135deg, #2c3e50, #4ca1af)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 6px rgba(0,0,0,0.15)',
                minWidth: '200px'
              }}
              onClick={handlePayNow}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (
                <span>Processing...</span>
              ) : (
                <>
                  <FaCreditCard style={{ marginRight: '10px' }} />
                  Pay Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      ) : (
        <div className="content-container">
          {paymentSuccessMessage && (
            <div style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '15px 20px',
              borderRadius: '6px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <FaCheck style={{ marginRight: '10px' }} />
              {paymentSuccessMessage}
            </div>
          )}
          <div ref={receiptRef} className="receipt-container" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Purchase Confirmation</h2>
            <p style={{ textAlign: 'center', marginBottom: '30px' }}>Your payment has been processed successfully!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receipt;
