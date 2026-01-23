/*************************************************************************
  ✅ CA Parks — Always-visible countdown + single human-like click
  - Shows countdown immediately (updates every 200ms)
  - Switches to high-precision loop + beeps only in last 5s
  - Safe single click at T=0 (+ manual ms adjust) on #checkout-button
*************************************************************************/
(() => {
  /* ===== CONFIG ===== */
  const TARGET_H=8, TARGET_M=0, TARGET_S=0, TARGET_MS=0; // change if needed
  const BUTTON_SEL = '#checkout-button';
  const DRY_RUN = false;    // true = no click, only logs/highlight
  const BEEP = true;        // beeps only in the final 5 seconds

  // ✅ NEW: manual click timing adjustment (ms)
  // negative = earlier, positive = later
  const CLICK_ADJUST_MS = -500; // try -80, -100, -120, etc.
  /* ================== */

  // Overlay (top-right)
  const css = `
    #rcx{position:fixed;top:16px;right:16px;z-index:2147483647;
      background:rgba(6,78,59,.92);color:#fff;padding:10px 14px;border-radius:12px;
      box-shadow:0 8px 18px rgba(0,0,0,.25);font:700 18px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
      pointer-events:none}
    #rcx b{font-size:22px} #rcx small{opacity:.9;font-weight:600}
    #rcx mark{background:#fff;color:#064e3b;padding:0 .3rem;border-radius:6px}
    .rcx-hl{outline:3px solid #0ea5e9 !important;scroll-margin:80px}
  `;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
  const box=document.createElement('div'); box.id='rcx';
  box.innerHTML=`<div><b id="rcx_t">--:--.––</b> <small id="rcx_s">syncing…</small></div>
                 <div><small>Target: <mark id="rcx_target">--:--:--</mark></small></div>
                 <div><small>Fire@ (adj): <mark id="rcx_fire">--:--:--</mark></small></div>`;
  document.body.appendChild(box);
  const $ = id => document.getElementById(id);

  // Time helpers
  function buildTarget(baseNow){
    const t=new Date(baseNow); t.setHours(TARGET_H,TARGET_M,TARGET_S,TARGET_MS);
    if (t.getTime()<=baseNow) t.setDate(t.getDate()+1);
    return t;
  }
  async function getNowOffsetMs(){
    try{
      const t0=performance.now();
      const r=await fetch('https://worldtimeapi.org/api/ip',{cache:'no-store'});
      const t1=performance.now(); const j=await r.json();
      const apiMs=(j.unixtime*1000)+(j.millisecond??0);
      const localAtRecv=Date.now()-(performance.now()-((t0+t1)/2));
      const off=apiMs-localAtRecv;
      $('rcx_s').textContent=`synced (±~${Math.round((t1-t0)/2)}ms)`;
      return off;
    }catch{ $('rcx_s').textContent='local clock'; return 0; }
  }

  // Button helpers
  function btn(){ return document.querySelector(BUTTON_SEL); }
  function highlight(el){ if(!el) return; el.classList.add('rcx-hl'); el.scrollIntoView({behavior:'smooth',block:'center'}); }

  // Safe single click (minimal synthetic; you provide real hover/jitter)
  function safeClick(){
    const b=btn();
    if(!b){ console.log('[rcx] No button to click'); return; }
    if (DRY_RUN){ console.log('[rcx] DRY RUN: would click', b); return; }
    console.log('[rcx] CLICK');
    b.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
    if (typeof b.click === 'function') b.click();
  }

  // Optional beep
  let beep=()=>{}; if (BEEP) try{
    const ac=new (window.AudioContext||window.webkitAudioContext)();
    beep=(f=880,d=90,g=.16)=>{ const o=ac.createOscillator(),G=ac.createGain(); o.type='square'; o.frequency.value=f; G.gain.value=g; o.connect(G); G.connect(ac.destination); o.start(); setTimeout(()=>o.stop(),d); };
  }catch{}

  (async () => {
    const offset=await getNowOffsetMs();

    // "Real" target (8:00:00.000)
    const target=buildTarget(Date.now()+offset);

    // ✅ NEW: "fireAt" target (adjusted click moment)
    const fireAt = new Date(target.getTime() + CLICK_ADJUST_MS);

    $('rcx_target').textContent=target.toLocaleTimeString();
    $('rcx_fire').textContent=fireAt.toLocaleTimeString() + (CLICK_ADJUST_MS ? ` (${CLICK_ADJUST_MS}ms)` : '');

    // Arm/highlight when button appears
    const arm=setInterval(()=>{ const b=btn(); if(b){ highlight(b); $('rcx_s').textContent += ' | button armed'; clearInterval(arm); } }, 200);

    // ALWAYS-ON countdown (every 200ms) — counts down to adjusted fire time
    let baseTimer = setInterval(() => {
      const now=Date.now()+offset; const diff=fireAt-now;
      const mm=Math.max(0, Math.floor(diff/60000));
      const ss=Math.max(0, Math.floor((diff%60000)/1000));
      const cs=Math.max(0, Math.floor((diff%1000)/10));
      $('rcx_t').textContent = `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
    }, 200);

    // Upgrade to high-precision loop in final 5s (with beeps), then click at T=0 (adjusted)
    const preDelay=Math.max(0, fireAt-(Date.now()+offset)-5000);
    setTimeout(()=> {
      clearInterval(baseTimer);
      (function tick(){
        const now=Date.now()+offset; const diff=fireAt-now;
        if (diff<=0){ $('rcx_t').textContent='00:00.00'; $('rcx_s').textContent='GO'; safeClick(); return; }
        const mm=Math.floor(diff/60000), ss=Math.floor((diff%60000)/1000), cs=Math.floor((diff%1000)/10);
        $('rcx_t').textContent=`${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
        if (mm===0 && ss<=5) beep(880,80,.2);
        requestAnimationFrame(tick);
      })();
    }, preDelay);
  })();
})();