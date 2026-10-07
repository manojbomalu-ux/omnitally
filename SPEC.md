# Project Spec: Programmatic SEO Calculator Suite

## Tech Stack
- Framework: Astro (SSR/SSG mode: static, zero-JS by default)
- Styling: Tailwind CSS
- Client Islands: Preact or React for the calculation form
- Deployment: Cloudflare Pages (`dist/`)

## Architecture Requirements
1. Data Matrix: `src/data/tools.json` containing array of 5+ niche calculation configurations (slug, title, formula variables, static breakdown, FAQ items, affiliate targets).
2. Dynamic Route: `src/pages/tools/[slug].astro` using `getStaticPaths()` reading from `tools.json`.
3. URL Parameter Sync: Inputs must read and write to `window.location.search` without reloading.
4. Schema: Inject `WebApplication` and `FAQPage` JSON-LD in the `<head>`.
5. Static Fallback Table: Pre-calculated output matrix rendered as pure HTML table below the widget for SEO.
6. Core Compliance Pages: `/privacy`, `/terms`, `/about`, `/contact`.