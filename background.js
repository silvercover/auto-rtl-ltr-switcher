// Listen for keyboard shortcut commands
chrome.commands.onCommand.addListener((command) => {
    if (command === "toggle-direction") {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "toggleDirection" });
        }
      });
    }
  });