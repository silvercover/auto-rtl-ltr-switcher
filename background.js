chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-direction') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs?.[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleDirection' });
      }
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const domain = new URL(tab.url).hostname;
      chrome.storage.local.get(['fontSettings', 'disabledSites'], (result) => {
        if ((result.disabledSites || {})[domain]) return;
        if ((result.fontSettings || {})[domain]?.fontEnabled) {
          chrome.tabs.sendMessage(tabId, { action: 'toggleFont' });
        }
      });
    } catch (e) {
      console.error('Error processing URL:', e);
    }
  }
});
