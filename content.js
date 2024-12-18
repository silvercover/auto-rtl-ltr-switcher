// Function to detect the current text direction of the website
function detectDirection() {
  const htmlDir = document.documentElement.getAttribute('dir') || 'ltr';
  chrome.runtime.sendMessage({ action: 'updateBadge', direction: htmlDir });
}

// Function to toggle the text direction of the website
function toggleDirection() {
  const currentDir = document.documentElement.getAttribute('dir') || 'ltr';
  const newDir = currentDir === 'rtl' ? 'ltr' : 'rtl';
  document.documentElement.setAttribute('dir', newDir);
  chrome.runtime.sendMessage({ action: 'updateBadge', direction: newDir });
}

// Listener for messages from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'toggleDirection') {
    toggleDirection();
  } else if (message.action === 'detectDirection') {
    detectDirection();
  }
});

// Initial detection on page load
detectDirection();



// Function to set text direction based on the content
function applyAutoDirection(element) {
  // Skip processing if the input type is 'password'
  if (element.type === 'password') return;

  element.addEventListener('input', () => {
    // Get the text from the input/textarea or contenteditable element
    const text = element.value || element.innerText;

    // Check if the text contains RTL characters (e.g., Arabic or Persian)
    const isRTL = /[\u0600-\u06FF]/.test(text);

    // Apply text direction and alignment based on the content language
    element.style.direction = isRTL ? 'rtl' : 'ltr';
    element.style.textAlign = isRTL ? 'right' : 'left';
  });
}

// Function to initialize auto direction for existing elements on the page
function initializeAutoDirection() {
  document.querySelectorAll('textarea, input, [contenteditable="true"]').forEach((element) => {
    applyAutoDirection(element);
  });
}

// MutationObserver to monitor DOM changes for dynamically added elements
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        // Check standard elements and contenteditable
        if (
          node.matches('textarea, input') || 
          node.isContentEditable
        ) {
          applyAutoDirection(node);
        }

        // Check child nodes inside Shadow DOM or nested elements
        node.querySelectorAll?.('textarea, input, [contenteditable="true"]').forEach((child) => {
          applyAutoDirection(child);
        });
      }
    });
  });
});

// Observe changes in the entire body
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Initial execution for existing elements
initializeAutoDirection();
