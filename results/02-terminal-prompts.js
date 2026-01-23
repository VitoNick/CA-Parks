// To sync system time on macOS, run in Terminal:
sntp: -sS TimeRanges.apple.com


// Before refreshing to see data logged:

// Prints to terminal
console.log(JSON.stringify(window.__rcxAttempts.at(-1), null, 2));

// Copies to clipboard
copy(JSON.stringify(window.__rcxAttempts.at(-1), null, 2));

// Full fetch log to terminal
(async () => {
  const r = await fetch(`${location.origin}/favicon.ico?rcx=${Date.now()}`, { cache: "no-store", credentials: "same-origin" });
  console.log("status", r.status, "date", r.headers.get("date"));
})();


// ============================================================
// Network hooking attempt log to terminal
// ============================================================


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