# quello docs

The documentation site, built with [Docus](https://docus.dev) (a Nuxt layer).

```bash
pnpm docs          # dev server on http://localhost:5190
pnpm docs:build    # production build
```

Content lives in `content/`, as Markdown with [MDC](https://content.nuxt.com/docs/files/markdown)
components. Directory and file prefixes (`1.`, `2.`) set the order in the sidebar; `.navigation.yml`
sets a section's title and icon.

## Deploying to Vercel

The repository is a pnpm workspace, so point Vercel at this directory rather than the root:

| Setting | Value |
| --- | --- |
| Root Directory | `docs` |
| Framework Preset | Nuxt.js |
| Install Command | *(leave default — Vercel detects the workspace)* |
| Build Command | *(leave default — `nuxt build`)* |

Nitro detects Vercel and builds to `.vercel/output` on its own, so no `vercel.json` is needed.

### The site URL

Two things need it, and they read it from different places:

- **Canonical tags** come from `site.url` in `nuxt.config.ts`, which defaults to
  `https://quello.vercel.app`.
- **The sitemap** is prerendered at build time by Docus, and its `inferSiteURL()` reads *only*
  environment variables — `NUXT_PUBLIC_SITE_URL`, `NUXT_SITE_URL`, then the platform's own
  (`VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL`, Netlify's `URL`, …). It ignores `nuxt.config.ts`.

On Vercel this needs nothing: `VERCEL_PROJECT_PRODUCTION_URL` is present during the build, so the
sitemap gets absolute URLs on its own.

Building **locally** without any of those variables produces a sitemap with relative `<loc>` entries,
which is not a valid sitemap. That is only a local artefact, but if you want to check the real
output:

```bash
NUXT_SITE_URL=https://quello.vercel.app pnpm build
```

If the domain ever changes, update `site.url` in `nuxt.config.ts` *and* set `NUXT_SITE_URL` in the
Vercel project — the first fixes canonicals, the second overrides what Vercel infers.
