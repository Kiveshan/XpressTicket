document.addEventListener('DOMContentLoaded', function () {
  // Function to remove proof of payment elements
  function removeProofOfPayment() {
    // Remove elements with class .proof-of-payment-section
    document.querySelectorAll('.proof-of-payment-section').forEach(section => section.remove());

    // Find divs containing h4 with "Proof of Payment" text
    document.querySelectorAll('div').forEach(div => {
      const h4 = div.querySelector('h4');
      if (h4 && h4.textContent.includes('Proof of Payment')) {
        div.remove();
      }
    });

    // Remove headings, labels, or other elements containing "Proof of Payment"
    document.querySelectorAll('h1, h2, h3, h4, h5, h6, label, p, span').forEach(element => {
      if (element.textContent.includes('Proof of Payment')) {
        element.remove();
      }
    });

    // Enable all submit buttons
    document.querySelectorAll('button[type="submit"], button.Submit, .submit-button, button').forEach(button => {
      if (button.textContent.toLowerCase().includes('submit')) {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.pointerEvents = 'auto';
        button.style.cursor = 'pointer';
        if (button.title && button.title.toLowerCase().includes('proof of payment')) {
          button.title = '';
        }
      }
    });
  }

  // Run immediately
  removeProofOfPayment();

  // Run periodically for dynamically added elements
  setInterval(removeProofOfPayment, 1000);

  // Observe DOM changes
  const observer = new MutationObserver(removeProofOfPayment);
  observer.observe(document.body, { childList: true, subtree: true });
});