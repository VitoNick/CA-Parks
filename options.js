const defaults = { enabled: false, targetText: "", schedule: "" };

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(defaults, (data) => {
    document.getElementById('enabled').checked = data.enabled;
    document.getElementById('targetText').value = data.targetText;
    document.getElementById('schedule').value = data.schedule;
  });

  document.getElementById('save').addEventListener('click', () => {
    const enabled = document.getElementById('enabled').checked;
    const targetText = document.getElementById('targetText').value.trim();
    const schedule = document.getElementById('schedule').value.trim();
    chrome.storage.sync.set({ enabled, targetText, schedule }, () => {
      const s = document.getElementById('status');
      s.textContent = 'Saved';
      setTimeout(() => s.textContent = '', 1200);
    });
  });
});