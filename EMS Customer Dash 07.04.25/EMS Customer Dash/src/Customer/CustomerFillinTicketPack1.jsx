import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CustomerFillinTicketPack1.css';
import '../shared/ModernDashboard.css';
import { FaSignOutAlt, FaArrowLeft } from 'react-icons/fa';
import EventImage from '../utils/EventImage';

const titles = ['Prof', 'Dr', 'Mr', 'Ms'];
const genders = ['Male', 'Female', 'Other'];

function CustomerFillinTicketPack1() {
  const nav = useNavigate();
  const { eventId, packageIndex } = useParams();
  const [event, setEvent] = useState(null);
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendeeTypes, setAttendeeTypes] = useState([]);
  const [delegates, setDelegates] = useState([
    { title: 'Prof', name: '', gender: 'Male', email: '', phone: '', ieee: '', delegation: '' }
  ]);
  
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
          navigate('/login');
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
        
        // Extract attendee types from the event data
// Extract attendee types from the event data
if (data.attendees) {
  console.log('Raw attendees data:', data.attendees);
  
  let processedAttendees = [];
  
  // Check if attendees is a string in PostgreSQL array format
  if (typeof data.attendees === 'string') {
    // Remove the outer braces and split by commas
    processedAttendees = data.attendees
      .replace(/^\{|\}$/g, '') // Remove outer braces
      .split(',')
      .map(item => item.trim().replace(/^"|"$/g, '')); // Remove quotes and trim
  } 
  // Check if attendees is already an array
  else if (Array.isArray(data.attendees)) {
    // Process each item in the array
    processedAttendees = data.attendees.map(item => {
      if (typeof item === 'string') {
        return item.replace(/[{}\"\']/g, '').trim();
      }
      return String(item);
    });
  }
  
  console.log('Processed attendees:', processedAttendees);
  
  // Filter out empty entries and set state
  const filteredAttendees = processedAttendees.filter(Boolean);
  setAttendeeTypes(filteredAttendees.length > 0 ? filteredAttendees : ['Attendee']);
  
  // Update the first delegate with the first attendee type if available
  if (filteredAttendees.length > 0) {
    setDelegates(prev => [{
      ...prev[0],
      delegation: filteredAttendees[0]
    }]);
  }
} else {
  // Fallback to default if no attendees are defined
  setAttendeeTypes(['Attendee']);
}
        
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

  const handleAddRow = () => {
    setDelegates([
      ...delegates,
      { 
        title: 'Prof', 
        name: '', 
        gender: 'Male', 
        email: '', 
        phone: '', 
        ieee: '', 
        delegation: attendeeTypes.length > 0 ? attendeeTypes[0] : 'Attendee' 
      }
    ]);
  };

  const handleRemoveRow = () => {
    if (delegates.length > 1) {
      setDelegates(delegates.slice(0, -1));
    }
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...delegates];
    updated[index][field] = value;
    setDelegates(updated);
  };

  return (
    <div className="modern-dashboard-container">
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
      
      {/* Back Button */}
      <div className="modern-back-button-container">
        <button className="modern-back-btn" onClick={() => nav(`/customerviewevent/${eventId}`)}>
          <FaArrowLeft /> Back
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading event details...</div>
      ) : error ? (
        <div className="error">Error: {error}</div>
      ) : event && packageData ? (
        <>
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
          <div className="eventdestription">
            <div className="event-info-section">
              <p><strong>Event Date:</strong> {event.date || 'TBA'}</p>
              <p><strong>Event Time:</strong> {event.time || 'TBA'}</p>
              <p><strong>Location:</strong> {event.location || 'TBA'}</p>
              <p><strong>Event Type:</strong> {event.event_type || 'Conference'}</p>
              <p><strong>Capacity:</strong> {event.capacity || 'Limited'}</p>
            </div>
            
            <div className="package-info-section">
              <h4 className="packageprice">{packageData.name || packageData.selectType || 'Package Details'}</h4>
              <p>{packageData.details || event.description || 'No package details available.'}</p>
              
              {/* Display all available package details */}
              <ul className="package-features">
                {packageData.Duration && <li><strong>Duration:</strong> {packageData.Duration}</li>}
                {packageData.DateChoices && <li><strong>Date Options:</strong> {packageData.DateChoices}</li>}
                {packageData.location && <li><strong>Package Location:</strong> {packageData.location}</li>}
                {packageData.PackageType && <li><strong>Package Type:</strong> {packageData.PackageType}</li>}
                {packageData.TypeOptions && <li><strong>Type Options:</strong> {packageData.TypeOptions}</li>}
                {packageData.Day && <li><strong>Day(s):</strong> {packageData.Day}</li>}
              </ul>
              
              <p className="eventprice"><strong>Price: R{packageData.price || packageData.pricing || '0.00'}</strong></p>
            </div>
            
            {event.terms_and_conditions && (
              <div className="terms-section">
                <h4>Terms and Conditions</h4>
                <p>{event.terms_and_conditions}</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="error">No event or package data available</div>
      )}
      <br />
      
      <div className="quantity1">
        <button onClick={handleRemoveRow}>-</button>
        <span>{delegates.length}</span>
        <button onClick={handleAddRow}>+</button>
      </div>
      <br />
<div className="addpeople">
      {delegates.map((delegate, index) => (
        <div className="row" key={index}>
          <select value={delegate.title} onChange={(e) => handleInputChange(index, 'title', e.target.value)}>
            {titles.map((t, i) => <option key={i}>{t}</option>)}
          </select>
          <input type="text" placeholder="Delegate Name" value={delegate.name} onChange={(e) => handleInputChange(index, 'name', e.target.value)} />
          <select value={delegate.gender} onChange={(e) => handleInputChange(index, 'gender', e.target.value)}>
            {genders.map((g, i) => <option key={i}>{g}</option>)}
          </select>
          <input type="email" placeholder="Email Address" value={delegate.email} onChange={(e) => handleInputChange(index, 'email', e.target.value)} />
          <input type="text" placeholder="Phone Number" value={delegate.phone} onChange={(e) => handleInputChange(index, 'phone', e.target.value)} />
          <input type="text" placeholder="IEEE Number" value={delegate.ieee} onChange={(e) => handleInputChange(index, 'ieee', e.target.value)} />
          <select value={delegate.delegation} onChange={(e) => handleInputChange(index, 'delegation', e.target.value)}>
            {attendeeTypes.map((type, i) => <option key={i}>{type}</option>)}
          </select>
        </div>
      ))}

      
      </div>
      <div className="footer1">
        <button 
          className="btn2" 
          onClick={() => {
            // Format delegates data for the confirmation page
            const formattedDelegates = delegates.map(delegate => ({
              packageDetails: packageData?.name || packageData?.selectType || 'Conference Delegate',
              title: delegate.title,
              name: delegate.name,
              gender: delegate.gender,
              email: delegate.email,
              phone: delegate.phone,
              delegation: delegate.delegation,
              tickets: 1,
              ieeeNumber: delegate.ieee,
              dayPass: packageData?.Duration || '',
              amount: `R ${packageData?.price || packageData?.pricing || '0.00'}`
            }));
            
            // Check if there are existing packages stored in sessionStorage
            let existingPackages = [];
            try {
              const storedPackages = sessionStorage.getItem('currentPackages');
              if (storedPackages) {
                existingPackages = JSON.parse(storedPackages);
                // Clear the session storage after retrieving the data
                sessionStorage.removeItem('currentPackages');
              }
            } catch (e) {
              console.error('Error parsing stored packages:', e);
            }
            
            // Combine existing packages with the new ones
            const allDelegates = [...existingPackages, ...formattedDelegates];
            
            // Navigate to confirmation page with parameters and state
            nav(`/confirm-ticket-package/${eventId}/${packageIndex}`, { state: { delegates: allDelegates } });
          }}
        >
          Purchase Package
        </button>
      </div>
    
    </div>
  );
}

export default CustomerFillinTicketPack1;
