function applyAutoDirection(element) {
  if (element.type === 'password') return;
  element.addEventListener('input', () => {
    const text = element.value || element.innerText;
    const isRTL = /[\u0600-\u06FF]/.test(text);
    element.style.direction = isRTL ? 'rtl' : 'ltr';
    element.style.textAlign = isRTL ? 'right' : 'left';
  });
}

function initializeAutoDirection() {
  document.querySelectorAll('textarea, input, [contenteditable="true"]').forEach((element) => {
    applyAutoDirection(element);
  });
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        if (node.matches('textarea, input') || node.isContentEditable) {
          applyAutoDirection(node);
        }
        if (node.querySelectorAll) {
          node.querySelectorAll('textarea, input, [contenteditable="true"]').forEach((child) => {
            applyAutoDirection(child);
          });
        }
      }
    });
  });
});

observer.observe(document.body, { childList: true, subtree: true });
initializeAutoDirection();

// Global flag to track font toggle state
let fontToggled = false;

// Function to get current domain
function getCurrentDomain() {
  return window.location.hostname;
}

// Function to save font setting for the current domain
function saveFontSetting(enabled) {
  const domain = getCurrentDomain();
  chrome.storage.local.get(['fontSettings'], (result) => {
    const fontSettings = result.fontSettings || {};
    fontSettings[domain] = { fontEnabled: enabled };
    chrome.storage.local.set({ fontSettings });

    // Also notify the popup of the state change
    chrome.runtime.sendMessage({
      action: 'fontStateChanged',
      domain: domain,
      enabled: enabled
    });
  });
}

// Load the font setting when page loads
function loadFontSetting() {
  const domain = getCurrentDomain();
  chrome.storage.local.get(['fontSettings'], (result) => {
    const fontSettings = result.fontSettings || {};
    const domainSetting = fontSettings[domain];

    if (domainSetting && domainSetting.fontEnabled) {
      loadVazirmatnFont();
      injectFontStyle(document);
      fontToggled = true;
    }
  });
}

// Revised function to inject font style into a given context (Document, ShadowRoot, etc.)
function injectFontStyle(context) {
  if (!context) return;

  // Determine the appropriate createElement function
  let createElement;
  if (typeof context.createElement === 'function') {
    createElement = context.createElement.bind(context);
  } else if (context.ownerDocument && typeof context.ownerDocument.createElement === 'function') {
    createElement = context.ownerDocument.createElement.bind(context.ownerDocument);
  } else {
    return;
  }

  // Check if the style is already injected
  let existingStyle = null;
  if (typeof context.getElementById === 'function') {
    existingStyle = context.getElementById('vazirmatn-global-style');
  } else if (typeof context.querySelector === 'function') {
    existingStyle = context.querySelector('#vazirmatn-global-style');
  }

  if (!existingStyle) {
    const style = createElement('style');
    style.id = 'vazirmatn-global-style';
    /* 
      Apply font to all elements using 'Vazirmatn' 
      Exclude <mat-icon> elements and their descendants by unsetting font-family,
      but force apply Vazirmatn on elements with class "conversation-title".
    */
    style.innerHTML = `
      * { font-family: 'Vazirmatn', sans-serif; }
      mat-icon, mat-icon * { font-family: unset; }
      .conversation-title { font-family: 'Vazirmatn', sans-serif; }
    `;
    if (context.head) {
      context.head.appendChild(style);
    } else if (context.documentElement) {
      context.documentElement.appendChild(style);
    } else if (typeof context.appendChild === 'function') {
      context.appendChild(style);
    }
  }

  // Recursively inject style into shadow roots (if accessible)
  if (context.body) {
    const walker = context.createTreeWalker(context.body, NodeFilter.SHOW_ELEMENT, null, false);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.shadowRoot) {
        injectFontStyle(node.shadowRoot);
      }
    }
  }

  // Inject style into same-origin iframes
  if (typeof context.getElementsByTagName === 'function') {
    const iframes = context.getElementsByTagName('iframe');
    for (let i = 0; i < iframes.length; i++) {
      try {
        const iframeDoc = iframes[i].contentDocument;
        injectFontStyle(iframeDoc);
      } catch (e) {
        // Cross-origin iframes; ignore error
      }
    }
  }
}

// Revised function to remove the injected font style from a given context
function removeFontStyle(context) {
  if (!context) return;

  let style = null;
  if (typeof context.getElementById === 'function') {
    style = context.getElementById('vazirmatn-global-style');
  } else if (typeof context.querySelector === 'function') {
    style = context.querySelector('#vazirmatn-global-style');
  }

  if (style && typeof style.remove === 'function') {
    style.remove();
  }

  // Recursively remove from shadow roots
  if (context.body) {
    const walker = context.createTreeWalker(context.body, NodeFilter.SHOW_ELEMENT, null, false);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.shadowRoot) {
        removeFontStyle(node.shadowRoot);
      }
    }
  }

  // Remove style from iframes
  if (typeof context.getElementsByTagName === 'function') {
    const iframes = context.getElementsByTagName('iframe');
    for (let i = 0; i < iframes.length; i++) {
      try {
        const iframeDoc = iframes[i].contentDocument;
        removeFontStyle(iframeDoc);
      } catch (e) {
        // Cross-origin; ignore error
      }
    }
  }
}

// Function to load Vazirmatn font stylesheet from Google Fonts CDN into the main document
function loadVazirmatnFont() {
  if (!document.getElementById('vazirmatn-font-link')) {
    const link = document.createElement('link');
    link.id = 'vazirmatn-font-link';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap';
    document.head.appendChild(link);
  }
}

// Toggle the page font globally (applied to document, shadow roots, and iframes)
function togglePageFont() {
  if (fontToggled) {
    removeFontStyle(document);
    fontToggled = false;
    saveFontSetting(false);
  } else {
    loadVazirmatnFont();
    injectFontStyle(document);
    fontToggled = true;
    saveFontSetting(true);
  }

  // Return the current state for the popup
  return fontToggled;
}

// Toggle the page direction (RTL/LTR)
function togglePageDirection() {
  document.body.dir = (document.body.dir === 'rtl') ? 'ltr' : 'rtl';
}

// Initialize by loading saved font setting
loadFontSetting();

// Listener for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleFont') {
    const newState = togglePageFont();
    sendResponse({ status: 'font toggled', enabled: newState });
  } else if (request.action === 'toggleDirection') {
    togglePageDirection();
    sendResponse({ status: 'direction toggled' });
  } else if (request.action === 'getFontState') {
    // New message to get the current font state for this page
    sendResponse({ enabled: fontToggled });
  }
  return true; // Keep the messaging channel open
});
