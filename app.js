// =====================
// CONSTANTS
// =====================
const CAPACITY_AH = 100;
const VOLTAGE     = 12.8;
const DOD         = 20;

// =====================
// STATE
// =====================
let batteryPct = 23;
let watts      = 32;

// =====================
// HELPERS
// =====================
function batColor(p) {
  if (p < 20) return '#ef4444';
  if (p < 40) return '#f59e0b';
  return '#22c55e';
}

function getHoursUntil8AM() {
  const now    = new Date();
  const target = new Date();
  target.setHours(8, 0, 0, 0);
  if (now.getHours() >= 8) target.setDate(target.getDate() + 1);
  return (target - now) / 3600000;
}

function formatTime(date) {
  if (!date) return '—';
  const isToday = date.getDate() === new Date().getDate();
  const t = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  return isToday ? t : t + ' (tmrw)';
}

function formatHM(h) {
  if (!h || h <= 0) return '—';
  return `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`;
}

function el(id) {
  return document.getElementById(id);
}

// =====================
// MAIN UPDATE
// =====================
function update() {
  const color = batColor(batteryPct);
  document.documentElement.style.setProperty('--bat-color', color);

  // Battery gauge
  el('gauge-pct').textContent    = batteryPct;
  el('gauge-pct').style.color    = color;
  el('gauge-ah').textContent     = ((batteryPct / 100) * CAPACITY_AH).toFixed(1) + 'AH';
  el('gauge-ring').style.borderColor  = color + '44';
  el('gauge-inner').style.borderColor = color;
  el('bat-bar').style.width      = batteryPct + '%';
  el('bat-bar').style.background = color;
  el('bat-pct-label').textContent = batteryPct + '%';
  el('bat-pct-label').style.color = color;

  // Watts
  el('watts-display').textContent = watts + 'W';
  el('watts-bar').style.width     = (watts / 500 * 100) + '%';

  // Discharge rate & time to 8AM
  const rateAH = watts / VOLTAGE;
  el('discharge-rate').textContent = rateAH.toFixed(2) + ' A/h';

  const hours8am = getHoursUntil8AM();
  el('time-to-8am').textContent = formatHM(hours8am);

  // Remaining at 8AM
  const currentAH  = (batteryPct / 100) * CAPACITY_AH;
  const drained     = rateAH * hours8am;
  const remainAH    = Math.max(0, currentAH - drained);
  const remainPct   = (remainAH / CAPACITY_AH) * 100;
  const isCritical  = remainPct < DOD;
  const rColor      = isCritical ? '#ef4444' : '#22c55e';

  el('result-pct').innerHTML      = remainPct.toFixed(1) + '<span>%</span>';
  el('result-pct').style.color    = rColor;
  el('result-card').style.borderColor  = rColor;
  el('result-card').style.background   = isCritical
    ? 'rgba(239,68,68,0.12)'
    : 'rgba(34,197,94,0.10)';
  el('result-card').style.boxShadow    = isCritical
    ? '0 0 20px rgba(239,68,68,0.2)'
    : '0 0 20px rgba(34,197,94,0.12)';

  const badge = el('result-badge');
  badge.style.color  = rColor;
  badge.textContent  = isCritical
    ? '⚠ WARNING — BELOW DOD THRESHOLD'
    : '✓ SAFE — ABOVE DOD THRESHOLD';

  el('result-bar').style.width      = Math.min(remainPct, 100) + '%';
  el('result-bar').style.background = rColor;

  const msg = el('result-msg');
  msg.style.color   = rColor;
  msg.textContent   = isCritical
    ? `${Math.abs(remainPct - 20).toFixed(1)}% below safe DOD limit!`
    : `${(remainPct - 20).toFixed(1)}% above 20% DOD`;

  // Depletion forecast
  let hoursTo0 = null;
  let timeTo0  = null;
  if (watts > 0 && currentAH > 0) {
    hoursTo0 = currentAH / rateAH;
    timeTo0  = new Date(Date.now() + hoursTo0 * 3600000);
  }
  el('zero-time').textContent      = formatTime(timeTo0);
  el('hours-remaining').textContent = formatHM(hoursTo0);
}

// =====================
// CLOCK
// =====================
function updateClock() {
  el('clock').textContent = new Date().toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

// =====================
// EVENT LISTENERS
// =====================
el('slider-battery').addEventListener('input', e => {
  batteryPct = Number(e.target.value);
  update();
});

el('slider-watts').addEventListener('input', e => {
  watts = Number(e.target.value);
  update();
});

// =====================
// INIT
// =====================
updateClock();
update();
setInterval(updateClock, 1000);
setInterval(update, 30000);