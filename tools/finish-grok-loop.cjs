/* eslint-env node */
/* eslint-disable no-console, max-len */

const { createHash } = require('node:crypto');
const { execFileSync, spawnSync } = require('node:child_process');
const {
  existsSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const { resolve } = require('node:path');

const VIDEO = resolve('.da/media-staging/the-drift-loop.mp4');
const TEMP_VIDEO = resolve('.da/media-staging/the-drift-loop.seam.mp4');
const REPORT = resolve('.da/media-staging/the-drift-loop.loop.json');
const FADE_SECONDS = 1;

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function runCombined(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`${command} failed: ${result.stderr || result.stdout}`);
  }
  return `${result.stdout || ''}${result.stderr || ''}`;
}

function inspectVideo(file) {
  const probe = JSON.parse(run('ffprobe', [
    '-v', 'error', '-count_frames', '-select_streams', 'v:0',
    '-show_entries', 'stream=avg_frame_rate,nb_read_frames',
    '-show_entries', 'format=duration', '-of', 'json', file,
  ]));
  const stream = probe.streams[0];
  const [numerator, denominator = '1'] = String(stream.avg_frame_rate).split('/');
  return {
    duration: Number(probe.format.duration),
    frameRate: Number(numerator) / Number(denominator),
    frames: Number(stream.nb_read_frames),
  };
}

function seamSimilarity(file, lastFrame) {
  const prefix = resolve(tmpdir(), `throughline-seam-${process.pid}`);
  const first = `${prefix}-first.png`;
  const last = `${prefix}-last.png`;
  try {
    run('ffmpeg', [
      '-v', 'error', '-y', '-i', file,
      '-vf', 'select=eq(n\\,0)', '-frames:v', '1', first,
    ]);
    run('ffmpeg', [
      '-v', 'error', '-y', '-i', file,
      '-vf', `select=eq(n\\,${lastFrame})`, '-frames:v', '1', last,
    ]);
    const output = runCombined('ffmpeg', [
      '-v', 'info', '-i', first, '-i', last, '-lavfi', 'ssim', '-f', 'null', '-',
    ]);
    const match = output.match(/All:([0-9.]+)/);
    if (!match) throw new Error('FFmpeg did not report a seam SSIM value');
    return Number(match[1]);
  } finally {
    rmSync(first, { force: true });
    rmSync(last, { force: true });
  }
}

function main() {
  const optional = process.argv.includes('--optional');
  if (!existsSync(VIDEO)) {
    if (optional) {
      console.log('Optional hero video is absent; no loop finish required.');
      return;
    }
    throw new Error(`Missing video: ${VIDEO}`);
  }

  const source = inspectVideo(VIDEO);
  if (!Number.isFinite(source.duration) || source.duration <= FADE_SECONDS + 1) {
    throw new Error(`Video duration ${source.duration} is too short for a ${FADE_SECONDS}s seam`);
  }
  const offset = Math.max(0, source.duration - FADE_SECONDS - (1 / source.frameRate));
  const inputSha256 = sha256(VIDEO);
  const filter = [
    '[0:v]split=2[base][first]',
    `[first]trim=start_frame=0:end_frame=1,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=${source.duration + 1}[firsthold]`,
    `[base][firsthold]xfade=transition=fade:duration=${FADE_SECONDS}:offset=${offset},trim=duration=${source.duration},setpts=PTS-STARTPTS,format=yuv420p[out]`,
  ].join(';');

  try {
    run('ffmpeg', [
      '-v', 'error', '-y', '-i', VIDEO, '-filter_complex', filter,
      '-map', '[out]', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19',
      '-movflags', '+faststart', TEMP_VIDEO,
    ]);
    renameSync(TEMP_VIDEO, VIDEO);
  } finally {
    rmSync(TEMP_VIDEO, { force: true });
  }

  const finished = inspectVideo(VIDEO);
  const seamSsim = seamSimilarity(VIDEO, finished.frames - 1);
  if (seamSsim < 0.95) throw new Error(`Loop seam SSIM ${seamSsim.toFixed(4)} is below 0.95`);

  const report = {
    schemaVersion: 'throughline-loop-finish.v1',
    input: {
      sha256: inputSha256,
      durationSeconds: source.duration,
      frameRate: source.frameRate,
      frames: source.frames,
    },
    output: {
      path: '.da/media-staging/the-drift-loop.mp4',
      sha256: sha256(VIDEO),
      durationSeconds: finished.duration,
      frameRate: finished.frameRate,
      frames: finished.frames,
      seamSsim,
    },
    method: `FFmpeg ${FADE_SECONDS}s xfade from final motion into a held first frame; H.264 CRF19; audio removed; fast-start`,
  };
  writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify(report, null, 2));
}

try {
  main();
} catch (error) {
  console.error(`Loop finish failed: ${error.message}`);
  process.exitCode = 1;
}
