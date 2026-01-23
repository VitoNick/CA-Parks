/*************************************************************************
 🟢 BOOK NOW — DIAG & SAFE UNMASK HELPER (no auto-click)
   Paste ~10s before release; leaves console intact.
**************************************************************************/

(() => {
  // ===== Config =====
  const CONFIG = {
    releaseHourLocal: 8,                 // local hour gate (keeps actions quiet before 8:00)
    unmaskAfterAvailability: true,       // try to clear stale front-end masks after an availability call
    consoleCountdown: true,              // show countdown in console (no on-screen widget)
    countdownUntilSec: 12,               // stop countdown N sec after 8:00
    availabilityUrlPattern: /availability|getbyunit|inventory|hold|reserve/i,
    buttonSel: '.book-now-btn #checkout-button',
    wrapperSel: '.book-now-btn'
  };

  // ===== Internals =====
  const S = {};
  const nowISO = () => new Date().toISOString();

  function getBtn() { return document.querySelector(CONFIG.buttonSel); }
  function getWrap() { return document.querySelector(CONFIG.wrapperSel); }

  function btnSnap(label='snap') {
    const b = getBtn();
    if (!b) { console.log(`[${label}] no button found`); return null; }
    const cs = getComputedStyle(b);
    const rect = b.getBoundingClientRect();
    const topEl = document.elementFromPoint(rect.left + 5, rect.top + 5);
    const snap = {
      ts: nowISO(),
      label,
      exists: !!b,
      text: (b.textContent||'').trim(),
      hasDisabledAttr: b.hasAttribute('disabled'),
      ariaDisabled: b.getAttribute('aria-disabled'),
      hasDisableClass: b.classList.contains('disable-btn'),
      classes: b.className,
      style: {
        pointerEvents: cs.pointerEvents,
        opacity: cs.opacity,
        cursor: cs.cursor,
        zIndex: cs.zIndex
      },
      rect: {x: rect.x, y: rect.y, w: rect.width, h: rect.height},
      topElement: topEl ? `${topEl.tagName}.${topEl.className}` : null,
      blockedByOverlay: topEl && topEl !== b,
      wrapperClasses: getWrap()?.className || null
    };
    console.log('[BUTTON SNAP]', snap);
    return snap;
  }

  function stackAtButton() {
    const b = getBtn(); if (!b) return console.log('No button for stack.');
    const r = b.getBoundingClientRect();
    const arr = document.elementsFromPoint(r.left+5, r.top+5).map(el => ({
      tag: el.tagName,
      id: el.id,
      cls: el.className,
      z: getComputedStyle(el).zIndex,
      pe: getComputedStyle(el).pointerEvents,
      pos: getComputedStyle(el).position
    }));
    console.table(arr);
    return arr;
  }

  // Distinguish blockers & optionally unmask
  function analyzeAndMaybeUnmask(reason='manual') {
    const b = getBtn();
    if (!b) return console.log(`[analyze] no button (reason=${reason}).`);

    const hasDisabledAttr = b.hasAttribute('disabled');
    const ariaDisabled = b.getAttribute('aria-disabled') === 'true';
    const hasDisableClass = b.classList.contains('disable-btn');
    const cs = getComputedStyle(b);
    const overlay = (() => {
      const r = b.getBoundingClientRect();
      const top = document.elementFromPoint(r.left+5, r.top+5);
      return top && top !== b ? top : null;
    })();

    const report = {
      ts: nowISO(),
      reason,
      hasDisabledAttr,
      ariaDisabled,
      hasDisableClass,
      cssPointerEvents: cs.pointerEvents,
      cssOpacity: cs.opacity,
      overlayTag: overlay?.tagName || null,
      overlayCls: overlay?.className || null
    };
    console.log('[analyze]', report);

    // Safety: only “fix” stale front-end masks; don’t fight ARIA true.
    if (!CONFIG.unmaskAfterAvailability) return;

    // Gate to after release hour (local)
    const afterLocalRelease = new Date().getHours() >= CONFIG.releaseHourLocal;

    if (!afterLocalRelease) {
      console.log('[fix] Before release hour; not touching.');
      return;
    }

    if (ariaDisabled) {
      console.log('[fix] aria-disabled=true; leaving untouched.');
      return;
    }

    // If a real disabled attr remains but we know we’re after release (and typically after an availability call),
    // we’ll remove it to make the UI honest. Backend will still enforce reality.
    let changed = false;
    if (hasDisabledAttr) { b.removeAttribute('disabled'); changed = true; }
    if (hasDisableClass) { b.classList.remove('disable-btn'); changed = true; }
    if (cs.pointerEvents === 'none') { b.style.pointerEvents = 'auto'; changed = true; }
    if (overlay && getComputedStyle(overlay).pointerEvents !== 'none') {
      // Only make the overlay pass-through; don’t hide it.
      overlay.style.pointerEvents = 'none'; changed = true;
    }
    if (changed) {
      console.log('[fix] Unmasked stale UI blocks; the button should now accept clicks if backend agrees.');
      btnSnap('post-fix');
    } else {
      console.log('[fix] Nothing to change.');
    }
  }

  // Observe attr flips on the button
  function armAttrObserver() {
    const b = getBtn();
    if (!b) return console.log('Attr observer: no button.');
    if (S.attrMO) S.attrMO.disconnect();
    const mo = new MutationObserver(muts => {
      muts.forEach(m => {
        console.log('[ATTR]', {
          ts: nowISO(),
          name: m.attributeName,
          old: m.oldValue,
          now: b.getAttribute(m.attributeName),
          hasDisabled: b.hasAttribute('disabled'),
          classList: b.className
        });
      });
    });
    mo.observe(b, {attributes:true, attributeOldValue:true, attributeFilter:['disabled','class','aria-disabled','style']});
    S.attrMO = mo;
    console.log('Attr observer armed.');
  }

  // Fetch tracer: detect availability calls; then analyze/unmask
  function armFetchTracer() {
    if (S.fetchArmed) return;
    const keep = window.fetch;
    window.fetch = async function(...args){
      const url = String(args[0]||'');
      const isAvail = CONFIG.availabilityUrlPattern.test(url);
      if (isAvail) console.log('[FETCH ➡︎]', nowISO(), url, args[1]||{});
      const res = await keep.apply(this, args);
      if (isAvail) {
        console.log('[FETCH ⬅︎]', nowISO(), url, res.status, res.statusText);
        analyzeAndMaybeUnmask('availability-fetch');
      }
      return res;
    };
    S.fetchArmed = true;
    console.log('Fetch tracer armed.');
  }

  // Console countdown only
  function armCountdown() {
    if (!CONFIG.consoleCountdown) return;
    if (S.countdown) clearInterval(S.countdown);
    S.countdown = setInterval(() => {
      const d = new Date();
      const target = new Date(d); target.setHours(CONFIG.releaseHourLocal, 0, 0, 0);
      const diff = target - d;
      const s = Math.round(diff/1000);
      if (s >= -CONFIG.countdownUntilSec) {
        const t = s >= 0 ? `T-${s}s` : `T+${Math.abs(s)}s`;
        if (s % 5 === 0) console.log(`[countdown] ${t}  (${nowISO()})`);
        if (s % 1 === 0 && s <= 5 && s >= -2) btnSnap('tick'); // frequent near the flip
        if (s === 0) stackAtButton();
      } else {
        clearInterval(S.countdown);
      }
    }, 1000);
    console.log('Console countdown armed.');
  }

  // Public helpers
  window._snap = () => btnSnap('manual');
  window._stack = () => stackAtButton();
  window._unmask = () => analyzeAndMaybeUnmask('manual');

  // One-shot arming
  window._arm = () => {
    btnSnap('pre');
    armAttrObserver();
    armFetchTracer();
    armCountdown();
    console.log('Ready. I will auto-inspect after any availability request.');
  };

  // Arm immediately
  window._arm();
})();