/* eslint-env node */
/* eslint-disable no-console, max-len */

const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} = require('node:fs');
const { extname, join, resolve } = require('node:path');

const STAGE = resolve('.da/media-staging');
const MANIFEST = resolve(STAGE, 'manifest.json');
const REVIEW = resolve(STAGE, 'review.html');
const LOOP_REPORT = resolve(STAGE, 'the-drift-loop.loop.json');
const PIPELINE = resolve('pipelines/grok-imagine-media.yaml');
const SANDBOX = resolve('.grok/sandbox.toml');
const MEDIA_EXTENSIONS = new Set(['.mp4', '.webm', '.webp', '.jpg', '.jpeg', '.png']);

const IMAGE_ASSETS = [
  {
    name: 'throughline-character-lock', prompt: 'media/briefs/character-lock.md', route: null, tool: 'image_gen', role: 'Character identity lock',
  },
  {
    name: 'panel-01-the-drift', prompt: 'media/briefs/panel-01-the-drift.md', route: '/media/tapestry/panel-01-the-drift.webp', tool: 'image_edit', role: 'Panel 01 · The Drift',
  },
  {
    name: 'panel-02-the-chains-of-fear', prompt: 'media/briefs/panel-02-the-chains-of-fear.md', route: '/media/tapestry/panel-02-the-chains-of-fear.webp', tool: 'image_edit', role: 'Panel 02 · The Chains of Fear',
  },
  {
    name: 'panel-03-the-awakening', prompt: 'media/briefs/panel-03-the-awakening.md', route: '/media/tapestry/panel-03-the-awakening.webp', tool: 'image_edit', role: 'Panel 03 · The Awakening',
  },
  {
    name: 'panel-04-the-guardian-appears', prompt: 'media/briefs/panel-04-the-guardian-appears.md', route: '/media/tapestry/panel-04-the-guardian-appears.webp', tool: 'image_edit', role: 'Panel 04 · The Guardian Appears',
  },
  {
    name: 'panel-05-the-battle-within', prompt: 'media/briefs/panel-05-the-battle-within.md', route: '/media/tapestry/panel-05-the-battle-within.webp', tool: 'image_edit', role: 'Panel 05 · The Battle Within',
  },
  {
    name: 'panel-06-outwitting', prompt: ['media/briefs/panel-06-outwitting.md', 'media/briefs/panel-06-outwitting-refine.md'], route: '/media/tapestry/panel-06-outwitting.webp', tool: 'image_edit', role: 'Panel 06 · Outwitting',
  },
  {
    name: 'panel-07-the-tapestry-complete', prompt: 'media/briefs/panel-07-the-tapestry-complete.md', route: '/media/tapestry/panel-07-the-tapestry-complete.webp', tool: 'image_edit', role: 'Panel 07 · The Tapestry Complete',
  },
  {
    name: 'about-origin', prompt: 'media/briefs/about-origin.md', route: '/media/tapestry/about-origin.webp', tool: 'image_gen', role: 'About · Origin plate',
  },
  {
    name: 'sources-manuscript', prompt: 'media/briefs/sources-manuscript.md', route: '/media/tapestry/sources-manuscript.webp', tool: 'image_gen', role: 'Sources · Manuscript plate',
  },
];

const VIDEO_ASSET = {
  name: 'the-drift-loop',
  prompt: 'media/briefs/the-drift-video.md',
  route: '/media/tapestry/the-drift-loop.mp4',
  tool: 'image_to_video',
  role: 'Panel 01 · atmospheric hero loop',
};

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8' }).trim();
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function relative(file) {
  return file.replace(`${process.cwd()}/`, '');
}

function readCollector(asset) {
  const path = resolve(STAGE, `${asset.name}.collector.json`);
  if (!existsSync(path)) throw new Error(`Missing collector evidence: ${relative(path)}`);
  const report = JSON.parse(readFileSync(path, 'utf8'));
  if (report.tool !== asset.tool) {
    throw new Error(`${asset.name} collector records ${report.tool}, expected ${asset.tool}`);
  }
  return {
    path: relative(path),
    sha256: sha256(path),
    sessionId: report.sessionId,
    tool: report.tool,
    toolCallId: report.toolCallId,
    transcript: report.transcript,
    receipt: report.receipt,
    sourceMedia: report.sourceMedia,
    outputSha256: report.outputSha256,
    normalizedWith: report.normalizedWith,
  };
}

function assertCleanTrackedTree() {
  const dirty = run('git', ['status', '--porcelain', '--untracked-files=no']);
  if (dirty) throw new Error(`Tracked files changed during media generation:\n${dirty}`);
}

function findMisplacedMedia(dir = process.cwd()) {
  const found = [];
  readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    if (['.git', '.da', 'node_modules'].includes(entry.name)) return;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...findMisplacedMedia(path));
    else if (MEDIA_EXTENSIONS.has(extname(entry.name).toLowerCase())) found.push(relative(path));
  });
  return found;
}

function inspectImage(asset) {
  const path = resolve(STAGE, `${asset.name}.webp`);
  if (!existsSync(path)) throw new Error(`Missing required image: ${relative(path)}`);
  const bytes = statSync(path).size;
  if (bytes < 50 * 1024) throw new Error(`${asset.name} is unexpectedly small: ${bytes} bytes`);
  if (bytes > 5 * 1024 * 1024) throw new Error(`${asset.name} exceeds 5 MiB: ${bytes} bytes`);

  const [format, widthText, heightText] = run('magick', [
    'identify', '-format', '%m %w %h', path,
  ]).split(/\s+/);
  const width = Number(widthText);
  const height = Number(heightText);
  if (format.toUpperCase() !== 'WEBP') throw new Error(`${asset.name} format is ${format}, expected WEBP`);
  if (width !== 2400 || height !== 1350) throw new Error(`${asset.name} is ${width}x${height}, expected 2400x1350`);

  const collector = readCollector(asset);
  const digest = sha256(path);
  if (collector.outputSha256 !== digest) throw new Error(`${asset.name} hash does not match collector evidence`);
  return {
    name: asset.name,
    role: asset.role,
    path: relative(path),
    route: asset.route,
    delivery: Boolean(asset.route),
    mime: 'image/webp',
    bytes,
    sha256: digest,
    width,
    height,
    aspectRatio: width / height,
    collector,
  };
}

function topLevelMp4Atoms(buffer) {
  const atoms = [];
  let offset = 0;
  while (offset + 8 <= buffer.length) {
    let size = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    let headerSize = 8;
    if (size === 1) {
      if (offset + 16 > buffer.length) throw new Error('Truncated extended MP4 atom header');
      const extendedSize = buffer.readBigUInt64BE(offset + 8);
      if (extendedSize > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('MP4 atom exceeds safe parser size');
      size = Number(extendedSize);
      headerSize = 16;
    } else if (size === 0) {
      size = buffer.length - offset;
    }
    if (size < headerSize || offset + size > buffer.length) {
      throw new Error(`Invalid MP4 atom ${type} at byte ${offset}`);
    }
    atoms.push({ type, offset, size });
    offset += size;
  }
  return atoms;
}

function inspectVideo() {
  const path = resolve(STAGE, `${VIDEO_ASSET.name}.mp4`);
  if (!existsSync(path)) return null;
  const bytes = statSync(path).size;
  if (bytes < 100 * 1024) throw new Error(`Video is unexpectedly small: ${bytes} bytes`);
  if (bytes > 25 * 1024 * 1024) throw new Error(`Video exceeds 25 MiB: ${bytes} bytes`);

  const probe = JSON.parse(run('ffprobe', [
    '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path,
  ]));
  const videoStream = probe.streams.find((stream) => stream.codec_type === 'video');
  const audioStreams = probe.streams.filter((stream) => stream.codec_type === 'audio');
  if (!videoStream) throw new Error('MP4 has no video stream');
  if (audioStreams.length) throw new Error('Hero video must not contain audio');

  const width = Number(videoStream.width);
  const height = Number(videoStream.height);
  const duration = Number(probe.format.duration);
  const ratio = width / height;
  const [rateNumerator, rateDenominator = '1'] = String(videoStream.avg_frame_rate).split('/');
  const frameRate = Number(rateNumerator) / Number(rateDenominator);
  const formatNames = String(probe.format.format_name || '').split(',');
  const atoms = topLevelMp4Atoms(readFileSync(path));
  const moovAtom = atoms.find((atom) => atom.type === 'moov');
  const mediaDataAtom = atoms.find((atom) => atom.type === 'mdat');

  if (![width, height, duration, ratio, frameRate].every(Number.isFinite)) throw new Error('Video metadata has a non-finite value');
  if (!formatNames.includes('mp4')) throw new Error(`Video container is ${probe.format.format_name}, expected mp4`);
  if (videoStream.codec_name !== 'h264') throw new Error(`Video codec is ${videoStream.codec_name}, expected h264`);
  if (videoStream.pix_fmt !== 'yuv420p') throw new Error(`Video pixel format is ${videoStream.pix_fmt}, expected yuv420p`);
  if (width < 1280 || height < 720) throw new Error(`Video is ${width}x${height}, expected at least 1280x720`);
  if (ratio < 1.76 || ratio > 1.79) throw new Error(`Video aspect ratio is ${ratio.toFixed(4)}, expected 16:9`);
  if (Math.abs(duration - 6) > 0.7) throw new Error(`Video duration is ${duration.toFixed(2)}s, expected about 6s`);
  if (frameRate < 20 || frameRate > 60) throw new Error(`Video frame rate is ${frameRate.toFixed(2)}, expected 20–60fps`);
  if (!moovAtom || !mediaDataAtom || moovAtom.offset > mediaDataAtom.offset) throw new Error('MP4 is not fast-start optimized');

  const collector = readCollector(VIDEO_ASSET);
  const digest = sha256(path);
  if (!existsSync(LOOP_REPORT)) throw new Error(`Missing loop finish evidence: ${relative(LOOP_REPORT)}`);
  const loop = JSON.parse(readFileSync(LOOP_REPORT, 'utf8'));
  if (loop.input?.sha256 !== collector.outputSha256) {
    throw new Error('Loop input hash does not match collector evidence');
  }
  if (loop.output?.sha256 !== digest) throw new Error('Loop output hash does not match final video');
  if (!Number.isFinite(loop.output?.seamSsim) || loop.output.seamSsim < 0.95) {
    throw new Error(`Loop seam SSIM ${loop.output?.seamSsim} is below 0.95`);
  }
  return {
    name: VIDEO_ASSET.name,
    role: VIDEO_ASSET.role,
    path: relative(path),
    route: VIDEO_ASSET.route,
    delivery: true,
    mime: 'video/mp4',
    bytes,
    sha256: digest,
    width,
    height,
    aspectRatio: ratio,
    durationSeconds: duration,
    codec: videoStream.codec_name,
    container: 'mp4',
    pixelFormat: videoStream.pix_fmt,
    frameRate,
    fastStart: true,
    audioStreams: 0,
    sourceQualityWarning: collector.sourceMedia?.qualityWarning || null,
    collector,
    loop: {
      path: relative(LOOP_REPORT),
      sha256: sha256(LOOP_REPORT),
      method: loop.method,
      seamSsim: loop.output.seamSsim,
    },
  };
}

function promptRecord(asset) {
  return [asset.prompt].flat().map((prompt) => {
    const path = resolve(prompt);
    return {
      asset: asset.name,
      path: relative(path),
      sha256: sha256(path),
      requiredTool: asset.tool,
    };
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function buildReview(manifest) {
  const imageCards = manifest.files.filter((file) => file.mime === 'image/webp').map((file) => `
      <figure>
        <img src="${escapeHtml(file.path.split('/').pop())}" alt="${escapeHtml(file.role)}">
        <figcaption><strong>${escapeHtml(file.role)}</strong><span>${file.width}×${file.height} · ${file.bytes.toLocaleString()} bytes</span><code>${file.sha256.slice(0, 16)}…</code></figcaption>
      </figure>`).join('');
  const video = manifest.files.find((file) => file.mime === 'video/mp4');
  const videoCard = video ? `
      <figure class="video-card">
        <video src="${escapeHtml(video.path.split('/').pop())}" poster="panel-01-the-drift.webp" muted loop playsinline controls></video>
        <figcaption><strong>${escapeHtml(video.role)}</strong><span>${video.width}×${video.height} · ${video.durationSeconds.toFixed(2)}s · silent</span><code>${video.sha256.slice(0, 16)}…</code></figcaption>
      </figure>` : '<p class="notice">Imagine video was not present. Poster-first delivery remains valid.</p>';
  const warning = video?.sourceQualityWarning ? `<p class="warning">${escapeHtml(video.sourceQualityWarning)}</p>` : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Throughline · Grok Imagine review</title>
  <style>
    :root { color-scheme: dark; font-family: ui-monospace, SFMono-Regular, monospace; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: clamp(20px, 4vw, 56px); background: #080a12; color: #eee7d8; }
    header, main { width: min(100%, 1500px); margin: auto; }
    header { margin-bottom: 42px; }
    h1 { max-width: 1000px; margin: 0 0 14px; font: 400 clamp(42px, 8vw, 106px)/.86 Georgia, serif; letter-spacing: -.055em; }
    p { max-width: 900px; color: #cfc5b1; line-height: 1.55; }
    .warning { border-left: 2px solid #d6ad62; padding-left: 16px; color: #f2d18a; }
    .notice { border: 1px solid #34465d; padding: 20px; }
    main { display: grid; gap: 26px; }
    figure { margin: 0; border: 1px solid rgb(238 231 216 / 18%); background: #0d1220; }
    img, video { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; background: #080a12; }
    figcaption { display: grid; grid-template-columns: 1fr auto; gap: 5px 16px; padding: 13px 15px; color: #cfc5b1; font-size: 11px; }
    figcaption strong { color: #f2d18a; font-weight: 500; }
    figcaption code { grid-column: 1 / -1; color: #7f8799; overflow-wrap: anywhere; }
    .video-card { grid-column: 1 / -1; }
    section { grid-column: 1 / -1; border-top: 1px solid rgb(238 231 216 / 18%); margin-top: 24px; padding-top: 30px; }
    li { margin-bottom: 8px; color: #cfc5b1; }
    @media (min-width: 900px) { main { grid-template-columns: 1fr 1fr; } }
  </style>
</head>
<body>
  <header>
    <p>Grok Imagine · Riverboat local proof</p>
    <h1>Throughline media review</h1>
    <p>Local staging only. Technical validation passed; nothing on this page implies visual approval, DA upload, preview, or publication.</p>
    ${warning}
  </header>
  <main>
    ${imageCards}
    ${videoCard}
    <section>
      <h2>Manual sign-off</h2>
      <ul>
        <li>The protagonist face, age, hair, cloak, and build remain continuous.</li>
        <li>Michael's armor, wings, shield, and sword remain continuous and restrained.</li>
        <li>Chains, storm, thread, sword, citadel, fixed star, and Devil volume follow the state machine.</li>
        <li>The palette progresses cold indigo → candle gold without losing series identity.</li>
        <li>No plate contains unwanted words, logos, watermarks, malformed hands/faces, or extra figures.</li>
        <li>Panel 01 preserves its left/lower type-safe zone; all plates survive center mobile crops.</li>
        <li>Video is calm, loop-compatible, silent, and introduces no new action or morphing identity.</li>
      </ul>
    </section>
  </main>
</body>
</html>\n`;
}

function printPlan(files) {
  const deliveryFiles = files.filter((file) => file.delivery);
  console.log('\nDA media preflight commands (dry-run; no remote mutation):');
  deliveryFiles.forEach((file) => {
    console.log(`da --org somarc --repo throughline --branch feature-throughline-tapestry --format json content put ${file.route} ${file.path}`);
  });
  console.log('\nApproved mutation commands (run separately after visual review):');
  deliveryFiles.forEach((file) => {
    console.log(`da --org somarc --repo throughline --branch feature-throughline-tapestry --commit --format json content put ${file.route} ${file.path}`);
  });
}

function main() {
  mkdirSync(STAGE, { recursive: true });
  assertCleanTrackedTree();
  const misplaced = findMisplacedMedia();
  if (misplaced.length) throw new Error(`Generated media must remain under .da/media-staging:\n${misplaced.join('\n')}`);

  const images = IMAGE_ASSETS.map(inspectImage);
  const video = inspectVideo();
  const manifest = {
    schemaVersion: 'throughline-media.v1',
    generatedAt: new Date().toISOString(),
    vision: {
      repository: 'https://github.com/somarc/through-line-sites',
      commit: '4519f0b991a4cc87f19d7b66d000edad0a47b5ad',
    },
    trustBoundary: 'da-cli --riverboat-gambler / reviewed local YAML / no DA write',
    generator: run('/Users/mhess/.local/bin/grok', ['--version']),
    git: {
      branch: run('git', ['branch', '--show-current']),
      commit: run('git', ['rev-parse', 'HEAD']),
      dirty: false,
    },
    controls: {
      pipeline: { path: relative(PIPELINE), sha256: sha256(PIPELINE) },
      sandbox: { path: relative(SANDBOX), sha256: sha256(SANDBOX) },
      collector: { path: 'tools/collect-grok-media.cjs', sha256: sha256(resolve('tools/collect-grok-media.cjs')) },
      validator: { path: 'tools/validate-media.cjs', sha256: sha256(resolve('tools/validate-media.cjs')) },
    },
    prompts: [...IMAGE_ASSETS, VIDEO_ASSET].flatMap(promptRecord),
    files: [...images, ...(video ? [video] : [])],
    videoStatus: video ? 'validated' : 'not-present',
    claims: {
      technicalValidation: true,
      visualApproval: false,
      daUpload: false,
      preview: false,
      livePublication: false,
    },
  };
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  writeFileSync(REVIEW, buildReview(manifest), { mode: 0o600 });
  console.log(JSON.stringify(manifest, null, 2));
  console.log(`\nReview artifact: ${relative(REVIEW)}`);
  if (process.argv.includes('--plan')) printPlan(manifest.files);
}

try {
  main();
} catch (error) {
  console.error(`Media validation failed: ${error.message}`);
  process.exitCode = 1;
}
