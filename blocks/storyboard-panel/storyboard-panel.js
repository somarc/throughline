const VOICES = new Set(['hill', 'stoic', 'michael', 'literary']);

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function moveChildren(source, destination) {
  if (!source) return;
  while (source.firstChild) destination.append(source.firstChild);
}

function cellsFor(row) {
  const cells = [...row.children];
  return cells.length ? cells : [row];
}

function extractLabeledRows(rows) {
  const voices = [];
  let reflection = null;
  rows.forEach((row) => {
    const cells = cellsFor(row);
    if (cells.length < 2) return;
    const label = cells[0].textContent.trim().toLowerCase().replace(/[^a-z ]/g, '');
    if (VOICES.has(label)) {
      const [, cell] = cells;
      voices.push({ label, cell });
      row.dataset.consumed = 'true';
    } else if (label === 'sit with this' || label === 'reflection') {
      [, reflection] = cells;
      row.dataset.consumed = 'true';
    }
  });
  return { voices, reflection };
}

function createVoices(voices) {
  if (!voices.length) return null;
  const details = document.createElement('details');
  details.className = 'storyboard-panel-voices';

  const summary = document.createElement('summary');
  summary.innerHTML = '<span>Read across the voices</span><span aria-hidden="true">＋</span>';
  details.append(summary);

  const grid = document.createElement('div');
  grid.className = 'storyboard-panel-voice-grid';
  voices.forEach(({ label, cell }) => {
    const article = document.createElement('article');
    article.className = `storyboard-panel-voice voice-${label}`;
    const heading = document.createElement('h3');
    heading.textContent = label === 'michael' ? 'Michael / Scripture' : label;
    moveChildren(cell, article);
    article.prepend(heading);
    grid.append(article);
  });
  details.append(grid);
  return details;
}

/**
 * Decorates one authored tapestry plate.
 * @param {HTMLElement} block authored storyboard panel block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const mediaRow = rows.find((row) => row.querySelector('picture, img'));
  const picture = mediaRow?.querySelector('picture');
  const standaloneImage = picture ? null : mediaRow?.querySelector('img');
  const mediaNode = picture || standaloneImage;
  const image = picture?.querySelector('img') || standaloneImage;

  const contentRow = rows.find((row) => row.querySelector('h2, h3'));
  const heading = contentRow?.querySelector('h2, h3') || document.createElement('h2');
  if (!heading.textContent.trim()) heading.textContent = 'Untitled panel';
  if (heading.tagName !== 'H2') {
    const h2 = document.createElement('h2');
    moveChildren(heading, h2);
    heading.replaceWith(h2);
  }
  const title = contentRow?.querySelector('h2') || heading;
  const panelId = slugify(title.textContent);
  title.id = `${panelId}-title`;

  const kicker = contentRow?.querySelector('p');
  const numberMatch = kicker?.textContent.match(/(?:panel\s*)?0?([1-9])/i);
  const panelNumber = Number(numberMatch?.[1] || block.dataset.panel || 2);
  if (kicker) kicker.classList.add('storyboard-panel-kicker');

  const { voices, reflection } = extractLabeledRows(rows);

  const stage = document.createElement('article');
  stage.className = 'storyboard-panel-stage';

  const media = document.createElement('figure');
  media.className = 'storyboard-panel-media';
  if (image) {
    image.loading = 'lazy';
    image.decoding = 'async';
  }
  if (mediaNode) media.append(mediaNode);

  const copy = document.createElement('div');
  copy.className = 'storyboard-panel-copy';
  if (contentRow) {
    cellsFor(contentRow).forEach((cell) => moveChildren(cell, copy));
  } else {
    copy.append(title);
  }

  const voicesDetails = createVoices(voices);
  if (voicesDetails) copy.append(voicesDetails);

  if (reflection) {
    const prompt = document.createElement('aside');
    prompt.className = 'storyboard-panel-reflection';
    const label = document.createElement('p');
    label.textContent = 'Sit with this';
    moveChildren(reflection, prompt);
    prompt.prepend(label);
    copy.append(prompt);
  }

  const marker = document.createElement('p');
  marker.className = 'storyboard-panel-marker';
  marker.textContent = String(panelNumber).padStart(2, '0');
  marker.setAttribute('aria-hidden', 'true');

  stage.append(media, copy, marker);
  block.id = panelId;
  block.dataset.panel = String(panelNumber);
  block.classList.add(`panel-${panelNumber}`, panelNumber % 2 ? 'panel-odd' : 'panel-even');
  block.setAttribute('role', 'region');
  block.setAttribute('aria-labelledby', title.id);
  block.replaceChildren(stage);
}
