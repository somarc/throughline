function setCurrent(links, current) {
  links.forEach((link) => {
    if (link === current) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
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
