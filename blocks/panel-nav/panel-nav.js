function setCurrent(links, current) {
  links.forEach((link) => {
    if (link === current) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
}

/**
 * Draws the golden thread through the chapter rail as the reader descends.
 * Purely scroll-derived paint (no scroll-jacking); rendered fully drawn
 * when the reader prefers reduced motion.
 * @param {HTMLElement} nav the rail nav element
 * @param {HTMLAnchorElement[]} links chapter links in order
 */
function setupThread(nav, links) {
  const thread = document.createElement('div');
  thread.className = 'panel-nav-thread';
  thread.setAttribute('aria-hidden', 'true');
  const fill = document.createElement('div');
  fill.className = 'panel-nav-thread-fill';
  thread.append(fill);
  nav.prepend(thread);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    nav.style.setProperty('--thread-progress', '1');
    return;
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const first = document.querySelector(links[0].hash);
    const last = document.querySelector(links[links.length - 1].hash);
    if (!first || !last) return;
    const start = first.getBoundingClientRect().top + window.scrollY;
    const end = last.getBoundingClientRect().top + window.scrollY
      + last.offsetHeight - window.innerHeight;
    const progress = end > start
      ? Math.min(1, Math.max(0, (window.scrollY - start) / (end - start)))
      : 1;
    nav.style.setProperty('--thread-progress', progress.toFixed(4));
  };
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  update();
}

/**
 * Decorates the authored 01–07 chapter rail.
 * @param {HTMLElement} block authored panel nav block
 */
export default function decorate(block) {
  const authoredLinks = [...block.querySelectorAll('a[href^="#"]')];
  const nav = document.createElement('nav');
  nav.className = 'panel-nav-rail';
  nav.setAttribute('aria-label', 'Tapestry chapters');

  const list = document.createElement('ol');
  const links = authoredLinks.map((authored, index) => {
    const link = authored.cloneNode(true);
    const label = link.textContent.trim().replace(/^0?\d+[.\s·—-]*/, '');
    const number = document.createElement('span');
    number.className = 'panel-nav-number';
    number.textContent = String(index + 1).padStart(2, '0');
    const name = document.createElement('span');
    name.className = 'panel-nav-name';
    name.textContent = label;
    link.replaceChildren(number, name);
    const item = document.createElement('li');
    item.append(link);
    list.append(item);
    return link;
  });

  nav.append(list);
  block.replaceChildren(nav);
  if (!links.length) return;

  setupThread(nav, links);

  const hashLink = links.find((link) => link.hash === window.location.hash);
  setCurrent(links, hashLink || links[0]);

  links.forEach((link) => {
    link.addEventListener('click', () => setCurrent(links, link));
  });

  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const current = links.find((link) => link.hash === `#${visible.target.id}`);
    if (current) setCurrent(links, current);
  }, {
    rootMargin: '-32% 0px -58% 0px',
    threshold: [0, 0.15, 0.4, 0.7],
  });
  const observed = new Set();
  const bindTargets = () => {
    links.forEach((link) => {
      const target = document.querySelector(link.hash);
      if (target && !observed.has(target)) {
        observed.add(target);
        observer.observe(target);
      }
    });
  };
  bindTargets();

  const main = document.querySelector('main');
  if (main && observed.size < links.length && 'MutationObserver' in window) {
    const mutationObserver = new MutationObserver(() => {
      bindTargets();
      if (observed.size === links.length) mutationObserver.disconnect();
    });
    mutationObserver.observe(main, { attributes: true, childList: true, subtree: true });
    window.setTimeout(() => mutationObserver.disconnect(), 15000);
  }
}
