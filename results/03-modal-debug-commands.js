/*************************************************************************
 * MODAL DEBUG COMMANDS
 * 
 * Paste these into Chrome DevTools console to inspect modal structure
 * and test selector effectiveness
 *************************************************************************/

// ===== 1. Check if modal is visible and get basic info =====
console.log('=== MODAL VISIBILITY CHECK ===');
console.log('Body classes:', document.body.className);
console.log('Body has modal-open?', document.body.classList.contains('modal-open'));
console.log('');

// ===== 2. Find the specific alert message element =====
console.log('=== ALERT MESSAGE ELEMENT (#alertModalMessage) ===');
const alertMsg = document.getElementById('alertModalMessage');
if (alertMsg) {
  console.log('✅ Found #alertModalMessage');
  console.log('Text:', alertMsg.textContent);
  console.log('Visible (offsetParent):', alertMsg.offsetParent !== null);
  console.log('Full element:', alertMsg);
} else {
  console.log('❌ #alertModalMessage not found');
}
console.log('');

// ===== 3. Find all modal-related elements =====
console.log('=== ALL MODAL ELEMENTS ===');
const modalSelectors = [
  '#alertModal',
  '#alertModalMessage',
  '.modal',
  '.modal-dialog',
  '.modal-content',
  '.modal-body',
  '.modal-header',
  '.modal-footer',
  '[role="dialog"]',
  '[class*="modal"]'
];

modalSelectors.forEach(sel => {
  const els = document.querySelectorAll(sel);
  if (els.length > 0) {
    console.log(`${sel}: ${els.length} found`);
    els.forEach((el, i) => {
      console.log(`  [${i}] visible:${el.offsetParent !== null}, text:`, el.textContent?.slice(0, 80));
    });
  }
});
console.log('');

// ===== 4. Test the getModalText() logic =====
console.log('=== TESTING getModalText() LOGIC ===');

function clampText(s, n = 200) {
  return (s || '').replace(/\s+/g, ' ').trim().slice(0, n);
}

function getModalText_v1() {
  try {
    // First try the specific alert message element (most reliable)
    const alertMsg = document.getElementById('alertModalMessage');
    if (alertMsg && alertMsg.textContent) {
      const t = clampText(alertMsg.textContent, 240);
      if (t) return { method: '#alertModalMessage', text: t };
    }

    // Fallback: Prioritize modal-body over full modal
    const bodySelectors = '.modal-body, [class*="modal"] .body, [role="dialog"] p';
    const modalSelectors = '[role="dialog"], .modal-dialog, .modal-content, .modal';
    
    let candidates = [...document.querySelectorAll(bodySelectors)];
    if (candidates.length === 0) {
      candidates = [...document.querySelectorAll(modalSelectors)];
    }
    
    const modals = candidates.filter((el) => {
      if (!el) return false;
      if (el.offsetParent !== null) return true;
      if (document.body.classList.contains('modal-open')) return true;
      return false;
    });

    for (const m of modals) {
      const t = clampText(m.textContent, 240);
      if (t && t.length > 20) return { method: 'fallback selector', text: t };
    }
  } catch {}
  return null;
}

const result = getModalText_v1();
if (result) {
  console.log('✅ Modal text captured via:', result.method);
  console.log('Text:', result.text);
} else {
  console.log('❌ No modal text captured');
}
console.log('');

// ===== 5. Full modal DOM structure =====
console.log('=== FULL MODAL DOM STRUCTURE ===');
const alertModal = document.getElementById('alertModal');
if (alertModal) {
  console.log('Modal HTML:');
  console.log(alertModal.outerHTML.slice(0, 500));
  console.log('...');
} else {
  console.log('❌ #alertModal not found');
}
console.log('');

// ===== 6. Copy all data to clipboard (formatted JSON) =====
console.log('=== COPY DATA TO CLIPBOARD ===');
const debugData = {
  bodyClasses: document.body.className,
  modalOpen: document.body.classList.contains('modal-open'),
  alertMessageElement: alertMsg ? {
    exists: true,
    visible: alertMsg.offsetParent !== null,
    text: alertMsg.textContent
  } : { exists: false },
  allModals: [...document.querySelectorAll('[role="dialog"], .modal, #alertModal')].map((el, i) => ({
    index: i,
    tagName: el.tagName,
    id: el.id,
    className: el.className,
    visible: el.offsetParent !== null,
    text: el.textContent?.slice(0, 120)
  })),
  getModalTextResult: result,
  timestamp: new Date().toISOString()
};

copy(JSON.stringify(debugData, null, 2));
console.log('✅ Debug data copied to clipboard - paste into a file');
