# Grok Imagine visual QA

## Method

The reviewed files were served from `.da/media-staging/` and verified against
the SHA-256 values in `media-manifest.json`. Checks combined the visible Studio
review page, macOS Vision/OCR/pose inspection, responsive crop calculations,
ImageMagick color measurements, FFmpeg scene/luma sampling, and first/last-frame
SSIM.

## Final still-image result

- Protagonist body/clothing continuity passes across Panels 01–07.
- Michael's armor, wing, shield, and sword language remains continuous; the
  strongest lock match is Panel 04.
- No plate produced OCR text, wordmarks, interface elements, or extra-figure
  alarms.
- Detected hands use complete pose landmarks; no automated anatomy alarm.
- Panel 01 preserves a genuinely dark, low-detail left/lower type-safe zone.
- About and Sources plates both preserve their editorial type fields and match
  their route jobs.
- The cold-to-gold arc resolves clearly in the dawn finale.

### Corrections made during QA

1. **Mobile composition** — the first CSS pass used full-height `cover`, which
   discarded most of each 16:9 plate on a tall phone. Below 900px the final
   implementation now places the complete 16:9 plate in normal flow with
   `object-fit: contain`, followed by the copy. This removes the crop blocker
   without generating a redundant mobile art set.
2. **Panel 06** — the first plate fell back into a near-black/brown value state.
   A tracked Grok `image_edit` refinement preserved both figures and composition
   while lifting the practiced blade/path light. Final measurements: about 14%
   overall gold, 24% center gold, and 68% dark pixels. The corrected SHA is
   `abcf3ed7f4dbe37bd97b36f0e8ce6118f645a6ab4784553063efcfbd6456901f`.

### Remaining human-look note

Panel 05's forge gesture and two hands pass pose inspection, but automated face
detection does not resolve a face. The review page remains available for a
human 100%-zoom check; this is a composition/readability note, not a detected
malformation or delivery blocker.

## Final video result

The normalized Grok Imagine loop is H.264/yuv420p, 1280×720, 24 fps,
6.041667 seconds, video-only, and fast-start.

Internal sampled-frame checks pass:

- stable principal body and face bounds;
- no new subject, object, text, UI, or logo;
- no sampled face/hand morphing alarm;
- no internal scene cut or flash;
- dark left/lower type-safe field remains empty and readable.

The first review rejected the raw repeat because first/last SSIM was only
0.697. The tracked FFmpeg finish crossfades the final second into a held first
frame. Final seam SSIM is **0.978654**, above the 0.95 delivery gate. Final
video SHA:

`111e740cd7eb3eed67ff7bd8813b5a915d027515d5b34d2e3ae18b096c7726a2`

## Verdict

The still sequence, mobile presentation, and finished hero loop meet the
Throughline visual contract for feature-preview review. Live publication was
not performed.
