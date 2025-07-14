import React, { useState, useEffect } from 'react';
import { fixS3ImageUrl, DEFAULT_IMAGE_DATA_URI } from './imageUtils';

/**
 * Standardized component for displaying event images consistently across the application
 * Uses the same image loading approach as CustomerTicketDetails with enhanced debugging
 * 
 * @param {Object} props - Component props
 * @param {string} props.image - Primary image URL
 * @param {string} props.coverimage - Fallback cover image URL
 * @param {string} props.alt - Alt text for the image
 * @param {string} props.className - CSS class for the image
 * @param {Object} props.style - Additional inline styles
 * @returns {React.ReactElement} - Image component with consistent error handling
 */
const EventImage = ({ image, coverimage, alt, className, style }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    // Log the incoming image props for debugging
    console.log('EventImage props:', { image, coverimage });
    
    // Process the image URL
    const processedSrc = fixS3ImageUrl(image || coverimage);
    console.log('Processed image URL:', processedSrc);
    
    setImageSrc(processedSrc);
  }, [image, coverimage]);
  
  const handleError = (e) => {
    // Only change source once to prevent infinite loop
    if (!hasError) {
      console.log('Image failed to load:', e.target.src);
      setHasError(true);
      e.target.onerror = null;
      e.target.src = DEFAULT_IMAGE_DATA_URI;
    }
  };

  return (
    <img 
      src={imageSrc} 
      alt={alt || 'Event Image'}
      className={className || ''}
      style={style || {}}
      onError={handleError}
    />
  );
};

export default EventImage;
