// To sync system time on macOS, run in Terminal:
// sntp -sS TimeRanges.apple.com


// Full attempt data to clipboard (includes netHook, outcome, error details)
copy(JSON.stringify((window.__rcxAttempts && window.__rcxAttempts.slice(-1)[0]) || null, null, 2));
copy(JSON.stringify(window.__rcxAttempts.at(-1), null, 2));

// Reserve Unit button (note: id is misspelled on the site: "sumbit")
copy(document.getElementById('precart_sumbit_btn'));



// Before refreshing to see data logged:

// Prints to terminal
console.log(JSON.stringify(window.__rcxAttempts.at(-1), null, 2));


// ============================================================
// Jan 26 modal tests
// ============================================================

// Quick modal check (when modal is visible)
document.getElementById('alertModalMessage')?.textContent

// Modal debug to clipboard
copy(JSON.stringify({
  alertMessage: document.getElementById('alertModalMessage')?.textContent || null,
  bodyHasModalOpen: document.body.classList.contains('modal-open'),
  modalVisible: document.querySelector('#alertModal, [role="dialog"]')?.offsetParent !== null,
  allModalText: [...document.querySelectorAll('.modal-body, #alertModalMessage')].map(el => el.textContent)
}, null, 2));

// ============================================================
// End Jan 26 modal tests
// ============================================================

// Full fetch log to terminal
(async () => {
  const r = await fetch(`${location.origin}/favicon.ico?rcx=${Date.now()}`, { cache: "no-store", credentials: "same-origin" });
  console.log("status", r.status, "date", r.headers.get("date"));
})();


// ============================================================
// Network hooking attempt log to terminal
// ============================================================

// OLD STUFF ======================================
// Full fetch log to clipboard
copy(JSON.stringify({
  attempt: window.__rcxAttempts.at(-1),
  netRes: window.__rcxAttempts.at(-1)?.netRes ?? null,
  netHook: window.__rcxAttempts.at(-1)?.netHook ?? null,
}, null, 2));

// Recent navigation timing to clipboard
copy(JSON.stringify(
  performance.getEntriesByType("navigation").slice(-1)[0],
  null,
  2
));

// Recent resource timing to clipboard
copy(JSON.stringify(
  performance.getEntriesByType("resource")
    .slice(-40)
    .map(e => ({
      name: e.name.slice(0, 200),
      initiatorType: e.initiatorType,
      startMs: Math.round(e.startTime),
      durMs: Math.round(e.duration),
      transferSize: e.transferSize,
    })),
  null,
  2
));
// OLD STUFF END ======================================

// ============================================================
// Network hooking attempt log - COPY THIS ONE ONLY
// ============================================================




// ============================================================
// DEBUG: Post-test modal/network analysis (copy to JSON file)
// ============================================================

// Comprehensive debug data - copy all to JSON file
copy(JSON.stringify({
  modal: {
    visible: document.querySelector('.modal, [role="dialog"]') !== null,
    bodyClasses: document.body.className,
    modals: [...document.querySelectorAll('.modal, [role="dialog"], .modal-content, .modal-body')]
      .map((m, i) => ({ index: i, text: m.textContent.slice(0, 200) }))
  },
  url: location.href,
  netHook: window.__rcxNet.slice(-10),
  attempt: window.__rcxAttempts.at(-1)
}, null, 2));