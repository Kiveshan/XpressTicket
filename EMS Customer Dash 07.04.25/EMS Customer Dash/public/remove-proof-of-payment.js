// Script to remove proof of payment section and enable submit buttons
document.addEventListener('DOMContentLoaded', function() {
  // Function to remove proof of payment elements
  function removeProofOfPayment() {
    // Find and remove proof of payment sections
    const proofSections = document.querySelectorAll('.proof-of-payment-section, div:has(h4:contains("Proof of Payment"))');
    proofSections.forEach(section => section.remove());
    
    // Find elements with text containing "Proof of Payment"
    document.querySelectorAll('*').forEach(element => {
      if (element.innerText && element.innerText.includes('Proof of Payment')) {
        // Check if it's a container element
        if (element.tagName === 'DIV' || element.tagName === 'SECTION') {
          element.remove();
        }
        // If it's a heading or label, remove it
        else if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LABEL', 'P', 'SPAN'].includes(element.tagName)) {
          element.remove();
        }
      }
    });
    
    // Enable all submit buttons
    document.querySelectorAll('button[type="submit"], button.Submit, .submit-button, button').forEach(button => {
      if (button.innerText && button.innerText.toLowerCase().includes('submit')) {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.pointerEvents = 'auto';
        button.style.cursor = 'pointer';
        // Remove any title that might indicate it's disabled
        if (button.title && button.title.toLowerCase().includes('proof of payment')) {
          button.title = '';
        }
      }
    });
  }
  
  // Run immediately
  removeProofOfPayment();
  
  // Also run periodically to catch dynamically added elements
  setInterval(removeProofOfPayment, 1000);
  
  // Create a MutationObserver to detect DOM changes
  const observer = new MutationObserver(function(mutations) {
    removeProofOfPayment();
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.body, { childList: true, subtree: true });
});
