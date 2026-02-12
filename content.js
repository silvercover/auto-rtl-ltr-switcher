// =====================================================
// AUTO DIRECTION ENABLED STATE
// =====================================================
let autoDirectionEnabled = true;

function isChatGPT() {
  return window.location.hostname === 'chatgpt.com';
}

function getCurrentDomain() {
  return window.location.hostname;
}

function isCodeContext(element) {
  if (element.tagName === 'CODE' || element.tagName === 'PRE') {
    return true;
  }
  if (element.closest('code, pre')) {
    return true;
  }
  if (element.classList && element.classList.contains('wp-editor-area')) {
    return true;
  }
  const codeEditorSelectors = [
    '.CodeMirror',
    '.ace_editor',
    '.monaco-editor',
    '[class*="code-editor"]',
    '[class*="codeEditor"]',
    '[data-language]',
    '.wp-block-code',
    '.language-',
    '[class*="language-"]',
    '.editor-post-text-editor',
    '.block-editor-block-list__block[data-type="core/code"]'
  ];
  for (const selector of codeEditorSelectors) {
    if (element.matches(selector) || element.closest(selector)) {
      return true;
    }
  }
  if (element.classList.contains('editor-post-text-editor') ||
      element.closest('.editor-post-text-editor')) {
    return true;
  }
  return false;
}

function handleFlexContainerDirection(element, isRTL) {
  if (!isChatGPT()) return;
  const selectors = [
    '.relative.mx-5.flex.min-h-14',
    '.flex',
    '[style*="display:flex"]',
    '[style*="display: flex"]'
  ];
  let flexContainer = null;
  for (const selector of selectors) {
    flexContainer = element.closest(selector);
    if (flexContainer) break;
  }
  if (!flexContainer) {
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      const computedStyle = window.getComputedStyle(parent);
      if (computedStyle.display === 'flex') {
        flexContainer = parent;
        break;
      }
      parent = parent.parentElement;
    }
  }
  if (flexContainer) {
    if (!flexContainer.hasAttribute('data-original-flex-direction')) {
      const originalDirection = window.getComputedStyle(flexContainer).flexDirection;
      flexContainer.setAttribute('data-original-flex-direction', originalDirection);
    }
    if (isRTL) {
      flexContainer.style.flexDirection = 'row-reverse';
    } else {
      const originalDirection = flexContainer.getAttribute('data-original-flex-direction');
      flexContainer.style.flexDirection = originalDirection || 'row';
    }
  }
}

// =====================================================
// INPUT EVENT HANDLER
// =====================================================

function createInputHandler(element) {
  return function inputHandler() {
    if (!autoDirectionEnabled) return;
    const text = element.value || element.innerText;
    const isRTL = /[\u0600-\u06FF]/.test(text);
    element.style.direction = isRTL ? 'rtl' : 'ltr';
    element.style.textAlign = isRTL ? 'right' : 'left';
    element.style.unicodeBidi = isRTL ? 'embed' : 'normal';
    if (isChatGPT()) {
      handleFlexContainerDirection(element, isRTL);
    }
    if (element.isContentEditable) {
      const paragraphs = element.querySelectorAll('p');
      paragraphs.forEach(p => {
        if (!isCodeContext(p)) {
          p.style.direction = isRTL ? 'rtl' : 'ltr';
          p.style.textAlign = isRTL ? 'right' : 'left';
          p.style.unicodeBidi = isRTL ? 'embed' : 'normal';
        }
      });
    }
  };
}

function applyAutoDirection(element) {
  if (element.type === 'password') return;
  if (element.tagName === 'TEXTAREA' &&
      element.classList &&
      element.classList.contains('wp-editor-area')) {
    return;
  }
  if (isCodeContext(element)) {
    element.style.direction = 'ltr';
    element.style.textAlign = 'left';
    element.style.unicodeBidi = 'normal';
    return;
  }
  if (element._autoDirectionHandler) return;
  const handler = createInputHandler(element);
  element._autoDirectionHandler = handler;
  element.addEventListener('input', handler);
  element.setAttribute('data-auto-direction-attached', 'true');
}

function removeAutoDirectionStyles() {
  const elements = document.querySelectorAll('[data-auto-direction-attached="true"]');
  elements.forEach((el) => {
    el.style.direction = '';
    el.style.textAlign = '';
    el.style.unicodeBidi = '';
  });
}

function forceCodeBlocksLTR() {
  document.querySelectorAll('code, pre').forEach((element) => {
    element.style.direction = 'ltr';
    element.style.textAlign = 'left';
    element.style.unicodeBidi = 'normal';
  });
  document.querySelectorAll('.editor-post-text-editor, .CodeMirror, .ace_editor, .monaco-editor').forEach((element) => {
    element.style.direction = 'ltr';
    element.style.textAlign = 'left';
    element.style.unicodeBidi = 'normal';
  });
}

// =====================================================
// RTL FIX ENGINE
// =====================================================

let pageDirectionIsRTL = false;

function getRTLRatio(text) {
  if (!text || !text.trim()) return 0;
  const rtlChars = text.match(/[\u0600-\u065F\u066A-\u06EF\u06FA-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/g);
  const latinChars = text.match(/[A-Za-z]/g);
  const rtlCount = rtlChars ? rtlChars.length : 0;
  const latinCount = latinChars ? latinChars.length : 0;
  const totalStrong = rtlCount + latinCount;
  if (totalStrong === 0) return 0;
  return rtlCount / totalStrong;
}

function getTotalStrongChars(text) {
  const rtlChars = text.match(/[\u0600-\u065F\u066A-\u06EF\u06FA-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/g);
  const latinChars = text.match(/[A-Za-z]/g);
  const rtlCount = rtlChars ? rtlChars.length : 0;
  const latinCount = latinChars ? latinChars.length : 0;
  return rtlCount + latinCount;
}

/**
 * Gets only the DIRECT text content of an element (text nodes that are
 * immediate children), excluding text from child elements.
 */
function getDirectTextContent(element) {
  let text = '';
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
    }
  }
  return text;
}

/**
 * Checks if an element has text-bearing child elements.
 * Used to determine if we should use direct text or full textContent.
 */
function hasTextBearingChildren(element) {
  for (const child of element.children) {
    if (TEXT_BEARING_TAGS.has(child.tagName)) {
      const childText = child.textContent || '';
      if (childText.trim().length > 0) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Gets the best text to analyze for direction detection.
 * - If element has text-bearing children: use only direct text nodes
 * - If element is a leaf (no text-bearing children): use full textContent
 */
function getTextForAnalysis(element) {
  if (hasTextBearingChildren(element)) {
    return getDirectTextContent(element);
  }
  return element.textContent || '';
}

function detectDirection(text) {
  if (!text || !text.trim()) return null;
  const rtlRatio = getRTLRatio(text);
  const totalStrong = getTotalStrongChars(text);
  if (totalStrong === 0) return null;

  // Clear majority
  if (rtlRatio >= 0.6) return 'rtl';
  if (rtlRatio <= 0.4) return 'ltr';

  // Ambiguous zone (0.4 - 0.6): use first strong character as tiebreaker
  const firstStrongMatch = text.match(/[A-Za-z\u0600-\u065F\u066A-\u06EF\u06FA-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/);
  if (firstStrongMatch) {
    const firstChar = firstStrongMatch[0];
    if (/[A-Za-z]/.test(firstChar)) return 'ltr';
    return 'rtl';
  }
  return 'ltr';
}

const TEXT_BEARING_TAGS = new Set([
  'P', 'SPAN', 'DIV', 'LI', 'TD', 'TH', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'A', 'LABEL', 'BLOCKQUOTE', 'CAPTION', 'FIGCAPTION', 'SUMMARY', 'DETAILS',
  'DD', 'DT', 'STRONG', 'EM', 'B', 'I', 'U', 'SMALL', 'MARK', 'CITE',
  'Q', 'ABBR', 'TIME', 'S', 'DEL', 'INS', 'SUB', 'SUP', 'UL', 'OL'
]);

function applyDirectionToElementTracked(el, direction) {
  if (isCodeContext(el)) return;
  if (!direction) return;
  if (el.hasAttribute('dir') && !el.hasAttribute('data-original-dir')) {
    el.setAttribute('data-original-dir', el.getAttribute('dir'));
  }
  if (!el.hasAttribute('data-original-text-align')) {
    const computedStyle = window.getComputedStyle(el);
    el.setAttribute('data-original-text-align', computedStyle.textAlign);
  }
  el.setAttribute('dir', direction);
  el.setAttribute('data-auto-rtl-fixed', 'true');
  el.style.direction = direction;
  el.style.textAlign = direction === 'rtl' ? 'right' : 'left';
}

function analyzeAndFixElement(el) {
  if (isCodeContext(el)) return;
  const text = getTextForAnalysis(el);
  if (!text.trim()) return;
  const totalStrong = getTotalStrongChars(text);
  if (totalStrong < 2) return;
  const direction = detectDirection(text);
  if (direction) {
    applyDirectionToElementTracked(el, direction);
  }
}

function fixDirAutoElements() {
  const elements = document.querySelectorAll('[dir="auto"]');
  elements.forEach((el) => {
    if (isCodeContext(el)) return;
    if (el.tagName === 'UL' || el.tagName === 'OL') {
      el.querySelectorAll('li').forEach((li) => {
        analyzeAndFixElement(li);
      });
      analyzeAndFixElement(el);
    } else {
      analyzeAndFixElement(el);
    }
  });
}

function fixTextAlignElements() {
  const allElements = document.body.querySelectorAll('*');
  for (const el of allElements) {
    if (el.hasAttribute('data-auto-rtl-fixed')) continue;
    if (!TEXT_BEARING_TAGS.has(el.tagName)) continue;
    if (isCodeContext(el)) continue;
    if (el.offsetParent === null && el.tagName !== 'BODY') continue;

    const text = getTextForAnalysis(el);
    if (!text.trim() || text.trim().length < 2) continue;
    const totalStrong = getTotalStrongChars(text);
    if (totalStrong < 2) continue;

    const direction = detectDirection(text);
    if (!direction) continue;

    const computedStyle = window.getComputedStyle(el);
    const currentTextAlign = computedStyle.textAlign;

    if (direction === 'ltr') {
      applyDirectionToElementTracked(el, 'ltr');
    } else if (direction === 'rtl' && (currentTextAlign === 'left' || currentTextAlign === 'start')) {
      applyDirectionToElementTracked(el, 'rtl');
    }
  }
}

function fixAllRTLIssues() {
  fixDirAutoElements();
  fixTextAlignElements();
  forceCodeBlocksLTR();
}

function revertAllRTLFixes() {
  const fixedElements = document.querySelectorAll('[data-auto-rtl-fixed="true"]');
  fixedElements.forEach((el) => {
    if (el.hasAttribute('data-original-dir')) {
      el.setAttribute('dir', el.getAttribute('data-original-dir'));
      el.removeAttribute('data-original-dir');
    } else if (el.tagName === 'LI') {
      el.removeAttribute('dir');
    } else if (el.hasAttribute('dir')) {
      el.removeAttribute('dir');
    }
    if (el.hasAttribute('data-original-text-align')) {
      el.style.textAlign = '';
      el.removeAttribute('data-original-text-align');
    } else {
      el.style.textAlign = '';
    }
    el.style.direction = '';
    el.removeAttribute('data-auto-rtl-fixed');
  });
}
function fixNewNode(node) {
  if (!node.querySelectorAll) return;
  if (node.hasAttribute && node.getAttribute('dir') === 'auto') {
    if (node.tagName === 'UL' || node.tagName === 'OL') {
      node.querySelectorAll('li').forEach((li) => {
        analyzeAndFixElement(li);
      });
      analyzeAndFixElement(node);
    } else {
      analyzeAndFixElement(node);
    }
  }
  node.querySelectorAll('[dir="auto"]').forEach((autoEl) => {
    if (isCodeContext(autoEl)) return;
    if (autoEl.tagName === 'UL' || autoEl.tagName === 'OL') {
      autoEl.querySelectorAll('li').forEach((li) => {
        analyzeAndFixElement(li);
      });
      analyzeAndFixElement(autoEl);
    } else {
      analyzeAndFixElement(autoEl);
    }
  });
  const candidates = node.querySelectorAll
    ? node.querySelectorAll(Array.from(TEXT_BEARING_TAGS).join(','))
    : [];
  for (const el of candidates) {
    if (el.hasAttribute('data-auto-rtl-fixed')) continue;
    if (isCodeContext(el)) continue;
    const text = getTextForAnalysis(el);
    if (!text.trim() || text.trim().length < 2) continue;
    const totalStrong = getTotalStrongChars(text);
    if (totalStrong < 2) continue;
    const direction = detectDirection(text);
    if (!direction) continue;
    const computedStyle = window.getComputedStyle(el);
    const currentTextAlign = computedStyle.textAlign;
    if (direction === 'ltr') {
      applyDirectionToElementTracked(el, 'ltr');
    } else if (direction === 'rtl' && (currentTextAlign === 'left' || currentTextAlign === 'start')) {
      applyDirectionToElementTracked(el, 'rtl');
    }
  }
  if (node.nodeType === 1 && TEXT_BEARING_TAGS.has(node.tagName)) {
    if (!node.hasAttribute('data-auto-rtl-fixed') && !isCodeContext(node)) {
      const text = getTextForAnalysis(node);
      if (text.trim() && text.trim().length >= 2) {
        const totalStrong = getTotalStrongChars(text);
        if (totalStrong >= 2) {
          const direction = detectDirection(text);
          if (direction) {
            const computedStyle = window.getComputedStyle(node);
            const currentTextAlign = computedStyle.textAlign;
            if (direction === 'ltr') {
              applyDirectionToElementTracked(node, 'ltr');
            } else if (direction === 'rtl' && (currentTextAlign === 'left' || currentTextAlign === 'start')) {
              applyDirectionToElementTracked(node, 'rtl');
            }
          }
        }
      }
    }
  }
  if (node.matches && node.matches('code, pre')) {
    node.style.direction = 'ltr';
    node.style.textAlign = 'left';
    node.style.unicodeBidi = 'normal';
  }
  if (node.querySelectorAll) {
    node.querySelectorAll('code, pre').forEach((codeBlock) => {
      codeBlock.style.direction = 'ltr';
      codeBlock.style.textAlign = 'left';
      codeBlock.style.unicodeBidi = 'normal';
    });
  }
}

// =====================================================
// END RTL FIX ENGINE
// =====================================================

function initializeAutoDirection() {
  if (!autoDirectionEnabled) return;
  document.querySelectorAll('textarea, input, [contenteditable="true"]').forEach((element) => {
    applyAutoDirection(element);
  });
  forceCodeBlocksLTR();
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        if (autoDirectionEnabled) {
          if (node.matches('textarea, input') || node.isContentEditable) {
            applyAutoDirection(node);
          }
        }
        if (node.matches('code, pre')) {
          node.style.direction = 'ltr';
          node.style.textAlign = 'left';
          node.style.unicodeBidi = 'normal';
        }
        if (node.querySelectorAll) {
          if (autoDirectionEnabled) {
            node.querySelectorAll('textarea, input, [contenteditable="true"]').forEach((child) => {
              applyAutoDirection(child);
            });
          }
          node.querySelectorAll('code, pre').forEach((codeBlock) => {
            codeBlock.style.direction = 'ltr';
            codeBlock.style.textAlign = 'left';
            codeBlock.style.unicodeBidi = 'normal';
          });
          node.querySelectorAll('.editor-post-text-editor, .CodeMirror, .ace_editor, .monaco-editor').forEach((editor) => {
            editor.style.direction = 'ltr';
            editor.style.textAlign = 'left';
            editor.style.unicodeBidi = 'normal';
          });
          if (pageDirectionIsRTL) {
            fixNewNode(node);
          }
        }
      }
    });
  });
});

observer.observe(document.body, { childList: true, subtree: true });

// =====================================================
// AUTO DIRECTION SETTING — LOAD & SAVE
// =====================================================

function saveAutoDirectionSetting(enabled) {
  const domain = getCurrentDomain();
  chrome.storage.local.get(['autoDirectionSettings'], (result) => {
    const settings = result.autoDirectionSettings || {};
    settings[domain] = { enabled: enabled };
    chrome.storage.local.set({ autoDirectionSettings: settings });
  });
}

function loadAutoDirectionSetting(callback) {
  const domain = getCurrentDomain();
  chrome.storage.local.get(['autoDirectionSettings'], (result) => {
    const settings = result.autoDirectionSettings || {};
    const domainSetting = settings[domain];
    if (domainSetting && typeof domainSetting.enabled !== 'undefined') {
      autoDirectionEnabled = domainSetting.enabled;
    } else {
      autoDirectionEnabled = true;
    }
    if (callback) callback(autoDirectionEnabled);
  });
}

function enableAutoDirection() {
  autoDirectionEnabled = true;
  saveAutoDirectionSetting(true);
  document.querySelectorAll('textarea, input, [contenteditable="true"]').forEach((element) => {
    applyAutoDirection(element);
  });
}

function disableAutoDirection() {
  autoDirectionEnabled = false;
  saveAutoDirectionSetting(false);
  removeAutoDirectionStyles();
}

loadAutoDirectionSetting((enabled) => {
  if (enabled) {
    initializeAutoDirection();
  } else {
    forceCodeBlocksLTR();
  }
});

// =====================================================
// FONT TOGGLE
// =====================================================

let fontToggled = false;

function saveFontSetting(enabled) {
  const domain = getCurrentDomain();
  chrome.storage.local.get(['fontSettings'], (result) => {
    const fontSettings = result.fontSettings || {};
    fontSettings[domain] = { fontEnabled: enabled };
    chrome.storage.local.set({ fontSettings });
    chrome.runtime.sendMessage({
      action: 'fontStateChanged',
      domain: domain,
      enabled: enabled
    });
  });
}

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

function injectFontStyle(context) {
  if (!context) return;
  let createElement;
  if (typeof context.createElement === 'function') {
    createElement = context.createElement.bind(context);
  } else if (context.ownerDocument && typeof context.ownerDocument.createElement === 'function') {
    createElement = context.ownerDocument.createElement.bind(context.ownerDocument);
  } else {
    return;
  }
  let existingStyle = null;
  if (typeof context.getElementById === 'function') {
    existingStyle = context.getElementById('vazirmatn-global-style');
  } else if (typeof context.querySelector === 'function') {
    existingStyle = context.querySelector('#vazirmatn-global-style');
  }
  if (!existingStyle) {
    const style = createElement('style');
    style.id = 'vazirmatn-global-style';
    style.innerHTML = `
      *:not(code):not(pre):not(.CodeMirror):not(.CodeMirror *):not(.ace_editor):not(.ace_editor *):not(.monaco-editor):not(.monaco-editor *) {
        font-family: 'Vazirmatn', sans-serif;
      }
      mat-icon, mat-icon * {
        font-family: unset;
      }
      .conversation-title {
        font-family: 'Vazirmatn', sans-serif;
      }
      code, code *,
      pre, pre *,
      .CodeMirror, .CodeMirror *,
      .ace_editor, .ace_editor *,
      .monaco-editor, .monaco-editor *,
      [class*="code-editor"], [class*="code-editor"] *,
      [class*="codeEditor"], [class*="codeEditor"] *,
      [class*="language-"], [class*="language-"] *,
      .wp-block-code, .wp-block-code *,
      .editor-post-text-editor, .editor-post-text-editor *,
      .block-editor-block-list__block[data-type="core/code"],
      .block-editor-block-list__block[data-type="core/code"] * {
        font-family: revert !important;
      }
      code, pre, .CodeMirror, .ace_editor, .monaco-editor,
      [class*="code-editor"], [class*="codeEditor"], [class*="language-"],
      .wp-block-code, .editor-post-text-editor,
      .block-editor-block-list__block[data-type="core/code"] {
        direction: ltr !important;
        text-align: left !important;
        unicode-bidi: normal !important;
      }
    `;
    if (context.head) {
      context.head.appendChild(style);
    } else if (context.documentElement) {
      context.documentElement.appendChild(style);
    } else if (typeof context.appendChild === 'function') {
      context.appendChild(style);
    }
  }
  if (context.body) {
    const walker = context.createTreeWalker(context.body, NodeFilter.SHOW_ELEMENT, null, false);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.shadowRoot) {
        injectFontStyle(node.shadowRoot);
      }
    }
  }
  if (typeof context.getElementsByTagName === 'function') {
    const iframes = context.getElementsByTagName('iframe');
    for (let i = 0; i < iframes.length; i++) {
      try {
        const iframeDoc = iframes[i].contentDocument;
        injectFontStyle(iframeDoc);
      } catch (e) {
        // Cross-origin iframes; ignore
      }
    }
  }
}

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
  if (context.body) {
    const walker = context.createTreeWalker(context.body, NodeFilter.SHOW_ELEMENT, null, false);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.shadowRoot) {
        removeFontStyle(node.shadowRoot);
      }
    }
  }
  if (typeof context.getElementsByTagName === 'function') {
    const iframes = context.getElementsByTagName('iframe');
    for (let i = 0; i < iframes.length; i++) {
      try {
        const iframeDoc = iframes[i].contentDocument;
        removeFontStyle(iframeDoc);
      } catch (e) {
        // Cross-origin; ignore
      }
    }
  }
}

function loadVazirmatnFont() {
  if (!document.getElementById('vazirmatn-font-link')) {
    const link = document.createElement('link');
    link.id = 'vazirmatn-font-link';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap';
    document.head.appendChild(link);
  }
}

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
  return fontToggled;
}

loadFontSetting();

// =====================================================
// TOGGLE PAGE DIRECTION
// =====================================================

function togglePageDirection() {
  if (document.body.dir === 'rtl') {
    document.body.dir = 'ltr';
    pageDirectionIsRTL = false;
    revertAllRTLFixes();
  } else {
    document.body.dir = 'rtl';
    pageDirectionIsRTL = true;
    fixAllRTLIssues();
  }
}

// =====================================================
// MESSAGE LISTENER
// =====================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleFont') {
    const newState = togglePageFont();
    sendResponse({ status: 'font toggled', enabled: newState });
  } else if (request.action === 'toggleDirection') {
    togglePageDirection();
    sendResponse({ status: 'direction toggled' });
  } else if (request.action === 'getFontState') {
    sendResponse({ enabled: fontToggled });
  } else if (request.action === 'getAutoDirectionState') {
    sendResponse({ enabled: autoDirectionEnabled });
  } else if (request.action === 'setAutoDirection') {
    if (request.enabled) {
      enableAutoDirection();
    } else {
      disableAutoDirection();
    }
    sendResponse({ enabled: autoDirectionEnabled });
  }
  return true;
});

// =====================================================
// FALLBACK KEYBOARD SHORTCUT LISTENER
// Uses event.code (physical key) — layout-independent
// =====================================================

document.addEventListener('keydown', (event) => {
  const isCtrl = event.ctrlKey || event.metaKey;
  const isShift = event.shiftKey;
  const isKeyX = event.code === 'KeyX';
  const isAlt = event.altKey;
  if (isCtrl && isShift && isKeyX && !isAlt) {
    event.preventDefault();
    event.stopPropagation();
    togglePageDirection();
  }
}, true);
