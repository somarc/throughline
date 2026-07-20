# Throughline media production

**Generator:** Grok Build / Imagine  
**Orchestrator:** local da-cli Riverboat Gambler  
**Staging owner:** `.da/media-staging/`  
**Delivery owner:** DA content bus `somarc/throughline`

The tracked workflow produces one character lock, seven tapestry plates, two
quiet supporting plates, and an optional six-second hero loop. It is inspired
by the audited `continuity-of-intent` media pipeline but strengthens the
provenance link between a specific Imagine tool call and its managed output.

## Trust boundary

Grok Imagine is not a DA subcommand. Riverboat is therefore the explicit bridge
from a reviewed local YAML pipeline to a tightly constrained Grok subprocess.
Riverboat can execute arbitrary shell commands and must remain visible:

- every shell step is `requires_approval: true`;
- inspect with `--dry-run` before execution;
- generation performs no DA write and receives no root `--commit`;
- each Grok process receives exactly one Imagine tool;
- subagents, shell, file, web, Git, DA, and MCP tools are unavailable;
- the `throughline-media` kernel sandbox makes the checkout read-only except
  for `.da/media-staging/` and denies common credential locations;
- the collector—not the model—copies, normalizes, and hashes managed outputs.

## Run the reviewed plan

```bash
DA="node /Users/mhess/aem/aem-code/da/da-cli/bin/da.js"

$DA --riverboat-gambler \
  --org somarc --repo throughline --branch feature-throughline-tapestry \
  --format json pipeline run pipelines/grok-imagine-media.yaml --dry-run
```

The plan must report `riverboat.unsafeExecution: true` and
`shellStepsWithoutApproval: []`.

After reviewing the YAML and every tracked brief:

```bash
$DA --riverboat-gambler \
  --org somarc --repo throughline --branch feature-throughline-tapestry \
  --format json pipeline run pipelines/grok-imagine-media.yaml --approve-all
```

This is local generation approval, not remote mutation approval.

## Outputs

```text
.da/media-staging/throughline-character-lock.webp
.da/media-staging/panel-01-the-drift.webp
…
.da/media-staging/panel-07-the-tapestry-complete.webp
.da/media-staging/about-origin.webp
.da/media-staging/sources-manuscript.webp
.da/media-staging/the-drift-loop.mp4       # optional only if Imagine provides it
.da/media-staging/manifest.json
.da/media-staging/review.html
```

The review page is generated from the manifest and is explicitly local-only.
It shows the complete plate sequence, the hero loop, hashes, and a manual
continuity checklist.

## Acceptance contract

### Images

- WebP, exactly 2400×1350 (16:9) after normalization;
- 50 KiB–5 MiB;
- no readable text, logo, watermark, interface, or invented citation;
- same protagonist and Michael language across Panels 01–07;
- motif and palette state match `DESIGN.md` and each tracked prompt.

### Video

- Grok Imagine `image_to_video`, using Panel 01 as frame-one identity;
- MP4, H.264/yuv420p, 1280×720 minimum after normalization;
- approximately six seconds, 20–60 fps, no audio, fast-start;
- one restrained camera drift and atmospheric motion; no cuts or new action;
- Panel 01 remains the LCP and reduced-motion experience.
- the tracked FFmpeg finish crossfades the final second into a held first frame
  and must prove first/last-frame SSIM of at least 0.95 before delivery.

### Zero Data Retention teams

xAI's ZDR contract does not let Imagine retain a generated video long enough
to return its normal hosted URL. Grok Build therefore requires a caller-owned,
S3-compatible destination and creates short-lived signed PUT/GET URLs itself.
An operator or platform administrator—not an agent and never a committed
file—must provision the following user/managed Grok setting:

```toml
[tools]
disable_zdr_incompatible_tools = true

[tools.zdr_video_output_s3]
bucket = "<team-owned-bucket>"
endpoint = "https://<s3-compatible-endpoint>"
region = "<region>"
key_prefix = "throughline/grok-videos"
expires_secs = 900

[tools.zdr_video_output_s3.read_write]
access_key_id = "<operator-provisioned>"
secret_access_key = "<operator-provisioned>"
```

The tracked pipeline forces Grok's ZDR-safe tool mode. With valid managed
storage, `image_to_video` uploads through the signed URL, Grok downloads the
result into its managed session folder, and the normal collector proves and
normalizes it. Without that setting the optional video leg refuses cleanly and
the poster-first site remains valid. Never weaken ZDR, expose credentials, or
replace the requested Imagine video with a local fake.

Technical validation is necessary but not visual approval. Review the plate
sequence for character identity, Michael's design, motif state, safe crops,
hands/faces, unwanted text, and theological tone before upload.

## Separate DA delivery

`node tools/validate-media.cjs --plan` prints dry-run and committed upload
commands for the nine delivery images and optional video. DA upload remains a
separate event so a generated file is never confused with approved delivery.

After upload, `dogfood/construct.yaml` places the Git-canonical HTML fixtures,
previews `/`, `/about`, `/sources`, `/nav`, and `/footer`, and stops. It never
publishes to `*.aem.live`.
