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

// Function to load Vazirmatn font stylesheet from Google Fonts CDN
function loadVazirmatnFont() {
  if (!document.getElementById('vazirmatn-font-link')) {
    const link = document.createElement('link');
    link.id = 'vazirmatn-font-link';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap';
    document.head.appendChild(link);
  }
}

// Function to toggle the page font to/from Vazirmatn
function togglePageFont() {
  const currentFont = document.body.style.fontFamily;
  if (currentFont && currentFont.includes('Vazirmatn')) {
    document.body.style.fontFamily = '';
  } else {
    loadVazirmatnFont();
    document.body.style.fontFamily = "'Vazirmatn', sans-serif";
  }
}

// Function to toggle the page direction (RTL/LTR)
function togglePageDirection() {
  document.body.dir = (document.body.dir === 'rtl') ? 'ltr' : 'rtl';
}

// Listener for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleFont') {
    togglePageFont();
    sendResponse({status: 'font toggled'});
  } else if (request.action === 'toggleDirection') {
    togglePageDirection();
    sendResponse({status: 'direction toggled'});
  }
});
