document.addEventListener('DOMContentLoaded', function () {
  const toggleFontButton = document.getElementById('toggleFont');
  const toggleDirectionButton = document.getElementById('toggleDirection');

  function sendMessageToActiveTab(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: action }, function (response) {
          if (chrome.runtime.lastError) {
            console.error("Error: " + chrome.runtime.lastError.message);
            alert("Error: " + chrome.runtime.lastError.message + "\nThe content script may not be active on this tab.");
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
  }

  toggleFontButton.addEventListener('click', function () {
    sendMessageToActiveTab('toggleFont');
  });

  toggleDirectionButton.addEventListener('click', function () {
    sendMessageToActiveTab('toggleDirection');
  });
});
