// Update the badge text and background color to indicate the current text direction
function updateBadge(direction) {
  const badgeText = direction === 'rtl' ? 'RTL' : 'LTR';
  const badgeColor = direction === 'rtl' ? '#28a745' : '#d3d3d3'; // Green for RTL, Light Gray for LTR

  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
}

// Send a message to content script to detect direction and update badge
function detectAndUpdateBadge(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ["content.js"]
  }).then(() => {
    chrome.tabs.sendMessage(tabId, { action: 'detectDirection' });
  }).catch((error) => {
    console.log("Error injecting content script or sending message:", error);
  });
}

// Listener for messages from content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'updateBadge') {
    updateBadge(message.direction);
  }
});

// Listener for when a tab is activated
chrome.tabs.onActivated.addListener((activeInfo) => {
  detectAndUpdateBadge(activeInfo.tabId);
});

// Listener for when the URL of a tab changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    detectAndUpdateBadge(tabId);
  }
});

// Listener for browser action (icon click) to toggle direction
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  }).then(() => {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleDirection' });
  }).catch((error) => {
    console.log("Error injecting content script or sending message:", error);
  });
});
