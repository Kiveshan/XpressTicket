import React, { useState, useEffect } from 'react';
import './ConfirmTicketPackage.css';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { fixS3ImageUrl, DEFAULT_IMAGE_DATA_URI } from '../utils/imageUtils';

const ConfirmTicketPackage = () => {
  const nav = useNavigate();
  const { eventId, packageIndex } = useParams();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [event, setEvent] = useState(null);
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get delegates from location state, session storage, or use empty array as fallback
  const [packages, setPackages] = useState(() => {
    // First check if we have delegates in location state (coming from ticket details page)
    if (location.state?.delegates) {
      return location.state.delegates;
    }
    
    // Then check if we have stored packages in session storage (coming back from adding a package)
    const storedPackages = sessionStorage.getItem('currentPackages');
    if (storedPackages) {
      // Clear the session storage to avoid using it again unintentionally
      sessionStorage.removeItem('currentPackages');
      try {
        return JSON.parse(storedPackages);
      } catch (e) {
        console.error('Error parsing stored packages:', e);
      }
    }
    
    // Fallback to empty array
    return [];
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
      
      // Format the amount for better readability
      // Use South African formatting (space as thousand separator)
      const formattedAmount = totalAmount.toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
      // Update the amount field
      updatedPackages[index].amount = `R ${formattedAmount}`;
      
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
        
        const response = await fetch(`http://localhost:5000/api/events/${eventId}`);
        
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
      const cleanBasePrice = basePrice.replace(',', '');
      
      // Format the initial price for better readability
      const initialPrice = parseFloat(cleanBasePrice);
      const formattedInitialPrice = initialPrice.toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
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
        amount: `R ${formattedInitialPrice}`,
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
          price: `R ${parsedPackage.price || parsedPackage.pricing || '0.00'}`,
          path: `/customerticketdetails1/${eventId}/${idx}`
        };
      });
      
      setPackageOptions(options);
    }
  }, [event, eventId]);

  return (
    <div className="payment-container">
      <header className="dashboard-header">
        <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="dashboard-logo" />
        <div className="profile-section">
              <button className="backbutton22" onClick={()=> nav('/')}>LogOut </button>
          </div>
      </header>
      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav(`/customerticketdetails1/${eventId}/${packageIndex}`)}>
          Back
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
              <img 
                src={fixS3ImageUrl(event.image || event.coverimage)} 
                alt={`${event.name} Logo`} 
                className="ictas-logo" 
                onError={(e) => {
                  console.log('Image failed to load:', e.target.src);
                  e.target.onerror = null;
                  e.target.src = DEFAULT_IMAGE_DATA_URI;
                }}
              />
            )}
            <h3>{event.name}</h3>
          </div>
        </div>
      ) : (
        <div className="error">No event data available</div>
      )}

      <h2>Confirm Tickets</h2>

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
            <th>No. of Tickets</th>
            <th>IEEE Number</th>
            <th>Day Pass Duration (if applicable)</th>
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
                  style={{ width: '100%', padding: '4px' }}
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
                  style={{ width: '100%', padding: '4px' }}
                />
              </td>
              <td>
                <select 
                  value={pkg.gender} 
                  onChange={(e) => updatePackageDetail(index, 'gender', e.target.value)}
                  style={{ width: '100%', padding: '4px' }}
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
                  style={{ width: '100%', padding: '4px' }}
                />
              </td>
              <td>
                <input 
                  type="text" 
                  value={pkg.phone} 
                  onChange={(e) => updatePackageDetail(index, 'phone', e.target.value)}
                  style={{ width: '100%', padding: '4px' }}
                />
              </td>
              <td>
                <input 
                  type="text" 
                  value={pkg.delegation} 
                  onChange={(e) => updatePackageDetail(index, 'delegation', e.target.value)}
                  style={{ width: '100%', padding: '4px' }}
                />
              </td>
              <td>
                <input 
                  type="number" 
                  min="1"
                  value={pkg.tickets} 
                  onChange={(e) => updatePackageDetail(index, 'tickets', e.target.value)}
                  style={{ width: '100%', padding: '4px' }}
                />
              </td>
              <td>
                <input 
                  type="text" 
                  value={pkg.ieeeNumber} 
                  onChange={(e) => updatePackageDetail(index, 'ieeeNumber', e.target.value)}
                  style={{ width: '100%', padding: '4px' }}
                />
              </td>
              <td>{pkg.dayPass}</td>
              <td className="currency">
                <div style={{
                  fontWeight: 'bold',
                  color: '#28a745',
                  fontSize: '1.05em',
                  textAlign: 'right',
                  padding: '0 10px'
                }}>
                  {pkg.amount}
                </div>
              </td>
              <td>
                <button 
                  className="remove-package-btn" 
                  onClick={() => removePackage(index)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    padding: '0'
                  }}
                >
                  -
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="add-package-btn" onClick={handleAddPackage}>
        Add Package
      </button>

      <button className="Submit" onClick={() => nav(`/customerviewevent/${eventId}`)}>
        Submit
      </button>
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
