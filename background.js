// Listen for keyboard shortcut commands
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-direction") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggleDirection" });
      }
    });
  }
});

// When a tab is updated (loaded), apply the saved font setting
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;

      // Check if we have a saved font setting for this domain
      chrome.storage.local.get(['fontSettings'], (result) => {
        const fontSettings = result.fontSettings || {};
        const domainSetting = fontSettings[domain];

        if (domainSetting && domainSetting.fontEnabled) {
          // Apply the font if it was enabled for this domain
          chrome.tabs.sendMessage(tabId, {
            action: "toggleFont"
          });
        }
      });
    } catch (e) {
      // Invalid URL, ignore
      console.error("Error processing URL:", e);
    }
  }
});
