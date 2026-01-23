const defaults = { enabled: false, targetText: "", schedule: "" };

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(defaults, ({enabled, targetText, schedule}) => {
    document.getElementById('enabled').checked = enabled;
    document.getElementById('targetText').value = targetText;
    document.getElementById('schedule').value = schedule;
  });

  document.getElementById('save').addEventListener('click', () => {
    const enabled = document.getElementById('enabled').checked;
    const targetText = document.getElementById('targetText').value.trim();
    const schedule = document.getElementById('schedule').value.trim();
    chrome.storage.sync.set({ enabled, targetText, schedule });
    window.close();
  });

  document.getElementById('click').addEventListener('click', async () => {
    // Ask the active tab (content.js) to click now by toggling a flag briefly
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs[0]) return;
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => window.rcBookNow && window.rcBookNow()
      });
    });
  });
});