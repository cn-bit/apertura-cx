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

/* Accordions. A list marked data-acc becomes a single-item accordion at or below the width given
   (data-acc="0" means always). Above that width every panel shows and each row reads as a plain heading. */
document.querySelectorAll('[data-acc]').forEach(group => {
  const bp = +group.dataset.acc || 0;
  const mq = bp ? matchMedia(`(max-width: ${bp}px)`) : null;
  const items = [...group.children].filter(el => el.hasAttribute('data-acc-item'));
  const active = () => !mq || mq.matches;
  const btnOf = it => it.querySelector('[data-acc-btn]');
  function set(it, open) {
    it.classList.toggle('is-open', open);
    if (active()) btnOf(it).setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function apply() {
    const on = active();
    group.classList.toggle('acc-on', on);
    items.forEach(it => btnOf(it).setAttribute('aria-expanded', on && it.classList.contains('is-open') ? 'true' : 'false'));
  }
  items.forEach(it => btnOf(it).addEventListener('click', () => {
    if (!active()) return;
    const open = !it.classList.contains('is-open');
    items.forEach(o => set(o, false));
    set(it, open);
  }));
  apply();
  if (mq) mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply);
});

/* Disclosures that sit open on wider screens and fold away below the width given. */
document.querySelectorAll('details[data-open-above]').forEach(d => {
  const mq = matchMedia(`(min-width: ${d.dataset.openAbove}px)`);
  const set = () => { d.open = mq.matches; };
  set();
  mq.addEventListener ? mq.addEventListener('change', set) : mq.addListener(set);
});
