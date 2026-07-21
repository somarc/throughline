# Throughline: Outwitting the Devil

**See the pattern. Break the chain.**

Throughline is an AEM Edge Delivery Services visual tapestry about one human
struggle told in several dialects: Napoleon Hill's diagnosis of fear and
drifting, Saint Michael's archetype of protection, Stoic inner discipline, and
the symbolic grammar of classic descent-and-return stories.

The primary experience is a seven-panel, naturally scrolling storyboard. The
art moves from storm indigo to candle gold while a closed set of motifs—chains,
sea, sword, citadel, fixed star, and golden thread—changes state across the
sequence.

## Repository roles

| Surface | Role |
|---|---|
| [`somarc/through-line-sites`](https://github.com/somarc/through-line-sites) | Brand, narrative, panel bible, Imagine briefs, and design canon |
| This repository | EDS blocks, styles, fixtures, media pipeline, and preview implementation |
| DA content bus `somarc/throughline` | Authored pages and Grok Imagine media |
| Local `da-cli` | Sole preferred operator for DA/EDS writes and preview proof |

The implementation is pinned to vision revision
`4519f0b991a4cc87f19d7b66d000edad0a47b5ad`. See [`DESIGN.md`](DESIGN.md)
and [`MEDIA-PRODUCTION.md`](MEDIA-PRODUCTION.md).

## Environments
- Preview: <https://main--throughline--somarc.aem.page/>
- Live: <https://main--throughline--somarc.aem.live/>
- DA: <https://da.live/#/somarc/throughline>

## Local development

```bash
npm i
npx -y @adobe/aem-cli up --no-open --forward-browser-logs
```

The development server uses the DA content already previewed for this site and
the code in the current checkout.

## Quality checks

```bash
npm run lint
npm run media:validate # after a Grok Imagine production run
```

## Dogfood construction

Throughline is the product-shaped greenfield track for the da-cli 0.6.0
dogfood run. **DA is the single source of truth for content** — author and
edit documents in DA (or locally via `da content clone/diff/push`), never as
git fixtures. The tracked construct recorded the original bootstrap: media
first, then content, then page previews; it never publishes live. The
`content/` fixture folder from that bootstrap has been retired.

```bash
DA="node /Users/mhess/aem/aem-code/da/da-cli/bin/da.js"

$DA --org somarc --repo throughline --branch feature-throughline-tapestry \
  --format json pipeline run dogfood/construct.yaml --dry-run

$DA --org somarc --repo throughline --branch feature-throughline-tapestry \
  --commit --format json pipeline run dogfood/construct.yaml
```

Grok Imagine generation is a separate, approval-gated local trust boundary.
See [`MEDIA-PRODUCTION.md`](MEDIA-PRODUCTION.md). No live publish is part of
either pipeline.

1. Create a new repository based on the `aem-boilerplate` template
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `throughline` directory in your favorite IDE and start coding :)
