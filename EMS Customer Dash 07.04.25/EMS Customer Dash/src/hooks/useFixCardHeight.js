import { useEffect } from 'react';

/**
 * Custom React hook to fix card heights in the EventApproval component
 * This hook directly manipulates DOM elements after React has rendered them
 */
const useFixCardHeight = () => {
  useEffect(() => {
    const applyFixes = () => {
      console.log('Running card height fix');
      
      // Force card max-height
      document.querySelectorAll('.modern-card').forEach(card => {
        Object.assign(card.style, {
          maxHeight: '180px',
          height: 'auto',
          overflow: 'hidden',
          boxSizing: 'border-box'
        });
      });

      // Reduce image container height
      document.querySelectorAll('.modern-card-image-container').forEach(container => {
        Object.assign(container.style, {
          height: '60px',
          minHeight: '60px',
          maxHeight: '60px',
          overflow: 'hidden'
        });
      });

      // Fix card body padding
      document.querySelectorAll('.modern-card-body').forEach(body => {
        Object.assign(body.style, {
          padding: '3px',
          margin: '0',
          boxSizing: 'border-box',
          flexGrow: '0'
        });
      });

      // Fix title size
      document.querySelectorAll('.modern-card-title').forEach(title => {
        Object.assign(title.style, {
          margin: '0 0 1px 0',
          padding: '0',
          fontSize: '0.75rem',
          lineHeight: '1',
          maxHeight: '16px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        });
      });

      // Compress details
      document.querySelectorAll('.modern-card-details').forEach(details => {
        Object.assign(details.style, {
          margin: '0',
          padding: '0'
        });
        
        // Fix details paragraphs
        details.querySelectorAll('p').forEach(p => {
          Object.assign(p.style, {
            margin: '0',
            padding: '0',
            fontSize: '0.65rem',
            lineHeight: '1',
            maxHeight: '14px'
          });
          
          // Reduce icon size
          p.querySelectorAll('svg').forEach(svg => {
            Object.assign(svg.style, {
              width: '10px',
              height: '10px',
              minWidth: '10px',
              minHeight: '10px'
            });
          });
        });
      });

      // Fix actions area
      document.querySelectorAll('.modern-card-actions').forEach(actions => {
        Object.assign(actions.style, {
          margin: '1px 0 0 0',
          padding: '0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        });
        
        // Fix badge
        actions.querySelectorAll('.modern-badge').forEach(badge => {
          Object.assign(badge.style, {
            padding: '1px 3px',
            fontSize: '0.6rem',
            lineHeight: '1',
            minWidth: 'unset'
          });
        });
        
        // Fix button
        actions.querySelectorAll('.modern-btn').forEach(button => {
          Object.assign(button.style, {
            padding: '2px 6px',
            fontSize: '0.65rem',
            lineHeight: '1'
          });
        });
      });
    };

    // Apply fixes immediately after render
    applyFixes();
    
    // Set up a small delay to ensure all components are rendered
    const timeout = setTimeout(applyFixes, 500);
    
    // Also set an interval to keep applying fixes (for dynamic content)
    const interval = setInterval(applyFixes, 2000);

    // Clean up on component unmount
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);
};

export default useFixCardHeight;
