async function syncOffset({ url, samples = 11, timeoutMs = 1200 }) {
  const results = [];

  for (let i = 0; i < samples; i++) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), timeoutMs);

      const t0p = performance.now();
      const t0 = Date.now();

      const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
      const t1p = performance.now();
      const t1 = Date.now();

      clearTimeout(to);

      // If it's JSON time API:
      // const j = await res.json();
      // const serverMs = (j.unixtime * 1000) + (j.millisecond ?? 0);

      // If it's same-origin Date header:
      const dateHeader = res.headers.get("date");
      if (!dateHeader) continue;
      const serverMs = new Date(dateHeader).getTime();

      const rtt = t1p - t0p;
      const localMid = (t0 + t1) / 2;
      const offset = serverMs - localMid;

      results.push({ offset, rtt });
      // small spacing helps avoid back-to-back queue effects
      await new Promise(r => setTimeout(r, 80 + Math.random() * 40));
    } catch {
      // ignore failed sample
    }
  }

  if (!results.length) return { offsetMs: 0, jitterMs: null, bestRttMs: null };

  results.sort((a,b) => a.rtt - b.rtt);
  const best = results[0];

  // jitter estimate: spread of offsets among best few
  const top = results.slice(0, Math.min(5, results.length)).map(x => x.offset).sort((a,b)=>a-b);
  const jitter = top.length >= 2 ? (top[top.length-1] - top[0]) : 0;

  return { offsetMs: best.offset, jitterMs: jitter, bestRttMs: best.rtt };
}