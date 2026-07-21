# Throughline design contract

## Canon

- **Vision repository:** <https://github.com/somarc/through-line-sites>
- **Pinned revision:** `4519f0b991a4cc87f19d7b66d000edad0a47b5ad`
- **Primary references:** `docs/VISION.md` and `docs/PANELS.md`
- **North star:** A shareable illuminated storyboard where fear's chains,
  Michael's sword, the Stoic citadel, and Hill's purpose are the same golden
  thread seen from four angles.

The vision repo owns the argument. This repo owns the EDS rendering. If the two
drift, update implementation here; do not silently rewrite the canon.

## Visual language: Tapestry Chiaroscuro

Renaissance painting language meets restrained modern film staging. The seven
plates progress from deep indigo, slate, and storm green-blue toward amber,
candle gold, and dawn rose. Gold is semantic light—purpose, protection, and a
thread held—not generic decoration.

| Axis | Contract |
|---|---|
| Light | Strong chiaroscuro; gold and warm white carry meaning |
| Surface | Painterly brush presence, atmospheric depth, subtle grain |
| Composition | One primary symbolic action per plate; readable silhouettes |
| Protagonist | Timeless, non-celebrity adult; continuous face, clothing, and dignity |
| Michael | Iconic and recognizably Christian, but restrained rather than kitsch |
| Devil | Weather, pressure, whisper, or shadow—not cartoon and never gore |
| Motion | One six-second atmospheric hero loop; still-first everywhere else |

Cream-paper editorial styling is reserved for `/about` and `/sources`. The
tapestry itself stays in the dark-to-gold emotional register.

## Closed motif set

New panels recombine these symbols; they do not invent unrelated ones.

- chains: intact → tightening → cracking → residual → absent
- storm sea: overwhelming → half-frame → distant → calm memory
- golden thread: spark → strands → taut line → complete weave
- flaming sword / shield: distant watch → strike → near guard → apprenticeship
- cliff / citadel / garden / forge: distance → inner structure → open path
- fixed star: hidden → revealed → aimed at → walked beneath
- shadow Devil: dominant weather → pressure → retreating residue

## Experience shape

- `/` is the seven-beat tapestry and supports deep links for every chapter.
- `/about` explains the origin, method, and dual reading.
- `/sources` is the single bibliography and attribution home.
- Native scroll only; no hash router and no scroll-jacking.
- Desktop gets a quiet chapter rail; mobile gets compact numbered progress.
- The rail carries the golden thread: a scroll-derived stroke that draws from
  deep gold toward bright gold across the seven beats, rendered fully drawn
  under reduced motion.
- Scrim and copy-card temperature follow the beat—cold ink under panels 02–04,
  warming through ember and amber to a dawn-rose cast at panel 07 and the coda.
- Poster is LCP. Video is progressive, muted, inline, deferred until the page
  has settled, removed for reduced motion or Save-Data, and carries a visible
  pause control.

## Blocks

| Block | Job |
|---|---|
| `tapestry-hero` | Brand + Panel 01, poster-first cinematic stage and optional loop |
| `panel-nav` | Accessible 01–07 deep-link rail with scroll-aware current state |
| `storyboard-panel` | Repeated plates 02–07: art, lede, insight, voices, reflection |
| `story-hero` | Quiet art-led hero for About and Sources |

Authoring stays semantic. Text carries precision and remains outside generated
art. Generated assets contain no baked-in headline, labels, UI, or quotations.

## Typography

Display type is self-hosted; supporting text stays native so no font request
ever blocks first paint:

- display: Fraunces (variable, latin subset, loaded post-LCP with a
  metric-adjusted Times fallback) over Iowan Old Style / Baskerville / Times
- body: Avenir Next / Helvetica Neue / Arial fallback
- labels: SF Mono / Consolas / Liberation Mono fallback

Display type is classical, low-contrast interface text is humanist, and chapter
labels use small tracked caps. Type never competes with the plate.

## Accessibility and performance

- one H1 per page and meaningful plate alt text
- keyboard-focusable rail and visible focus treatment
- gold-on-ink contrast protected by directional scrims
- all content remains readable with JS, video, or motion unavailable
- first poster eager + high priority; later plates lazy
- no generated image contains meaning that is absent from authored text
- no live publication without explicit human approval

## Anti-goals

- dark-academia mood without an argument
- church-tract or self-help-funnel voice
- neon cyberpunk, purple glow, plastic 3D, generic AI imagery
- a cartoon Devil, baroque gold excess, or videogame combat staging
- dense text walls over the art
- autoplay audio, hard cuts, scroll-jacking, or canvas/WebGL as LCP
