document.addEventListener('DOMContentLoaded', function () {
  const toggleFontButton = document.getElementById('toggleFont');
  const toggleDirectionButton = document.getElementById('toggleDirection');
  const autoDirectionToggle = document.getElementById('autoDirectionToggle');
  const autoDirectionContainer = document.getElementById('autoDirectionContainer');

  // Function to update the font button's visual state
  function updateFontButtonState(enabled) {
    if (enabled) {
      toggleFontButton.classList.add('active');
    } else {
      toggleFontButton.classList.remove('active');
    }
  }

  // Function to update the auto direction switch visual state
  function updateAutoDirectionState(enabled) {
    autoDirectionToggle.checked = enabled;
    if (enabled) {
      autoDirectionContainer.classList.remove('disabled');
    } else {
      autoDirectionContainer.classList.add('disabled');
    }
  }
  
  // Query the active tab to get its ID
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs || !tabs[0] || !tabs[0].id) {
      console.error("Could not find active tab.");
      return;
    }
    const tabId = tabs[0].id;

    // Get the current font state
    chrome.tabs.sendMessage(tabId, { action: 'getFontState' }, function(response) {
      if (chrome.runtime.lastError) {
        console.log("Content script might not be injected yet.");
        return; 
      }
      if (response && typeof response.enabled !== 'undefined') {
        updateFontButtonState(response.enabled);
      }
    });

    // Get the current auto direction state
    chrome.tabs.sendMessage(tabId, { action: 'getAutoDirectionState' }, function(response) {
      if (chrome.runtime.lastError) {
        console.log("Content script might not be injected yet.");
        return;
      }
      if (response && typeof response.enabled !== 'undefined') {
        updateAutoDirectionState(response.enabled);
      }
    });

    // --- Event Listeners ---

    toggleFontButton.addEventListener('click', function () {
      chrome.tabs.sendMessage(tabId, { action: 'toggleFont' }, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error sending toggleFont message: " + chrome.runtime.lastError.message);
          return;
        }
        if (response && typeof response.enabled !== 'undefined') {
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

    // Auto Direction toggle switch
    autoDirectionToggle.addEventListener('change', function () {
      const enabled = autoDirectionToggle.checked;
      chrome.tabs.sendMessage(tabId, { action: 'setAutoDirection', enabled: enabled }, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error sending setAutoDirection message: " + chrome.runtime.lastError.message);
          // Revert the toggle if message failed
          autoDirectionToggle.checked = !enabled;
          return;
        }
        if (response && typeof response.enabled !== 'undefined') {
          updateAutoDirectionState(response.enabled);
        }
      });
    });
  });
});
