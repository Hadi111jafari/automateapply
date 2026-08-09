function toast(message, type = 'ok', duration = 3500) {
  const stack = document.getElementById('toastStack');
  if (!stack) return;
  const t = document.createElement('div');
  t.className = 'toast';
  const icon = type === 'ok'
    ? '<svg class="ti ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>'
    : type === 'brand'
    ? '<svg class="ti brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
    : '<svg class="ti" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
  t.innerHTML = `${icon}<span>${message}</span>`;
  stack.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity 0.3s, transform 0.3s';
    t.style.opacity = '0';
    t.style.transform = 'translateY(8px)';
    setTimeout(() => t.remove(), 300);
  }, duration);
}

document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  if (!q) return;
  q.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    item.parentElement.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

document.querySelectorAll('.tabs').forEach(tabs => {
  tabs.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
      tabs.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      t.classList.add('active');
    });
  });
});

document.querySelectorAll('.filterbar').forEach(bar => {
  bar.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const isInGroup = chip.parentElement.querySelectorAll('.chip').length > 1;
      if (isInGroup) {
        chip.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      } else {
        chip.classList.toggle('active');
      }
    });
  });
});

document.querySelectorAll('.toggle').forEach(t => {
  t.addEventListener('click', () => t.classList.toggle('on'));
});

function quickApply(company, role) {
  toast(`Tailoring resume for ${company} · ${role}…`, 'brand');
  setTimeout(() => toast(`Applied to ${company} · ${role}`, 'ok'), 1600);
}

function toggleAuto() {
  const dot = document.getElementById('autoToggleDot');
  if (!dot) return;
  dot.classList.toggle('on');
  const on = dot.classList.contains('on');
  toast(on ? 'Auto-apply enabled · runs 3-6 AM' : 'Auto-apply paused', on ? 'ok' : 'brand');
}

function startSearch() {
  const m = document.getElementById('newSearchModal');
  if (m) m.classList.remove('open');
  toast('New search launched · Amber is finding roles…', 'brand');
  setTimeout(() => toast('47 high-match jobs discovered', 'ok'), 1800);
}

if (window.location.pathname.includes('dashboard')) {
  setTimeout(() => toast('Stripe replied to your application', 'ok', 5000), 800);
}
if (window.location.pathname.includes('interview')) {
  setTimeout(() => toast('Prep materials ready for tomorrow 10 AM', 'ok', 5000), 800);
}