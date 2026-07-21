/* eslint-env node */
/* eslint-disable no-console */

const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} = require('node:fs');
const { homedir } = require('node:os');
const {
  extname,
  join,
  resolve,
  sep,
} = require('node:path');

const STAGE = resolve('.da/media-staging');
const RAW = resolve(STAGE, 'raw');
const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const IMAGE_TOOLS = new Set(['image_gen', 'image_edit']);

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8' }).trim();
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function parseJsonLines(file) {
  return readFileSync(file, 'utf8').split('\n').filter(Boolean).flatMap((line) => {
    try {
      return [JSON.parse(line)];
    } catch (error) {
      return [];
    }
  });
}

function toolName(update) {
  return update?._meta?.['x.ai/tool']?.name || null;
}

function sessionEvidence(receiptFile, expectedTool) {
  if (!existsSync(receiptFile) || statSync(receiptFile).size === 0) {
    throw new Error(`Missing Grok receipt: ${receiptFile}`);
  }
  const receipt = JSON.parse(readFileSync(receiptFile, 'utf8'));
  if (!receipt.sessionId) throw new Error(`Grok receipt has no sessionId: ${receiptFile}`);

  const sessionDir = join(
    homedir(), '.grok', 'sessions', encodeURIComponent(process.cwd()), receipt.sessionId,
  );
  const updatesFile = join(sessionDir, 'updates.jsonl');
  if (!existsSync(updatesFile)) throw new Error(`Missing Grok session updates: ${updatesFile}`);

  const events = parseJsonLines(updatesFile);
  const calls = events.map((event, index) => ({
    event,
    index,
    update: event?.params?.update,
  })).filter(({ update }) => (
    update?.sessionUpdate === 'tool_call'
    && toolName(update) === expectedTool
    && update.toolCallId
  ));
  if (calls.length !== 1) {
    throw new Error(`Expected exactly one ${expectedTool} tool call; observed ${calls.length}`);
  }

  const [{ update: call, index: callEventIndex }] = calls;
  const completions = events.map((event, index) => ({
    event,
    index,
    update: event?.params?.update,
  })).filter(({ update }) => (
    update?.sessionUpdate === 'tool_call_update'
    && update.toolCallId === call.toolCallId
    && update.status === 'completed'
    && typeof update.rawOutput?.path === 'string'
  ));
  if (completions.length !== 1) {
    throw new Error(`Expected one completed result for ${call.toolCallId}; observed ${completions.length}`);
  }

  const [{ update: completion, index: resultEventIndex }] = completions;
  const source = realpathSync(completion.rawOutput.path);
  const managedRoots = ['images', 'videos']
    .map((folder) => join(sessionDir, folder))
    .filter((folder) => existsSync(folder))
    .map((folder) => realpathSync(folder));
  if (!managedRoots.some((root) => source.startsWith(`${root}${sep}`))) {
    throw new Error(`Refusing output outside Grok managed media directories: ${source}`);
  }

  return {
    receipt,
    receiptFile,
    sessionDir,
    source,
    toolCallId: call.toolCallId,
    callEventIndex,
    resultEventIndex,
    transcriptSha256: sha256(updatesFile),
  };
}

function collectImage(name, evidence) {
  const sourceExtension = extname(evidence.source).toLowerCase() || '.jpg';
  const rawTarget = resolve(RAW, `${name}-source${sourceExtension}`);
  const target = resolve(STAGE, `${name}.webp`);
  copyFileSync(evidence.source, rawTarget);
  run('magick', [
    rawTarget,
    '-auto-orient',
    '-resize', '2400x1350^',
    '-gravity', 'center',
    '-extent', '2400x1350',
    '-quality', '88',
    target,
  ]);
  return {
    rawTarget,
    target,
    sourceMedia: null,
    normalizedWith: 'ImageMagick 2400x1350 WebP q88',
  };
}

function collectVideo(name, evidence) {
  const sourceExtension = extname(evidence.source).toLowerCase() || '.mp4';
  const rawTarget = resolve(RAW, `${name}-source${sourceExtension}`);
  const target = resolve(STAGE, `${name}.mp4`);
  copyFileSync(evidence.source, rawTarget);

  const probe = JSON.parse(run('ffprobe', [
    '-v', 'error', '-show_streams', '-show_format', '-of', 'json', rawTarget,
  ]));
  const stream = probe.streams.find((candidate) => candidate.codec_type === 'video');
  if (!stream) throw new Error('Imagine video output has no video stream');
  const width = Number(stream.width);
  const height = Number(stream.height);
  const ratio = width / height;
  const sourceMedia = {
    width,
    height,
    aspectRatio: ratio,
    codec: stream.codec_name,
    pixelFormat: stream.pix_fmt,
    qualityWarning: width < 1280 || height < 720
      ? `Native Imagine output ${width}x${height} required upscale to delivery size`
      : null,
  };

  if (
    stream.codec_name === 'h264'
    && stream.pix_fmt === 'yuv420p'
    && width >= 1280
    && height >= 720
    && ratio >= 1.76
    && ratio <= 1.79
  ) {
    run('ffmpeg', [
      '-y', '-i', rawTarget, '-map', '0:v:0', '-an', '-c:v', 'copy',
      '-movflags', '+faststart', target,
    ]);
    return {
      rawTarget,
      target,
      sourceMedia,
      normalizedWith: 'FFmpeg stream copy, audio removed, fast-start',
    };
  }

  run('ffmpeg', [
    '-y', '-i', rawTarget, '-map', '0:v:0', '-an', '-c:v', 'libx264',
    '-vf', 'scale=1280:720:force_original_aspect_ratio=increase:flags=lanczos,crop=1280:720',
    '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '19',
    '-movflags', '+faststart', target,
  ]);
  return {
    rawTarget,
    target,
    sourceMedia,
    normalizedWith: `FFmpeg H.264 yuv420p CRF19, Lanczos scale/crop from ${width}x${height} to 1280x720, audio removed, fast-start`,
  };
}

function relative(file) {
  return file.replace(`${process.cwd()}/`, '');
}

function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--optional');
  const [kind, name, expectedTool, receiptArg] = args;
  const optional = process.argv.includes('--optional');
  if (!['image', 'video'].includes(kind) || !NAME_PATTERN.test(name || '') || !receiptArg) {
    throw new Error('Usage: node tools/collect-grok-media.cjs <image|video> <asset-name> <image_gen|image_edit|image_to_video> <receipt.json> [--optional]');
  }
  if (kind === 'image' && !IMAGE_TOOLS.has(expectedTool)) {
    throw new Error(`Image collection refuses tool ${expectedTool}`);
  }
  if (kind === 'video' && expectedTool !== 'image_to_video') {
    throw new Error(`Video collection refuses tool ${expectedTool}`);
  }

  mkdirSync(RAW, { recursive: true });
  let evidence;
  try {
    evidence = sessionEvidence(resolve(receiptArg), expectedTool);
  } catch (error) {
    if (optional) {
      console.log(`Optional ${name} not collected: ${error.message}`);
      return;
    }
    throw error;
  }

  const collected = kind === 'image'
    ? collectImage(name, evidence)
    : collectVideo(name, evidence);
  const result = {
    schemaVersion: 'throughline-grok-collector.v1',
    kind,
    name,
    tool: expectedTool,
    sessionId: evidence.receipt.sessionId,
    toolCallId: evidence.toolCallId,
    transcript: {
      sha256: evidence.transcriptSha256,
      callEventIndex: evidence.callEventIndex,
      resultEventIndex: evidence.resultEventIndex,
    },
    receipt: {
      path: relative(resolve(receiptArg)),
      sha256: sha256(resolve(receiptArg)),
    },
    managedSourceSha256: sha256(evidence.source),
    rawCopy: relative(collected.rawTarget),
    output: relative(collected.target),
    outputSha256: sha256(collected.target),
    sourceMedia: collected.sourceMedia,
    normalizedWith: collected.normalizedWith,
  };
  writeFileSync(resolve(STAGE, `${name}.collector.json`), `${JSON.stringify(result, null, 2)}\n`, {
    mode: 0o600,
  });
  console.log(JSON.stringify(result, null, 2));
}

try {
  main();
} catch (error) {
  console.error(`Grok media collection failed: ${error.message}`);
  process.exitCode = 1;
}
