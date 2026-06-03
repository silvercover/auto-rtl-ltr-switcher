// ─────────────────────────────────────────────────────────────
// Badge helper
// ─────────────────────────────────────────────────────────────
function updateBadgeForTab(tabId, url) {
  try {
    const domain = new URL(url).hostname;
    chrome.storage.local.get(['disabledSites'], (result) => {
      const isDisabled = !!(result.disabledSites || {})[domain];
      if (isDisabled) {
        chrome.action.setBadgeText({ text: '✕', tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#e53935', tabId });
        chrome.action.setBadgeTextColor({ color: '#ffffff', tabId });
      } else {
        chrome.action.setBadgeText({ text: '', tabId });
      }
    });
  } catch (e) { /* invalid URL — chrome:// etc. */ }
}

// ─────────────────────────────────────────────────────────────
// onUpdated: used only for font restore
// Badge is now handled via 'pageLoaded' message from content.js
// (service worker cache was unreliable — gets cleared when SW sleeps)
// ─────────────────────────────────────────────────────────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;

  // Use chrome.tabs.get for a guaranteed fresh URL
  chrome.tabs.get(tabId, (freshTab) => {
    if (chrome.runtime.lastError || !freshTab?.url) return;
    const url = freshTab.url;

    try {
      const domain = new URL(url).hostname;
      chrome.storage.local.get(['fontSettings', 'disabledSites'], (result) => {
        if ((result.disabledSites || {})[domain]) return;
        if ((result.fontSettings || {})[domain]?.fontEnabled) {
          chrome.tabs.sendMessage(tabId, { action: 'toggleFont' });
        }
      });
    } catch (e) {
      console.error('Error processing URL:', e);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// onActivated: update badge when switching tabs
// ─────────────────────────────────────────────────────────────
chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab?.url) return;
    updateBadgeForTab(tabId, tab.url);
  });
});

// ─────────────────────────────────────────────────────────────
// Message listener
// ─────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender) => {

  // content.js sends this on every page load — most reliable badge trigger
  if (message.action === 'pageLoaded' && sender.tab) {
    updateBadgeForTab(sender.tab.id, message.url || sender.tab.url);
  }

  // content.js sends this right after user toggles disable in popup
  if (message.action === 'refreshBadge' && sender.tab) {
    const url = message.url || sender.tab.url;
    if (url) updateBadgeForTab(sender.tab.id, url);
  }
});

// ─────────────────────────────────────────────────────────────
// Keyboard shortcut
// ─────────────────────────────────────────────────────────────
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-direction') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs?.[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleDirection' });
      }
    });
  }
});
