document.getElementById('toggleFont').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleFont'}, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error: " + chrome.runtime.lastError.message);
          return;
        }
        if (response) {
          console.log(response.status);
        } else {
          console.log("No response received");
        }
      });
    }
  });
});

document.getElementById('toggleDirection').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleDirection'}, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error: " + chrome.runtime.lastError.message);
          return;
        }
        if (response) {
          console.log(response.status);
        } else {
          console.log("No response received");
        }
      });
    }
  });
});
