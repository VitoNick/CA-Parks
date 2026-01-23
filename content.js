// content.js – runs on reservecalifornia.com pages

(function () {
  'use strict';

  // Toast helper
  function toast(msg) {
    const div = document.createElement('div');
    div.textContent = msg;
    Object.assign(div.style, {
      position: 'fixed', zIndex: 999999, right: '12px', bottom: '12px',
      padding: '8px 12px', background: '#143d59', color: '#fff',
      borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,.25)',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '13px'
    });
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2500);
  }

  // Persistent settings
  const defaults = {
    enabled: false,
    targetText: "",     // unique snippet in the card you want (optional)
    schedule: "",       // "HH:MM:SS.mmm" local time, e.g. "07:59:59.800" (optional)
  };
  let cfg = { ...defaults };

  // Load config
  chrome.storage.sync.get(defaults, (data) => {
    cfg = data;
    if (cfg.enabled) toast('RC Helper: enabled');
    if (cfg.schedule) scheduleOnce(cfg.schedule);
  });

  // React-friendly click
  function reactClick(el) {
    if (!el) return false;
    if (el.hasAttribute('disabled')) el.removeAttribute('disabled'); // disabled elements don't click
    const evt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
    return el.dispatchEvent(evt);
  }

  // Find "Book Now" buttons; narrow to a card containing targetText if provided
  function findBookButtons() {
    const btns = Array.from(document.querySelectorAll('button, a[role="button"]'));
    const matches = btns.filter(b => /book\s*now/i.test(b.textContent || ""));
    if (!cfg.targetText) return matches;

    const needle = cfg.targetText.toLowerCase();
    return matches.filter(b => {
      let el = b, depth = 0;
      while (el && depth < 10) {
        if ((el.textContent || "").toLowerCase().includes(needle)) return true;
        el = el.parentElement; depth++;
      }
      return false;
    });
  }

  function tryBookNow(reason = 'auto') {
    if (!cfg.enabled) return false;
    const btns = findBookButtons();
    if (!btns.length) { console.debug('[RC Helper] No Book Now buttons'); return false; }
    const target = btns.find(b => !b.disabled && !b.hasAttribute('disabled')) || btns[0];
    console.debug(`[RC Helper] Clicking via ${reason}`, target);
    const ok = reactClick(target);
    if (ok) toast(`RC Helper: clicked (${reason})`);
    return ok;
  }

  // Listen for their timer completion event
  document.addEventListener('refresh-grid', () => {
    if (!cfg.enabled) return;
    console.debug('[RC Helper] refresh-grid fired');
    setTimeout(() => tryBookNow('refresh-grid'), 0);
  });

  // MutationObserver—fire when a Book Now flips enabled
  const mo = new MutationObserver(muts => {
    if (!cfg.enabled) return;
    for (const m of muts) {
      if (m.type === 'attributes' && m.attributeName === 'disabled') {
        const el = m.target;
        if (/book\s*now/i.test(el.textContent || "")) {
          if (!el.disabled && !el.hasAttribute('disabled')) {
            console.debug('[RC Helper] Button enabled');
            reactClick(el);
            toast('RC Helper: clicked (enabled)');
          }
        }
      }
    }
  });
  mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['disabled'] });

  // Optional one-shot scheduler (today at HH:MM:SS.mmm)
  function scheduleOnce(hms) {
    const [H, M, Sms] = hms.split(':');
    const [S, ms = "0"] = (Sms || "0").split('.');
    const tgt = new Date();
    tgt.setHours(+H, +M, +S, +ms);
    const delay = Math.max(0, tgt.getTime() - Date.now());
    if (delay === 0) return;
    console.debug(`[RC Helper] Scheduling click in ${delay} ms`);
    toast(`RC Helper: scheduled for ${hms}`);
    setTimeout(() => tryBookNow('scheduled'), delay);
  }

  // Live-update settings when user changes Options/Popup
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (changes.enabled) {
      cfg.enabled = changes.enabled.newValue;
      toast(`RC Helper: ${cfg.enabled ? 'enabled' : 'disabled'}`);
    }
    if (changes.targetText) cfg.targetText = changes.targetText.newValue;
    if (changes.schedule) {
      cfg.schedule = changes.schedule.newValue;
      if (cfg.schedule) scheduleOnce(cfg.schedule);
    }
  });

  // Expose manual helpers in console
  window.rcBookNow = () => tryBookNow('manual');
})();