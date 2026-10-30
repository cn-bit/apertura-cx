/* Header menu. Opens like an aperture from the menu button. */
(() => {
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('menu');
  if (!btn || !menu) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let closeTimer;

  function origin() {
    const r = btn.getBoundingClientRect();
    menu.style.setProperty('--mx', (r.left + r.width / 2) + 'px');
    menu.style.setProperty('--my', (r.top + r.height / 2) + 'px');
  }
  function open() {
    clearTimeout(closeTimer);
    origin();
    menu.hidden = false;
    void menu.offsetWidth;
    menu.classList.add('open');
    document.body.classList.add('menu-open');
    btn.setAttribute('aria-expanded', 'true');
    btn.querySelector('.menu-word').textContent = 'Close';
    const first = menu.querySelector('a');
    setTimeout(() => first && first.focus({ preventScroll: true }), reduce ? 0 : 250);
  }
  function close(returnFocus = true) {
    menu.classList.remove('open');
    document.body.classList.remove('menu-open');
    btn.setAttribute('aria-expanded', 'false');
    btn.querySelector('.menu-word').textContent = 'Menu';
    closeTimer = setTimeout(() => { menu.hidden = true; }, reduce ? 0 : 750);
    if (returnFocus) btn.focus({ preventScroll: true });
  }
  btn.addEventListener('click', () => btn.getAttribute('aria-expanded') === 'true' ? close() : open());
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') close();
    if (e.key === 'Tab' && btn.getAttribute('aria-expanded') === 'true') {
      const items = [btn, ...menu.querySelectorAll('a')];
      const i = items.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
    }
  });
  menu.addEventListener('click', e => { if (e.target.closest('a')) close(false); });
})();
