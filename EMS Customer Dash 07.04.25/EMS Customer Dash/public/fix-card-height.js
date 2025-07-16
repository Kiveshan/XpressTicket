/**
 * fix-card-height.js
 * This script fixes the card height issue in the EventApproval page
 * It runs after the page loads and directly manipulates card dimensions
 */

(function() {
  // Function to adjust card heights
  function fixCardHeights() {
    // Target all cards in the event approval page
    const cards = document.querySelectorAll('.modern-card');
    
    if (cards && cards.length > 0) {
      console.log('Fixing card heights for', cards.length, 'cards');
      
      cards.forEach(card => {
        // Force card height
        card.style.maxHeight = '200px';
        card.style.overflow = 'hidden';
        
        // Fix image container height
        const imageContainer = card.querySelector('.modern-card-image-container');
        if (imageContainer) {
          imageContainer.style.height = '70px';
          imageContainer.style.maxHeight = '70px';
        }
        
        // Fix card body padding
        const cardBody = card.querySelector('.modern-card-body');
        if (cardBody) {
          cardBody.style.padding = '4px 8px';
        }
        
        // Fix title
        const title = card.querySelector('.modern-card-title');
        if (title) {
          title.style.fontSize = '0.8rem';
          title.style.margin = '2px 0';
          title.style.lineHeight = '1.1';
        }
        
        // Fix details
        const details = card.querySelector('.modern-card-details');
        if (details) {
          details.style.marginBottom = '2px';
          
          // Fix paragraphs in details
          const paragraphs = details.querySelectorAll('p');
          paragraphs.forEach(p => {
            p.style.margin = '1px 0';
            p.style.fontSize = '0.65rem';
            p.style.lineHeight = '1.1';
            
            // Fix icons
            const icons = p.querySelectorAll('svg');
            icons.forEach(icon => {
              icon.style.width = '10px';
              icon.style.height = '10px';
            });
          });
        }
        
        // Fix actions
        const actions = card.querySelector('.modern-card-actions');
        if (actions) {
          actions.style.marginTop = '2px';
          
          // Fix badge
          const badge = actions.querySelector('.modern-badge');
          if (badge) {
            badge.style.padding = '1px 4px';
            badge.style.fontSize = '0.6rem';
          }
          
          // Fix button
          const button = actions.querySelector('.modern-btn');
          if (button) {
            button.style.padding = '4px 8px';
            button.style.fontSize = '0.65rem';
          }
        }
      });
      
      console.log('Card height fix applied successfully');
    }
  }
  
  // Run on page load and whenever DOM might change
  window.addEventListener('load', fixCardHeights);
  window.addEventListener('DOMContentLoaded', fixCardHeights);
  
  // Also run periodically to catch any dynamically loaded content
  setInterval(fixCardHeights, 1000);
})();
