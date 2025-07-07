import React, { useState, useEffect } from 'react';
import './EventTicketPackage.css';
import { useNavigate, useParams } from 'react-router-dom';
import { fixS3ImageUrl, DEFAULT_IMAGE_DATA_URI } from '../utils/imageUtils';

const EventTicketPackage = () => {
   const nav = useNavigate();
   const { eventId } = useParams();
   const [event, setEvent] = useState(null);
   const [packages, setPackages] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   
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
         if (data.packages && Array.isArray(data.packages)) {
           console.log('Raw packages from DB:', data.packages);
           
           const processedPackages = data.packages.map((pkg, index) => {
             // Parse the package string format from the database
             if (typeof pkg === 'string') {
               console.log(`Processing package string: ${pkg}`);
               
               // Extract data from the format shown in the image
               // Example: {"details":"\"sysys\"","pricing":"\"5000\"","Duration":"\"2 hour \"","location":"\"Durban\"","selectType":"\"Full Package\"","DateChoices":"\"25/07/2025-28/07/2025\"","PackageType":"\"sssss\"","TypeOptions":"\"Full Package\"","Day":"\"1\""})
               
               try {
                 // First, try to parse it as JSON if it looks like a JSON string
                 if (pkg.startsWith('{') && pkg.endsWith('}')) {
                   try {
                     // Clean up escaped quotes
                     const cleanedStr = pkg.replace(/\\\\|\\"/g, '"');
                     const parsedData = JSON.parse(cleanedStr);
                     
                     return {
                       name: parsedData.selectType?.replace(/\"/g, '') || `Package ${index + 1}`,
                       price: parsedData.pricing?.replace(/\"/g, '') || '0.00',
                       currency: 'R',
                       features: [
                         parsedData.selectType?.replace(/\"/g, '') || 'Full conference access',
                         parsedData.details?.replace(/\"/g, '') || 'Conference materials',
                         parsedData.Duration ? `Duration: ${parsedData.Duration.replace(/\"/g, '')}` : '',
                         parsedData.DateChoices ? `Date: ${parsedData.DateChoices.replace(/\"/g, '')}` : '',
                         parsedData.location ? `Location: ${parsedData.location.replace(/\"/g, '')}` : '',
                         parsedData.PackageType ? `Package Type: ${parsedData.PackageType.replace(/\"/g, '')}` : '',
                         parsedData.TypeOptions && parsedData.TypeOptions.replace(/\"/g, '') !== parsedData.selectType?.replace(/\"/g, '') ? 
                           `Type: ${parsedData.TypeOptions.replace(/\"/g, '')}` : '',
                         parsedData.Day ? `Day(s): ${parsedData.Day.replace(/\"/g, '')}` : ''
                       ].filter(item => item !== ''),
                       route: `/customerticketdetails${index + 1}`
                     };
                   } catch (e) {
                     console.error('Error parsing JSON package:', e);
                   }
                 }
                 
                 // If not JSON or parsing failed, try to extract data using regex
                 const pricingMatch = pkg.match(/"pricing":"\\"([^\\]+)\\""/i);
                 const typeMatch = pkg.match(/"selectType":"\\"([^\\]+)\\""/i);
                 const durationMatch = pkg.match(/"Duration":"\\"([^\\]+)\\""/i);
                 const dateMatch = pkg.match(/"DateChoices":"\\"([^\\]+)\\""/i);
                 const locationMatch = pkg.match(/"location":"\\"([^\\]+)\\""/i);
                 const detailsMatch = pkg.match(/"details":"\\"([^\\]+)\\""/i);
                 const packageTypeMatch = pkg.match(/"PackageType":"\\"([^\\]+)\\""/i);
                 const typeOptionsMatch = pkg.match(/"TypeOptions":"\\"([^\\]+)\\""/i);
                 const dayMatch = pkg.match(/"Day":"\\"([^\\]+)\\""/i);
                 
                 // Extract all available information
                 return {
                   name: typeMatch ? typeMatch[1] : `Package ${index + 1}`,
                   price: pricingMatch ? pricingMatch[1] : '0.00',
                   currency: 'R',
                   features: [
                     typeMatch ? typeMatch[1] : 'Full conference access',
                     detailsMatch ? detailsMatch[1] : 'Conference materials',
                     durationMatch ? `Duration: ${durationMatch[1]}` : '',
                     dateMatch ? `Date: ${dateMatch[1]}` : '',
                     locationMatch ? `Location: ${locationMatch[1]}` : '',
                     packageTypeMatch ? `Package Type: ${packageTypeMatch[1]}` : '',
                     typeOptionsMatch && typeOptionsMatch[1] !== typeMatch?.[1] ? `Type: ${typeOptionsMatch[1]}` : '',
                     dayMatch ? `Day(s): ${dayMatch[1]}` : ''
                   ].filter(item => item !== ''),
                   route: `/customerticketdetails${index + 1}`
                 };
               } catch (e) {
                 console.error('Error extracting package data:', e);
                 return {
                   name: `Package ${index + 1}`,
                   price: '0.00',
                   currency: 'R',
                   features: ['Full conference access', 'Conference materials', 'Daily lunch & snacks'],
                   route: `/customerticketdetails${index + 1}`
                 };
               }
             }
             
             // If it's already an object, use it directly
             return {
               name: pkg.selectType || pkg.name || `Package ${index + 1}`,
               price: pkg.pricing || pkg.price || '0.00',
               currency: 'R',
               features: [
                 pkg.selectType || 'Full conference access',
                 pkg.details || 'Conference materials',
                 pkg.Duration ? `Duration: ${pkg.Duration}` : '',
                 pkg.DateChoices ? `Date: ${pkg.DateChoices}` : '',
                 pkg.location ? `Location: ${pkg.location}` : '',
                 pkg.PackageType ? `Package Type: ${pkg.PackageType}` : '',
                 pkg.TypeOptions && pkg.TypeOptions !== pkg.selectType ? `Type: ${pkg.TypeOptions}` : '',
                 pkg.Day ? `Day(s): ${pkg.Day}` : ''
               ].filter(item => item !== ''),
               route: `/customerticketdetails${index + 1}`
             };
           });
           
           console.log('Processed packages:', processedPackages);
           setPackages(processedPackages);
         } else {
           // Fallback to default packages if none found in database
           setPackages([
             { 
               name: 'Conference Delegate', 
               price: '7 000, 00',
               currency: 'R',
               features: ['Full conference access', 'Conference materials', 'Daily lunch & snacks'],
               route: '/customerticketdetails1'
             },
             { 
               name: 'Conference', 
               price: '6 000, 00',
               currency: 'R',
               features: ['Full conference access', 'Conference materials', 'Daily lunch & snacks'],
               route: '/customer-ticket-details2'
             },
             { 
               name: 'Day Pass', 
               price: '1 000, 00',
               currency: 'R',
               features: ['Full conference access', 'Conference materials', 'Daily lunch & snacks'],
               route: '/customer-ticket-details3'
             },
           ]);
         }
       } catch (err) {
         console.error('Error fetching event details:', err);
         setError(err.message);
       } finally {
         setLoading(false);
       }
     };

     if (eventId) {
       fetchEventDetails();
     }
   }, [eventId]);

  return (
    <div className="dashboard-containe3">
      <header className="dashboard-header3">
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
        <button className="backbutton20" onClick={() => nav(`/customerviewevent/${eventId}`)}>
          Back
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <p>Loading packages...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>Error loading packages: {error}</p>
        </div>
      ) : (
        <>
          <div className="event-details">
            <div className="conference-info">
              {event && (event.image || event.coverimage) && (
                <img 
                  src={fixS3ImageUrl(event.image || event.coverimage)} 
                  alt={event?.name || "Event"} 
                  className="ictas-logo" 
                  onError={(e) => {
                    console.log('Image failed to load:', e.target.src);
                    e.target.onerror = null;
                    e.target.src = DEFAULT_IMAGE_DATA_URI;
                  }}
                />
              )}
              <h3>
                {event?.name || "Event Details"}
              </h3>
            </div>
          </div>
          <section className="pricing-section">
            <h3 className="pricing-title">Choose Your Package</h3>
            {packages.length === 0 ? (
              <div className="no-packages">
                <p>No packages available for this event.</p>
              </div>
            ) : (
              <div className="package-grid">
                {packages.map((pkg, index) => (
                  <article key={index} className="package-card">
                    <div className="package-content">
                      <h4 className="package-name">{pkg.name}</h4>
                      <div className="price-container">
                        <span className="currency">{pkg.currency || "ZAR"}</span>
                        <span className="package-price">{pkg.price}</span>
                      </div>
                      <ul className="package-features">
                        {pkg.features && pkg.features.map((feature, i) => (
                          <li key={i}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                    <button className="cta-button" onClick={()=> nav(`/customerticketdetails1/${eventId}/${index}`)}>
                      Select Package
                      <span className="arrow-icon">→</span>
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default EventTicketPackage;
