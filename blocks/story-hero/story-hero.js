function moveChildren(source, destination) {
  if (!source) return;
  while (source.firstChild) destination.append(source.firstChild);
}

function cellsFor(row) {
  const cells = [...row.children];
  return cells.length ? cells : [row];
}

/**
 * Decorates the quieter art-led hero used on About and Sources.
 * @param {HTMLElement} block authored story hero block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const mediaRow = rows.find((row) => row.querySelector('picture, img'));
  const picture = mediaRow?.querySelector('picture');
  const standaloneImage = picture ? null : mediaRow?.querySelector('img');
  const mediaNode = picture || standaloneImage;
  const image = picture?.querySelector('img') || standaloneImage;
  if (image) {
    image.alt = '';
    image.loading = 'eager';
    image.decoding = 'async';
    image.setAttribute('fetchpriority', 'high');
  }

  const copyRow = rows.find((row) => row.querySelector('h1, h2'));
  const copy = document.createElement('div');
  copy.className = 'story-hero-copy';
  if (copyRow) cellsFor(copyRow).forEach((cell) => moveChildren(cell, copy));

  const authoredTitle = copy.querySelector('h1, h2');
  let title = authoredTitle;
  if (!title || title.tagName !== 'H1') {
    title = document.createElement('h1');
    if (authoredTitle) {
      moveChildren(authoredTitle, title);
      authoredTitle.replaceWith(title);
    } else {
      title.textContent = 'Throughline';
      copy.prepend(title);
    }
  }
  title.id = 'story-title';

  const kicker = title.previousElementSibling;
  if (kicker?.tagName === 'P') kicker.classList.add('story-hero-kicker');

  const media = document.createElement('div');
  media.className = 'story-hero-media';
  media.setAttribute('aria-hidden', 'true');
  if (mediaNode) media.append(mediaNode);

  block.setAttribute('role', 'region');
  block.setAttribute('aria-labelledby', title.id);
  block.replaceChildren(media, copy);
}
