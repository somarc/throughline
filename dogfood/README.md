# Throughline da-cli 0.6.0 dogfood track

Throughline is the creative greenfield companion to the certifying
`somarc/da-cli-0-6-0` site. The proof question is not command-family coverage;
it is whether an agent can carry a curated product vision through code, Grok
Imagine media, DA authoring, and EDS preview without bypassing the CLI.

## Reproducibility chain

```text
through-line-sites vision @ 4519f0b
  → tracked blocks / styles / content fixtures
  → tracked Grok Imagine briefs + Riverboat plan
  → locally reviewed media manifest
  → explicit da content put
  → dogfood/construct.yaml
  → feature preview + audits
```

## Invariants

- The local source tree at `/Users/mhess/aem/aem-code/da/da-cli` is the DA
  operator under test. No raw admin-API calls; every content, preview, and
  audit operation goes through `da`.
- DA is the single source of truth for content. The `content/` git fixtures
  used for the original bootstrap are retired; edit documents in DA (or via
  `da content clone/diff/push`). Evidence files under `dogfood/` keep the
  historical fixture paths as a record of what was run.
- Grok generation and DA upload are distinct approval boundaries.
- Same-project media is uploaded before HTML that references it.
- `--strict-media-urls` protects content writes from missing assets.
- Branch names use hyphens so EDS feature hosts remain valid.
- This track stops at preview. Live publication requires a separate explicit
  human request.

## Evidence

Run artifacts copied into `dogfood/evidence/` describe the observed command
plan and outcome. They do not claim visual approval or live publication.
