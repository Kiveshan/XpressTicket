import React, { useState, useEffect } from 'react';
import './ConfirmTicketPackage.css';
import '../shared/ModernDashboard.css';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaSignOutAlt, FaArrowLeft } from 'react-icons/fa';
import EventImage from '../utils/EventImage';

// Helper function for consistent price formatting
const formatPrice = (price) => {
  // Convert to number if it's a string
  let numericPrice;
  if (typeof price === 'string') {
    // Remove 'R' and any spaces or commas
    numericPrice = parseFloat(price.replace(/[R\s,]/g, ''));
  } else {
    numericPrice = price;
  }
  
  // Check if it's a valid number
  if (isNaN(numericPrice)) {
    return 'R 0.00';
  }
  
  // Format with thousand separator and 2 decimal places
  return `R ${numericPrice.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const ConfirmTicketPackage = () => {
  const nav = useNavigate();
  const { eventId, packageIndex } = useParams();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [event, setEvent] = useState(null);
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Get delegates from location state, session storage, or use empty array as fallback
  const [packages, setPackages] = useState(() => {
    let initialPackages = [];
    
    // First check if we have delegates in location state (coming from ticket details page)
    if (location.state?.delegates) {
      initialPackages = location.state.delegates;
    } else {
      // Then check if we have stored packages in session storage (coming back from adding a package)
      const storedPackages = sessionStorage.getItem('currentPackages');
      if (storedPackages) {
        // Clear the session storage to avoid using it again unintentionally
        sessionStorage.removeItem('currentPackages');
        try {
          initialPackages = JSON.parse(storedPackages);
        } catch (e) {
          console.error('Error parsing stored packages:', e);
        }
      }
    }
    
    // Format all package amounts consistently
    if (initialPackages.length > 0) {
      initialPackages = initialPackages.map(pkg => {
        // First ensure unitPrice is properly stored for future calculations
        if (pkg.amount && !pkg.unitPrice) {
          // Extract numeric price from amount
          const priceValue = parseFloat(pkg.amount.replace(/[R\s,]/g, ''));
          // Store as unitPrice if we need it for calculations later
          pkg.unitPrice = priceValue.toString();
        }
        
        // Format amount consistently
        if (pkg.amount) {
          pkg.amount = formatPrice(pkg.amount);
        }
        
        return pkg;
      });
    }
    
    // Return the packages with formatted amounts
    return initialPackages;
  });

  // Function to remove a package from the list
  const removePackage = (index) => {
    const updatedPackages = [...packages];
    updatedPackages.splice(index, 1);
    setPackages(updatedPackages);
  };
  
  // Function to update package details
  const updatePackageDetail = (index, field, value) => {
    const updatedPackages = [...packages];
    updatedPackages[index][field] = value;
    
    // If the number of tickets is updated, adjust the amount
    if (field === 'tickets') {
      // Get the base price (unit price) stored in the package
      const basePrice = parseFloat(updatedPackages[index].unitPrice.replace(/,/g, ''));
      const ticketCount = parseInt(value) || 1;
      
      // Ensure ticket count is at least 1
      const safeTicketCount = ticketCount < 1 ? 1 : ticketCount;
      
      // Calculate the new total amount by multiplying base price by ticket count
      const totalAmount = basePrice * safeTicketCount;
      
      // Use the helper function for consistent formatting
      updatedPackages[index].amount = formatPrice(totalAmount);
      
      // Ensure the tickets field is also updated with the safe value
      if (safeTicketCount !== ticketCount) {
        updatedPackages[index].tickets = safeTicketCount.toString();
      }
    }
    
    setPackages(updatedPackages);
  };

  // Fetch event and package data
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        console.log(`Fetching event details for ID: ${eventId}`);
        
        // Get the authentication token from session storage
        const token = sessionStorage.getItem('token');
        
        if (!token) {
          console.warn('No authentication token found in session storage');
          // Redirect to login if no token is found
          nav('/login');
          return;
        }
        
        const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch event details: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched event details:', data);
        setEvent(data);
        
        // Process packages from the event data
        if (data.packages && Array.isArray(data.packages) && data.packages[packageIndex]) {
          const pkg = data.packages[packageIndex];
          console.log('Selected package:', pkg);
          
          // Parse package data
          let parsedPackage;
          if (typeof pkg === 'string') {
            try {
              // Try to parse as JSON
              if (pkg.startsWith('{') && pkg.endsWith('}')) {
                const cleanedStr = pkg.replace(/\\\\|\\"/g, '"');
                parsedPackage = JSON.parse(cleanedStr);
              } else {
                // Extract using regex
                const pricingMatch = pkg.match(/"pricing":"\\"([^\\]+)\\""/i);
                const typeMatch = pkg.match(/"selectType":"\\"([^\\]+)\\""/i);
                const detailsMatch = pkg.match(/"details":"\\"([^\\]+)\\""/i);
                
                parsedPackage = {
                  name: typeMatch ? typeMatch[1] : `Package ${parseInt(packageIndex) + 1}`,
                  price: pricingMatch ? pricingMatch[1] : '0.00',
                  details: detailsMatch ? detailsMatch[1] : ''
                };
              }
            } catch (e) {
              console.error('Error parsing package data:', e);
              parsedPackage = { name: `Package ${parseInt(packageIndex) + 1}`, price: '0.00', details: '' };
            }
          } else {
            // It's already an object
            parsedPackage = pkg;
          }
          
          setPackageData(parsedPackage);
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (eventId && packageIndex) {
      fetchEventDetails();
    }
  }, [eventId, packageIndex]);

  const handleAddPackage = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  
  // Function to handle ticket purchase submission
  const handleSubmitPurchase = async () => {
    // Validate that we have at least one package
    if (packages.length === 0) {
      alert('Please add at least one package to purchase');
      return;
    }
    
    // Validate required fields for each package
    const invalidPackages = packages.filter(pkg => !pkg.name || !pkg.email || !pkg.phone);
    if (invalidPackages.length > 0) {
      alert('Please fill in all required fields (Name, Email, Phone) for all packages');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Get the authentication token and user ID from session storage
      const token = sessionStorage.getItem('token');
      const userId = sessionStorage.getItem('userId');
      
      if (!token || !userId) {
        console.warn('No authentication token or user ID found in session storage');
        // Redirect to login if no token is found
        nav('/login');
        return;
      }
      
      // Process packages to create ticket purchase records
      for (const pkg of packages) {
        // Extract numeric amount from formatted price (remove 'R ' and commas)
        const numericAmount = parseFloat(pkg.amount.replace(/[R\s,]/g, ''));
        
        // Prepare delegate details as a JSON object
        const delegateDetails = {
          title: pkg.title,
          name: pkg.name,
          gender: pkg.gender,
          email: pkg.email,
          phone: pkg.phone,
          delegation: pkg.delegation,
          ieeeNumber: pkg.ieeeNumber,
          dayPass: pkg.dayPass
        };
        
        // Create ticket purchase record
        const response = await fetch('http://localhost:5000/api/ticket-purchases', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            event_id: parseInt(eventId),
            user_id: parseInt(userId),
            number_of_tickets: parseInt(pkg.tickets),
            package: pkg.packageDetails,
            amount: numericAmount,
            delegate_details: delegateDetails
            // status will default to 'pending' in the database
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create ticket purchase: ${response.statusText}`);
        }
      }
      
      // Navigate to receipt page after successful submission
      nav(`/receipt`, {
        state: {
          purchaseData: {
            event,
            packages
          }
        }
      });
      
    } catch (err) {
      console.error('Error submitting ticket purchases:', err);
      alert(`Failed to submit ticket purchases: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Function to handle selecting a new package
  const handleSelectPackage = async (pkg) => {
    try {
      // Extract eventId and packageIndex from the path
      const pathParts = pkg.path.split('/');
      const selectedPackageIndex = pathParts[pathParts.length - 1];
      
      // Get the selected package data
      let selectedPackage = event.packages[selectedPackageIndex];
      
      // Parse package data
      let parsedPackage;
      if (typeof selectedPackage === 'string') {
        try {
          // Try to parse as JSON
          if (selectedPackage.startsWith('{') && selectedPackage.endsWith('}')) {
            const cleanedStr = selectedPackage.replace(/\\\\|\\"/g, '"');
            parsedPackage = JSON.parse(cleanedStr);
          } else {
            // Extract using regex
            const pricingMatch = selectedPackage.match(/"pricing":"\\"([^\\]+)\\""/i);
            const typeMatch = selectedPackage.match(/"selectType":"\\"([^\\]+)\\""/i);
            
            parsedPackage = {
              name: typeMatch ? typeMatch[1] : pkg.name,
              price: pricingMatch ? pricingMatch[1] : pkg.price.replace('R ', '')
            };
          }
        } catch (e) {
          console.error('Error parsing package data:', e);
          parsedPackage = { 
            name: pkg.name, 
            price: pkg.price.replace('R ', '') 
          };
        }
      } else {
        // It's already an object
        parsedPackage = selectedPackage;
      }
      
      // Extract the base price from pkg.price (remove 'R ' prefix)
      const basePrice = pkg.price.replace('R ', '');
      // Clean up any commas in the price
      const cleanBasePrice = basePrice.replace(/,/g, '');
      
      // Format the initial price using our helper function
      const initialPrice = parseFloat(cleanBasePrice);
      
      // Create a new package entry with default values
      const newPackage = {
        packageDetails: parsedPackage.name || parsedPackage.selectType || pkg.name,
        title: 'Prof',
        name: '',
        gender: 'Male',
        email: '',
        phone: '',
        delegation: 'student1',
        tickets: '1',
        ieeeNumber: '',
        dayPass: parsedPackage.Duration || '',
        amount: formatPrice(initialPrice),
        unitPrice: cleanBasePrice // Store the clean unit price for future calculations
      };
      
      // Add the new package to the existing packages
      setPackages([...packages, newPackage]);
      
      // Close the modal
      handleCloseModal();
      
    } catch (error) {
      console.error('Error adding new package:', error);
      alert('Failed to add the selected package. Please try again.');
    }
  };

  // Generate dynamic package options from event data
  const [packageOptions, setPackageOptions] = useState([]);
  
  // Update package options when event data is loaded
  useEffect(() => {
    if (event && event.packages && Array.isArray(event.packages)) {
      const options = event.packages.map((pkg, idx) => {
        // Parse package data
        let parsedPackage;
        if (typeof pkg === 'string') {
          try {
            // Try to parse as JSON
            if (pkg.startsWith('{') && pkg.endsWith('}')) {
              const cleanedStr = pkg.replace(/\\\\|\\"/g, '"');
              parsedPackage = JSON.parse(cleanedStr);
            } else {
              // Extract using regex
              const pricingMatch = pkg.match(/"pricing":"\\"([^\\]+)\\""/i);
              const typeMatch = pkg.match(/"selectType":"\\"([^\\]+)\\""/i);
              
              parsedPackage = {
                name: typeMatch ? typeMatch[1] : `Package ${idx + 1}`,
                price: pricingMatch ? pricingMatch[1] : '0.00'
              };
            }
          } catch (e) {
            console.error('Error parsing package data:', e);
            parsedPackage = { name: `Package ${idx + 1}`, price: '0.00' };
          }
        } else {
          // It's already an object
          parsedPackage = pkg;
        }
        
        return {
          name: parsedPackage.name || parsedPackage.selectType || `Package ${idx + 1}`,
          price: formatPrice(parsedPackage.price || parsedPackage.pricing || '0.00'),
          path: `/customerticketdetails1/${eventId}/${idx}`
        };
      });
      
      setPackageOptions(options);
    }
  }, [event, eventId]);

  return (
    <div className="modern-dashboard-container">
      {/* Modern Header */}
      <header className="modern-header">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="XpressTicket Logo"
          className="modern-logo"
        />
        <div className="modern-header-actions">
          <button className="modern-logout-btn" onClick={() => nav('/')}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>
      
      {/* Back Button */}
      <div className="modern-back-button-container">
        <button className="modern-back-btn" onClick={() => nav(`/customerticketdetails1/${eventId}/${packageIndex}`)}>
          <FaArrowLeft /> Back
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading event details...</div>
      ) : error ? (
        <div className="error">Error: {error}</div>
      ) : event ? (
        <div className="event-details1">
          <div className="conference-info1">
            {(event.coverimage || event.image) && (
              <EventImage 
                image={event.image}
                coverimage={event.coverimage}
                alt={`${event.name} Logo`} 
                className="ictas-logo" 
              />
            )}
            <h3>{event.name}</h3>
          </div>
        </div>
      ) : (
        <div className="error">No event data available</div>
      )}

      <div className="confirm-tickets-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div className="modern-card" style={{ marginTop: '20px', marginBottom: '30px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', borderRadius: '8px', overflow: 'hidden' }}>
          <div className="modern-card-header" style={{ background: 'linear-gradient(135deg, #2c3e50, #4ca1af)', padding: '15px 20px', color: 'white' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Confirm Tickets</h2>
          </div>
          <div className="modern-card-body" style={{ padding: '20px' }}>
          <div className="package-table-container">
            <table className="package-table">
              <thead>
                <tr>
                  <th>Package Details</th>
                  <th>Title</th>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Delegation</th>
                  <th>Tickets</th>
                  <th>IEEE Number</th>
                  <th>Day Pass</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg, index) => (
                  <tr key={index}>
                    <td>{pkg.packageDetails}</td>
                    <td>
                      <select 
                        value={pkg.title} 
                        onChange={(e) => updatePackageDetail(index, 'title', e.target.value)}
                      >
                        <option>Prof</option>
                        <option>Dr</option>
                        <option>Mr</option>
                        <option>Ms</option>
                      </select>
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={pkg.name} 
                        onChange={(e) => updatePackageDetail(index, 'name', e.target.value)}
                        placeholder="Full Name"
                      />
                    </td>
                    <td>
                      <select 
                        value={pkg.gender} 
                        onChange={(e) => updatePackageDetail(index, 'gender', e.target.value)}
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </td>
                    <td>
                      <input 
                        type="email" 
                        value={pkg.email} 
                        onChange={(e) => updatePackageDetail(index, 'email', e.target.value)}
                        placeholder="Email Address"
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={pkg.phone} 
                        onChange={(e) => updatePackageDetail(index, 'phone', e.target.value)}
                        placeholder="Phone Number"
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={pkg.delegation} 
                        onChange={(e) => updatePackageDetail(index, 'delegation', e.target.value)}
                        placeholder="Delegation"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        min="1"
                        value={pkg.tickets} 
                        onChange={(e) => updatePackageDetail(index, 'tickets', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={pkg.ieeeNumber} 
                        onChange={(e) => updatePackageDetail(index, 'ieeeNumber', e.target.value)}
                        placeholder="IEEE Number"
                      />
                    </td>
                    <td>{pkg.dayPass}</td>
                    <td className="currency">
                      <div style={{
                        fontWeight: '600',
                        color: '#2c3e50',
                        fontSize: '1em',
                        textAlign: 'right',
                        padding: '0 10px'
                      }}>
                        {pkg.amount}
                      </div>
                    </td>
                    <td>
                      <button 
                        className="table-action-btn delete" 
                        onClick={() => removePackage(index)}
                        title="Remove Package"
                      >
                        <span>✕</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button className="add-package-btn" onClick={handleAddPackage}>
              + Add Package
            </button>
            
            <button className="Submit" onClick={handleSubmitPurchase}>
              Submit
            </button>
          </div>
        </div>
      </div>
      {/* Show loading overlay when submitting */}
      {submitting && (
        <div className="modal1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="loading" style={{ color: 'white', fontSize: '1.2rem' }}>
            Processing your purchase...
          </div>
        </div>
      )}
      
      {showModal && (
        <div className="modal1">
          <div className="modal-content1">
            <h3>Select a Package</h3>
            <div className="package-options">
              {packageOptions.map((pkg, index) => (
                <button
                  key={index}
                  className="package-btn"
                  onClick={() => {
                    handleSelectPackage(pkg);
                  }}
                >
                  <div>{pkg.name}</div>
                  <div>{pkg.price}</div>
                </button>
              ))}
            </div>
            <button
              className="close-modal-btn"
              onClick={handleCloseModal}
              style={{
                marginTop: '20px',
                padding: '8px 16px',
                backgroundColor: '#dc3545'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfirmTicketPackage;
