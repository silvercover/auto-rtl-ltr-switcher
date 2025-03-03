document.addEventListener('DOMContentLoaded', function () {
  const toggleFontButton = document.getElementById('toggleFont');
  const toggleDirectionButton = document.getElementById('toggleDirection');

  function sendMessageToActiveTab(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || !tabs[0]) {
        console.error("No active tab found");
        return;
      }
      const tabId = tabs[0].id;
      chrome.tabs.sendMessage(tabId, { action: action }, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error: " + chrome.runtime.lastError.message);
          if (chrome.runtime.lastError.message.includes("Could not establish connection")) {
            // Re-inject content script dynamically using chrome.scripting.executeScript
            chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ["content.js"]
            }, () => {
              if (chrome.runtime.lastError) {
                console.error("Injection error: " + chrome.runtime.lastError.message);
                alert("Failed to inject content script: " + chrome.runtime.lastError.message);
              } else {
                // Try sending the message again after injection
                chrome.tabs.sendMessage(tabId, { action: action }, function(resp) {
                  if (chrome.runtime.lastError) {
                    console.error("Error after injection: " + chrome.runtime.lastError.message);
                    alert("Error after injection: " + chrome.runtime.lastError.message);
                  } else if (resp) {
                    console.log(resp.status);
                  } else {
                    console.log("No response received after injection");
                  }
                });
              }
            });
          } else {
            alert("Error: " + chrome.runtime.lastError.message);
          }
        } else if (response) {
          console.log(response.status);
        } else {
          console.log("No response received");
        }
      });
    });
  }

  toggleFontButton.addEventListener('click', function () {
    sendMessageToActiveTab('toggleFont');
  });

  toggleDirectionButton.addEventListener('click', function () {
    sendMessageToActiveTab('toggleDirection');
  });
});
