// ─────────────────────────────────────────────────────────────
// FEATURE 1 & 3 — CSS-only injection
// ─────────────────────────────────────────────────────────────
function injectRTLProtectionStyles() {
  if (document.getElementById('auto-rtl-protection-style')) return;
  const style = document.createElement('style');
  style.id = 'auto-rtl-protection-style';
  style.textContent = `
    /* ── Rule 1: inline text-align:left → right ── */
    body[dir="rtl"] [style*="text-align:left"],
    body[dir="rtl"] [style*="text-align: left"] {
      text-align: right !important;
    }

    /* ── Rule 2: text-bearing elements only.
          NOTE: div/span intentionally excluded — too aggressive,
          breaks layouts on Gmail, Twitter, GitHub, etc.
          Sites that need RTL on div/span should rely on inherited
          direction from body[dir="rtl"]. ── */
    body[dir="rtl"] p,
    body[dir="rtl"] h1, body[dir="rtl"] h2, body[dir="rtl"] h3,
    body[dir="rtl"] h4, body[dir="rtl"] h5, body[dir="rtl"] h6,
    body[dir="rtl"] li, body[dir="rtl"] ul, body[dir="rtl"] ol,
    body[dir="rtl"] td, body[dir="rtl"] th,
    body[dir="rtl"] dt, body[dir="rtl"] dd,
    body[dir="rtl"] blockquote, body[dir="rtl"] figcaption,
    body[dir="rtl"] label, body[dir="rtl"] a {
      text-align: right !important;
    }

    /* ── Rule 3: protect pre/code — LAST, always wins everything above ── */
    body[dir="rtl"] pre,
    body[dir="rtl"] code,
    body[dir="rtl"] pre *,
    body[dir="rtl"] code * {
      direction: ltr !important;
      text-align: left !important;
      unicode-bidi: isolate !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}


injectRTLProtectionStyles();

// ─────────────────────────────────────────────────────────────
// FEATURE 4 — Site disable/enable
// ─────────────────────────────────────────────────────────────
let isSiteDisabled = false;

function getCurrentDomain() {
  return window.location.hostname;
}

function checkIfSiteDisabled(callback) {
  chrome.storage.local.get(['disabledSites'], (result) => {
    const disabledSites = result.disabledSites || {};
    isSiteDisabled = !!disabledSites[getCurrentDomain()];
    callback(isSiteDisabled);
  });
}

function toggleSiteDisabled(callback) {
  const domain = getCurrentDomain();
  chrome.storage.local.get(['disabledSites'], (result) => {
    const disabledSites = result.disabledSites || {};
    disabledSites[domain] = !disabledSites[domain];
    isSiteDisabled = !!disabledSites[domain];
    chrome.storage.local.set({ disabledSites }, () => {
      callback(isSiteDisabled);
    });
  });
}

// ─────────────────────────────────────────────────────────────
// RTL detection regex — covers:
//   Hebrew                       U+0590–U+05FF
//   Arabic                       U+0600–U+06FF
//   Arabic Supplement            U+0750–U+077F
//   Arabic Extended-A            U+08A0–U+08FF
//   Arabic Presentation Forms-A  U+FB50–U+FDFF
//   Arabic Presentation Forms-B  U+FE70–U+FEFF
// ─────────────────────────────────────────────────────────────
const RTL_REGEX = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

// ─────────────────────────────────────────────────────────────
// Auto direction for inputs
//
// FIX 1: element.textContent instead of element.innerText
//        innerText forces layout reflow — textContent does not.
// FIX 2: only sample first 200 chars for RTL detection.
//        No need to scan 10,000 chars of conversation history.
// ─────────────────────────────────────────────────────────────
function applyAutoDirection(element) {
  if (isSiteDisabled) return;
  if (element.type === 'password') return;
  if (element.hasAttribute('data-rtl-listener')) return;
  element.setAttribute('data-rtl-listener', 'true');

  element.addEventListener('input', () => {
    if (isSiteDisabled) return;

    // FIX: textContent has zero reflow cost; slice limits scan work
    const text = (element.value || element.textContent || '').slice(0, 200);
    const isRTL = RTL_REGEX.test(text);

    element.style.direction = isRTL ? 'rtl' : 'ltr';
    element.style.textAlign = isRTL ? 'right' : 'left';
    element.style.unicodeBidi = isRTL ? 'embed' : 'normal';

    if (element.isContentEditable) {
      element.querySelectorAll('p').forEach(p => {
        p.style.direction = isRTL ? 'rtl' : 'ltr';
        p.style.textAlign = isRTL ? 'right' : 'left';
        p.style.unicodeBidi = isRTL ? 'embed' : 'normal';
      });
    }
  });
}

function initializeAutoDirection() {
  document.querySelectorAll('textarea, input, [contenteditable="true"]')
    .forEach(applyAutoDirection);
}

// ─────────────────────────────────────────────────────────────
// MutationObserver — debounced
//
// FIX: ChatGPT (React) fires dozens of DOM mutations per keystroke.
// Without debounce, observer ran synchronously on every mutation,
// stacking up and freezing the main thread.
// Solution: collect added nodes, then process them once after 150ms idle.
// ─────────────────────────────────────────────────────────────
let observerTimer = null;
const pendingNodes = new Set();

function processPendingNodes() {
  if (isSiteDisabled) {
    pendingNodes.clear();
    return;
  }
  for (const node of pendingNodes) {
    if (node.matches?.('textarea, input') || node.isContentEditable) {
      applyAutoDirection(node);
    }
    node.querySelectorAll?.('textarea, input, [contenteditable="true"]')
      .forEach(applyAutoDirection);
  }
  pendingNodes.clear();
}

const observer = new MutationObserver((mutations) => {
  if (isSiteDisabled) return;

  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === 1) pendingNodes.add(node);
    }
  }

  // Debounce: wait until DOM settles before processing
  clearTimeout(observerTimer);
  observerTimer = setTimeout(processPendingNodes, 150);
});

// ─────────────────────────────────────────────────────────────
// Font feature
//
// FIX (NEW): WeakSet to prevent infinite recursion when iframes/
// shadow roots reference each other (or themselves). Also dramatically
// reduces CPU on heavy SPAs (Gmail, Notion) where TreeWalker would
// otherwise re-visit the same shadow trees repeatedly.
// ─────────────────────────────────────────────────────────────
let fontToggled = false;
let visitedContexts = new WeakSet();

function saveFontSetting(enabled) {
  const domain = getCurrentDomain();
  chrome.storage.local.get(['fontSettings'], (result) => {
    const fontSettings = result.fontSettings || {};
    fontSettings[domain] = { fontEnabled: enabled };
    chrome.storage.local.set({ fontSettings });
    chrome.runtime.sendMessage({ action: 'fontStateChanged', domain, enabled });
  });
}

function loadFontSetting() {
  if (isSiteDisabled) return;
  const domain = getCurrentDomain();
  chrome.storage.local.get(['fontSettings'], (result) => {
    const fontSettings = result.fontSettings || {};
    if (fontSettings[domain]?.fontEnabled) {
      loadVazirmatnFont();
      visitedContexts = new WeakSet(); // reset for fresh traversal
      injectFontStyle(document);
      fontToggled = true;
    }
  });
}

function injectFontStyle(context) {
  if (!context) return;
  if (visitedContexts.has(context)) return;
  visitedContexts.add(context);

  let createElement;
  if (typeof context.createElement === 'function') {
    createElement = context.createElement.bind(context);
  } else if (context.ownerDocument?.createElement) {
    createElement = context.ownerDocument.createElement.bind(context.ownerDocument);
  } else return;

  const existingStyle =
    context.getElementById?.('vazirmatn-global-style') ||
    context.querySelector?.('#vazirmatn-global-style');

  if (!existingStyle) {
    const style = createElement('style');
    style.id = 'vazirmatn-global-style';
    // FIX 1: pre/code explicitly excluded — placed LAST to always win cascade
    style.textContent = `
      * { font-family: 'Vazirmatn', sans-serif; }
      pre, code, pre *, code * { font-family: monospace !important; }
      mat-icon, mat-icon * { font-family: unset; }
      .conversation-title { font-family: 'Vazirmatn', sans-serif; }
    `;
    (context.head || context.documentElement || context).appendChild(style);
  }

  // FIX 2: TreeWalker runs async via requestIdleCallback so it never
  // blocks the main thread. Falls back to setTimeout on browsers
  // that don't support requestIdleCallback (shouldn't happen in Chrome).
  const idle = typeof requestIdleCallback === 'function'
    ? (cb) => requestIdleCallback(cb, { timeout: 2000 })
    : (cb) => setTimeout(cb, 100);

  if (context.body) {
    idle(() => {
      try {
        const walker = context.createTreeWalker(
          context.body, NodeFilter.SHOW_ELEMENT, null, false
        );
        while (walker.nextNode()) {
          const sr = walker.currentNode.shadowRoot;
          if (sr && !visitedContexts.has(sr)) {
            injectFontStyle(sr);
          }
        }
      } catch (e) { /* detached document */ }
    });
  }

  if (typeof context.getElementsByTagName === 'function') {
    idle(() => {
      try {
        for (const iframe of context.getElementsByTagName('iframe')) {
          try {
            const doc = iframe.contentDocument;
            if (doc && !visitedContexts.has(doc)) injectFontStyle(doc);
          } catch (e) { /* cross-origin */ }
        }
      } catch (e) { /* detached document */ }
    });
  }
}

function removeFontStyle(context) {
  if (!context) return;
  if (visitedContexts.has(context)) return;
  visitedContexts.add(context);

  // Remove font-face declaration (only lives on main document)
  document.getElementById('vazirmatn-font-face')?.remove();

  const style =
    context.getElementById?.('vazirmatn-global-style') ||
    context.querySelector?.('#vazirmatn-global-style');
  style?.remove();

  const idle = typeof requestIdleCallback === 'function'
    ? (cb) => requestIdleCallback(cb, { timeout: 2000 })
    : (cb) => setTimeout(cb, 100);

  if (context.body) {
    idle(() => {
      try {
        const walker = context.createTreeWalker(
          context.body, NodeFilter.SHOW_ELEMENT, null, false
        );
        while (walker.nextNode()) {
          const sr = walker.currentNode.shadowRoot;
          if (sr && !visitedContexts.has(sr)) {
            removeFontStyle(sr);
          }
        }
      } catch (e) { /* detached document */ }
    });
  }

  if (typeof context.getElementsByTagName === 'function') {
    idle(() => {
      try {
        for (const iframe of context.getElementsByTagName('iframe')) {
          try {
            const doc = iframe.contentDocument;
            if (doc && !visitedContexts.has(doc)) removeFontStyle(doc);
          } catch (e) { /* cross-origin */ }
        }
      } catch (e) { /* detached document */ }
    });
  }
}



function loadVazirmatnFont() {
  if (document.getElementById('vazirmatn-font-face')) return;

  // Use bundled font via extension URL → bypasses any site CSP completely
  const fontUrl = chrome.runtime.getURL('fonts/Vazirmatn[wght].woff2');

  const style = document.createElement('style');
  style.id = 'vazirmatn-font-face';
  style.textContent = `
    @font-face {
      font-family: 'Vazirmatn';
      src: url('${fontUrl}') format('woff2');
      font-weight: 100 900;
      font-style: normal;
      font-display: swap;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}


function togglePageFont() {
  if (isSiteDisabled) return fontToggled;
  if (fontToggled) {
    visitedContexts = new WeakSet(); // reset for fresh traversal
    removeFontStyle(document);
    fontToggled = false;
    saveFontSetting(false);
  } else {
    loadVazirmatnFont();
    visitedContexts = new WeakSet(); // reset for fresh traversal
    injectFontStyle(document);
    fontToggled = true;
    saveFontSetting(true);
  }
  return fontToggled;
}

// ─────────────────────────────────────────────────────────────
// Direction toggle
// ─────────────────────────────────────────────────────────────
function togglePageDirection() {
  if (isSiteDisabled) return;
  document.body.dir = (document.body.dir === 'rtl') ? 'ltr' : 'rtl';
}

// ─────────────────────────────────────────────────────────────
// FEATURE 2 — Language-independent shortcut
// ─────────────────────────────────────────────────────────────
let lastDirectionToggleTime = 0;

document.addEventListener('keydown', (e) => {
  if (e.altKey && e.shiftKey && e.code === 'KeyD') {
    const now = Date.now();
    if (now - lastDirectionToggleTime > 300) {
      lastDirectionToggleTime = now;
      e.preventDefault();
      togglePageDirection();
    }
  }
}, true);

// ─────────────────────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────────────────────
checkIfSiteDisabled((disabled) => {
  if (!disabled) {
    initializeAutoDirection();
    loadFontSetting();
  }

  // Guard against rare edge cases where body isn't ready yet
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Tell background the page has loaded so it can update the badge.
  // Content script always knows its own URL — no permission needed,
  // no cache needed, works even after service worker was asleep.
  chrome.runtime.sendMessage({
    action: 'pageLoaded',
    url: window.location.href
  });
});

// ─────────────────────────────────────────────────────────────
// Message listener
//
// FIX: `return true` is required ONLY for async branches
// (where sendResponse is called after a callback).
// Returning true unconditionally caused Chrome to keep the
// message channel open for sync branches too, producing
// "message channel closed before response was received" warnings.
// ─────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === 'toggleFont') {
    const newState = togglePageFont();
    sendResponse({ status: 'font toggled', enabled: newState });
    return false;

  } else if (request.action === 'toggleDirection') {
    const now = Date.now();
    if (now - lastDirectionToggleTime > 300) {
      lastDirectionToggleTime = now;
      togglePageDirection();
    }
    sendResponse({ status: 'direction toggled' });
    return false;

  } else if (request.action === 'getFontState') {
    sendResponse({ enabled: fontToggled });
    return false;

  } else if (request.action === 'getSiteDisabledState') {
    sendResponse({ isDisabled: isSiteDisabled });
    return false;

  } else if (request.action === 'toggleSiteDisabled') {
    toggleSiteDisabled((isDisabled) => {
      if (!isDisabled) {
        initializeAutoDirection();
        loadFontSetting();
      }
      // Notify background immediately to refresh badge on icon
      chrome.runtime.sendMessage({
        action: 'refreshBadge',
        url: window.location.href
      });
      sendResponse({ isDisabled });
    });
    return true; // ← async response — must keep channel open
  }

  return false;
});
