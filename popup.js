document.addEventListener('DOMContentLoaded', function () {
  const toggleFontBtn     = document.getElementById('toggleFont');
  const toggleDirBtn      = document.getElementById('toggleDirection');
  const siteDisabledCheck = document.getElementById('toggleSiteDisabled');
  const versionLabel      = document.getElementById('versionLabel');

  // Read version from manifest.json automatically
  const { version } = chrome.runtime.getManifest();
  versionLabel.textContent = `Auto RTL/LTR Switcher v${version}`;

  function setFontActive(enabled) {
    toggleFontBtn.classList.toggle('active', !!enabled);
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs?.[0]?.id) return;
    const tabId = tabs[0].id;

    // Restore font state
    chrome.tabs.sendMessage(tabId, { action: 'getFontState' }, (res) => {
      if (chrome.runtime.lastError) return;
      if (res) setFontActive(res.enabled);
    });

    // Restore site-disabled state
    chrome.tabs.sendMessage(tabId, { action: 'getSiteDisabledState' }, (res) => {
      if (chrome.runtime.lastError) return;
      if (res) siteDisabledCheck.checked = res.isDisabled;
    });

    toggleFontBtn.addEventListener('click', () => {
      chrome.tabs.sendMessage(tabId, { action: 'toggleFont' }, (res) => {
        if (chrome.runtime.lastError) return;
        if (res) setFontActive(res.enabled);
      });
    });

    toggleDirBtn.addEventListener('click', () => {
      chrome.tabs.sendMessage(tabId, { action: 'toggleDirection' }, (res) => {
        if (chrome.runtime.lastError) return;
      });
    });

    siteDisabledCheck.addEventListener('change', () => {
      chrome.tabs.sendMessage(tabId, { action: 'toggleSiteDisabled' }, (res) => {
        if (chrome.runtime.lastError) {
          siteDisabledCheck.checked = !siteDisabledCheck.checked; // revert
          return;
        }
        if (res) siteDisabledCheck.checked = res.isDisabled;
      });
    });
  });
});
