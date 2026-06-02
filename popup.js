document.addEventListener('DOMContentLoaded', function () {
  const toggleFontButton = document.getElementById('toggleFont');
  const toggleDirectionButton = document.getElementById('toggleDirection');

  // Function to update the font button's visual state
  function updateFontButtonState(enabled) {
    if (enabled) {
      toggleFontButton.classList.add('active');
    } else {
      toggleFontButton.classList.remove('active');
    }
  }
  
  // Query the active tab to get its ID
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs || !tabs[0] || !tabs[0].id) {
      console.error("Could not find active tab.");
      return;
    }
    const tabId = tabs[0].id;

    // Immediately ask the content script for the current font state when the popup opens
    chrome.tabs.sendMessage(tabId, { action: 'getFontState' }, function(response) {
      // Handle cases where the content script isn't ready
      if (chrome.runtime.lastError) {
        console.log("Content script might not be injected yet. Button will appear as default.");
        return; 
      }
      if (response && typeof response.enabled !== 'undefined') {
        updateFontButtonState(response.enabled);
      }
    });

    // --- Event Listeners ---

    toggleFontButton.addEventListener('click', function () {
      chrome.tabs.sendMessage(tabId, { action: 'toggleFont' }, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error sending toggleFont message: " + chrome.runtime.lastError.message);
          // Optional: Add logic here to inject the script if it's missing
          return;
        }
        if (response && typeof response.enabled !== 'undefined') {
          // Update button state immediately based on the response from the content script
          updateFontButtonState(response.enabled);
        }
      });
    });

    toggleDirectionButton.addEventListener('click', function () {
      chrome.tabs.sendMessage(tabId, { action: 'toggleDirection' }, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error sending toggleDirection message: " + chrome.runtime.lastError.message);
          return;
        }
        if (response) {
          console.log(response.status);
        }
      });
    });
  });
});