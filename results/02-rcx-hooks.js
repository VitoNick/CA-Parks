
// before clicking to attempt a booking, run this to hook XHR and capture responses for booking endpoints:
(() => {
  window.__rcxWire ||= { events: [] };

  const WANT = /restractionsforbooking|restractionandlockforbooking|precartdataforbookingmodify/i;

  if (!window.__rcxWire._xhrHooked2) {
    window.__rcxWire._xhrHooked2 = true;

    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      this.__rcx = { method, url, t0: 0 };
      return origOpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function (...args) {
      this.__rcx.t0 = performance.now();
      this.addEventListener("loadend", () => {
        const url = this.__rcx.url || "";
        const ev = {
          kind: "xhr",
          method: this.__rcx.method,
          url,
          status: this.status,
          ms: Math.round(performance.now() - this.__rcx.t0),
          ts: new Date().toISOString(),
        };

        // Capture a tiny response preview only for the booking endpoints
        if (WANT.test(url)) {
          try {
            const txt = String(this.responseText || "");
            ev.bodyPreview = txt.slice(0, 600);
          } catch {}
        }

        window.__rcxWire.events.push(ev);
      });

      return origSend.apply(this, args);
    };
  }

  console.log("[rcx] XHR hooked w/ response previews for booking endpoints. Click, then run: copy(JSON.stringify(__rcxWire.events.slice(-20), null, 2))");
})();

// After clicking to attempt a booking, run this to copy recent XHR events with response previews for booking endpoints:
copy(JSON.stringify(__rcxWire.events.slice(-20), null, 2))