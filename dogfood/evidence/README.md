# Throughline dogfood evidence — feature preview

**Captured:** 2026-07-20  
**Vision canon:** `somarc/through-line-sites@4519f0b991a4cc87f19d7b66d000edad0a47b5ad`  
**Site branch:** `somarc/throughline@feature-throughline-tapestry`  
**Implementation commit:** `ee02057077a9cbfe3bbd130f6cf7d15ed2123f85`  
**Operator:** local da-cli source tree, package `0.5.1`, initial run SHA `18877d6`

## Public feature proof

- Tapestry: <https://feature-throughline-tapestry--throughline--somarc.aem.page/>
- About: <https://feature-throughline-tapestry--throughline--somarc.aem.page/about>
- Sources: <https://feature-throughline-tapestry--throughline--somarc.aem.page/sources>
- Hero video: <https://feature-throughline-tapestry--throughline--somarc.aem.page/media/tapestry/the-drift-loop.mp4>

No page or media route was published to `*.aem.live`. Freshness evidence therefore
correctly reports `preview-only` or `live-stale` rather than pretending the
feature is production.

## Grok Imagine production

Riverboat run `b16e243a` executed the reviewed local pipeline with
`unsafeExecution: true` and no unapproved shell step. The final plan contains
29 steps: character lock, seven linked panels, a targeted Panel 06 light pass,
About/Sources plates, image-to-video, collection, loop finish, and validation.

The final `media-manifest.json` proves:

- ten 2400×1350 WebP files (one non-delivery character lock + nine delivery plates);
- image lineage uses `image_gen` for bases/supporting plates and `image_edit`
  for the seven-panel character-continuity sequence;
- a Grok Imagine `image_to_video` tool event for the 6.04-second Panel 01 loop;
- H.264/yuv420p, 1280×720, no audio, fast-start, 2.0 MiB;
- local loop finish SSIM `0.978654` after the first review caught a visible
  last→first jump;
- hashes for every prompt, collector, validator, sandbox, output, receipt, and
  structured Imagine tool event.

The first video attempt surfaced xAI's ZDR contract: caller-owned signed storage
is required. The successful recovery used Grok Build's supported
`tools.zdr_video_output_s3` path; no local fake or alternate generator replaced
Imagine.

## DA construction

Construct run `59162fbc` completed **33/33 steps**, each once with exit code 0:

1. upload and preview-activate nine images plus one MP4;
2. put and preview `/nav`, `/footer`, `/`, `/about`, and `/sources`;
3. run `preview explain` on all three public page routes.

The first 23-step construct correctly uploaded content but revealed that DA
binary assets also need explicit preview activation. `dogfood/construct.yaml`
now records that dependency before any page that references the media.

## Validation

| Check | Result |
|---|---|
| `npm run lint` | pass |
| Media validator | pass; video validated; seam SSIM 0.978654 |
| Browser DOM | all blocks loaded; one H1; metadata lifted; header/footer loaded |
| Hero poster | rewritten `media_<hash>.webp`, 750×422 derivative loaded |
| Hero video | readyState 4, playing, 6.041667 s, no media error |
| Later panels | six optimized 750×422 derivatives loaded |
| `/about` | hero image loaded; four cards; three paper sections |
| `/sources` | hero image loaded; four paper sections; bibliography headings intact |
| `audit full /` | 0 errors, 0 warnings |
| `audit contracts --verify-code` | 5 pages; every real block JS/CSS 200; `missing: []` |
| `design audit` | 0 errors, warnings, or info findings |
| `site freshness / --include-shared` | every DA→feature-preview comparison fresh |
| Route ownership | `/`, `/about`, `/sources` all `contentbus` |

## Dogfood flywheel into da-cli

This site exposed three false diagnostics in local da-cli and produced tested
primitive fixes in <https://github.com/somarc/da-cli/pull/46>:

1. contract inventory mistook Section Metadata styles (`paper`,
   `tapestry-intro`, `tapestry-coda`) for missing codebus blocks;
2. `route classify /` invented `/.html` instead of probing `/index.html`;
3. semantic audit warned on valid named hash anchors used by the chapter rail.

The fix branch passes `npm run lint` and **656/656 tests**. Field replay is
stored in `audit-full.json`, `audit-contracts.json`, and `route-classify.json`.

## Evidence files

| File | Claim |
|---|---|
| `media-plan.json` | final reviewed 29-step Riverboat plan |
| `media-manifest.json` | generated-media lineage and technical validation |
| `media-visual-qa.md` | visual checks, detected misses, and resolutions |
| `construct-plan.json` | final 33-step DA-only construct plan |
| `construct-result.json` | completed run `59162fbc` |
| `audit-full.json` | semantic/headings/links/block result |
| `audit-contracts.json` | verified codebus assets and autoblocks |
| `design-audit.json` | impeccable rule scan |
| `freshness.json` | honest preview-vs-live delivery state |
| `route-classify.json` | final content ownership classification |

`media-manifest.json` intentionally leaves `visualApproval`, `daUpload`, and
`preview` false because it records the generation event only. Those later
claims belong to this evidence pack and the public feature URLs, not to the
file generator.
