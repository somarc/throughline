const VIDEO_PATTERN = /\.(mp4|webm|ogg)(?:[?#].*)?$/i;
const VOICES = new Set(['hill', 'stoic', 'michael', 'literary']);

function removeMediaLink(link) {
  const paragraph = link.closest('p');
  if (
    paragraph
    && paragraph.querySelectorAll('a').length === 1
    && paragraph.textContent.trim() === link.textContent.trim()
  ) {
    paragraph.remove();
  } else {
    link.remove();
  }
}

function cleanEmptyRows(block) {
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('img, picture, video')) row.remove();
  });
}

function activateVideo(block, video, src) {
  video.src = src;
  video.autoplay = true;
  video.addEventListener('canplay', () => {
    video.play().catch(() => block.classList.add('video-paused'));
    block.classList.add('video-ready');
  }, { once: true });
  video.addEventListener('error', () => block.classList.add('video-error'));
}

function createMotionToggle(block, video) {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'tapestry-hero-motion-toggle';
  toggle.dataset.state = 'playing';
  toggle.setAttribute('aria-label', 'Pause background motion');
  toggle.addEventListener('click', () => {
    if (video.paused) {
      video.play().catch(() => {});
      block.classList.remove('video-paused');
      toggle.dataset.state = 'playing';
      toggle.setAttribute('aria-label', 'Pause background motion');
    } else {
      video.pause();
      block.classList.add('video-paused');
      toggle.dataset.state = 'paused';
      toggle.setAttribute('aria-label', 'Play background motion');
    }
  });
  return toggle;
}

function extractMedia(block) {
  const videoLink = [...block.querySelectorAll('a[href]')]
    .find((link) => VIDEO_PATTERN.test(link.href));
  const picture = block.querySelector('picture');
  const standaloneImage = picture ? null : block.querySelector('img');
  const posterNode = picture || standaloneImage;
  if (!posterNode && !videoLink) return { media: null, description: '', motionToggle: null };

  const media = document.createElement('div');
  media.className = 'tapestry-hero-media';
  media.setAttribute('aria-hidden', 'true');

  const posterImage = picture?.querySelector('img') || standaloneImage;
  const description = posterImage?.alt?.trim() || '';
  if (posterNode) {
    const poster = document.createElement('div');
    poster.className = 'tapestry-hero-poster';
    if (posterImage) {
      posterImage.alt = '';
      posterImage.loading = 'eager';
      posterImage.decoding = 'async';
      posterImage.setAttribute('fetchpriority', 'high');
    }
    poster.append(posterNode);
    media.append(poster);
    block.classList.add('has-poster');
  }

  let motionToggle = null;
  if (videoLink) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = Boolean(navigator.connection?.saveData);
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'none';
    video.tabIndex = -1;
    video.setAttribute('aria-hidden', 'true');
    if (posterImage?.currentSrc || posterImage?.src) {
      video.poster = posterImage.currentSrc || posterImage.src;
    }
    if (!reducedMotion && !saveData) {
      // Defer the loop fetch until the page (and the LCP poster) has settled.
      const start = () => activateVideo(block, video, videoLink.href);
      if (document.readyState === 'complete') {
        window.requestAnimationFrame(start);
      } else {
        window.addEventListener('load', start, { once: true });
      }
      block.classList.add('has-video');
      motionToggle = createMotionToggle(block, video);
    } else {
      block.classList.add('video-suppressed');
    }
    media.append(video);
    removeMediaLink(videoLink);
  }

  block.classList.add('has-media');
  cleanEmptyRows(block);
  return { media, description, motionToggle };
}

function extractVoices(block) {
  const voices = [];
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const label = cells[0].textContent.trim().toLowerCase().replace(/[^a-z ]/g, '');
    if (VOICES.has(label)) {
      voices.push({ label, cell: cells[1] });
      row.remove();
    }
  });
  return voices;
}

function createVoices(voices) {
  if (!voices.length) return null;
  const details = document.createElement('details');
  details.className = 'tapestry-hero-voices';

  const summary = document.createElement('summary');
  summary.innerHTML = '<span>Read across the voices</span><span aria-hidden="true">＋</span>';
  details.append(summary);

  const grid = document.createElement('div');
  grid.className = 'tapestry-hero-voice-grid';
  voices.forEach(({ label, cell }) => {
    const voice = document.createElement('div');
    voice.className = `tapestry-hero-voice voice-${label}`;
    const name = document.createElement('p');
    name.className = 'tapestry-hero-voice-label';
    name.textContent = label === 'michael' ? 'Michael / Scripture' : label;
    voice.append(name);
    while (cell.firstChild) voice.append(cell.firstChild);
    grid.append(voice);
  });
  details.append(grid);
  return details;
}

function moveRow(row, destination) {
  if (!row) return;
  [...row.children].forEach((cell) => {
    while (cell.firstChild) destination.append(cell.firstChild);
  });
}

function rowText(row, fallback = '') {
  return row?.textContent.trim() || fallback;
}

function createTitle(row) {
  const authored = row?.querySelector('h1, h2, h3, h4, h5, h6');
  if (authored?.tagName === 'H1') return authored;
  const title = document.createElement('h1');
  if (authored) {
    while (authored.firstChild) title.append(authored.firstChild);
  } else {
    title.textContent = rowText(row, 'See the pattern. Break the chain.');
  }
  return title;
}

/**
 * Decorates the opening tapestry stage and Panel 01.
 * @param {HTMLElement} block authored tapestry hero block
 */
export default function decorate(block) {
  const { media, description, motionToggle } = extractMedia(block);
  const voices = extractVoices(block);
  const rows = [...block.children].filter((row) => row.textContent.trim());

  const content = document.createElement('div');
  content.className = 'tapestry-hero-content';

  const brand = document.createElement('p');
  brand.className = 'tapestry-hero-brand';
  brand.textContent = rowText(rows[0], 'Throughline · Outwitting the Devil');

  const chapter = document.createElement('p');
  chapter.className = 'tapestry-hero-chapter';
  chapter.textContent = rowText(rows[1], 'Panel 01 · The Drift');

  const title = createTitle(rows[2]);
  title.className = 'tapestry-hero-title';
  title.id = 'tapestry-title';

  const deck = document.createElement('div');
  deck.className = 'tapestry-hero-deck';
  moveRow(rows[3], deck);

  const insight = document.createElement('div');
  insight.className = 'tapestry-hero-insight';
  moveRow(rows[4], insight);
  insight.querySelectorAll('p > blockquote:only-child').forEach((quote) => {
    quote.parentElement.replaceWith(quote);
  });

  const actions = document.createElement('div');
  actions.className = 'tapestry-hero-actions';
  moveRow(rows[5], actions);

  const voicesDetails = createVoices(voices);
  content.append(
    brand,
    chapter,
    title,
    deck,
    insight,
    ...(voicesDetails ? [voicesDetails] : []),
    actions,
  );

  if (description) {
    const artDescription = document.createElement('p');
    artDescription.className = 'visually-hidden';
    artDescription.textContent = `Artwork: ${description}`;
    content.append(artDescription);
  }

  const continuation = document.createElement('a');
  continuation.className = 'tapestry-hero-continuation';
  continuation.href = '#the-chains-of-fear';
  continuation.innerHTML = '<span>Follow the thread</span><span aria-hidden="true">↓</span>';

  block.id = 'the-drift';
  block.dataset.panel = '1';
  block.setAttribute('role', 'region');
  block.setAttribute('aria-labelledby', title.id);
  block.replaceChildren(
    ...(media ? [media] : []),
    content,
    continuation,
    ...(motionToggle ? [motionToggle] : []),
  );
  window.requestAnimationFrame(() => block.classList.add('is-ready'));
}
