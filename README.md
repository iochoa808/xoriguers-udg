# Xoriguers UdG

The website of **Xoriguers UdG**, the university castellers colla of the
Universitat de Girona. Astro builds a static site; [Decap CMS](https://decapcms.org)
edits its content as files in this repository; GitHub Pages serves it at
<https://iochoa808.github.io/xoriguers-udg/>.

The people who run the site are one or two members of the colla. They never see
GitHub: they open `/admin`, fill in forms, press Save, and a commit plus a deploy
happen behind them. Keeping that true is the main constraint on everything here.

**Language.** Code, comments, commit messages and these docs are in English.
Everything a visitor or an editor reads — page content, CMS labels and hints — is
in Catalan. Field names in the schemas are Catalan too (`data`, `castells`,
`temporada`), because they mirror what the CMS shows.

## Getting it running

You need **Node 22.18 or newer** (24 is what this was last built with). Then:

```bash
npm install
npm run dev:all
```

That starts two things:

| | |
|---|---|
| <http://localhost:4321> | the site |
| <http://localhost:4321/admin> | the CMS, writing to your local checkout |

The CMS works locally because `local_backend: true` in
[`public/admin/config.yml`](public/admin/config.yml) makes Decap talk to
`decap-server` (the second half of `dev:all`) instead of GitHub. Saving a page in
the local CMS edits the markdown file in `src/content/` — no account, no
DecapBridge, no commit. If you only want the site, `npm run dev` is enough.

```bash
npm test                  # 85 unit tests, all of src/lib
npm run build             # static build into dist/
GITHUB_ACTIONS=true npm run build   # build exactly as CI does, with the /xoriguers-udg/ base
```

## How the site is laid out

```
src/
  content/            every word on the site, as markdown — this is the database
  content.config.ts   the schema for all of it: the file to read first
  pages/              one file per route
  layouts/Base.astro  nav, hero, footer, <head> — every page goes through it
  components/         the three things used by more than one page
  lib/                the logic, with tests beside each file
  styles/global.css   design tokens and the handful of shared classes
public/admin/         the CMS: config.yml is the form definitions
scripts/              the Google Calendar importer, and a spent migration
.github/workflows/    deploy, and the nightly calendar sync
docs/                 the longer explanations
```

Two things are worth knowing before you read any page:

**One event model.** An actuació is a single entry in the `agenda` collection
for its whole life. The calendar creates it, the agenda lists it while it is in
the future, someone records the castells afterwards, and the archive at
`/castells` shows it from then on. There is no separate "past events" store —
the archive is a query over the same collection. See
[docs/architecture.md](docs/architecture.md).

**The content is real.** The 282 diades going back to 1999-2000 are the colla's
actual historical record, migrated from a spreadsheet. Don't regenerate,
reformat or bulk-edit `src/content/agenda/` casually; `docs/castells.md` explains
what the notation means before you touch any of it.

## Everyday tasks

| You want to | Do this |
|---|---|
| Add a field editors can fill in | Add it to `src/content.config.ts` **and** to `public/admin/config.yml`, then use it in the page. Both, always — see the hazard below. |
| Change what a page looks like | Edit that page in `src/pages/`. Styles are scoped to the file; shared tokens are in `src/styles/global.css`. |
| Add a page to the navigation | `src/layouts/Base.astro` — the nav and the footer index are both there. |
| Change a date, place or name | It is content: edit the markdown in `src/content/`, or use `/admin`. |
| Change how a castell is scored | `src/lib/historial.ts`, with tests in `historial.test.ts`. Read `docs/castells.md` first. |
| Pull in new calendar events by hand | `npm run import:calendar` (add `--dry` to see what it would do) |

## Three things that will cost you an hour

**Decap deletes fields its config has never heard of.** If you add a field to
`content.config.ts` and the page, but not to `public/admin/config.yml`, then the
next time an editor saves that page in the CMS the field is silently dropped
from the file. It has happened twice here. Add fields in both places in the same
commit, and after deploying a new field, reload `/admin` before saving anything.

**Restart the dev server after changing `content.config.ts`** or after adding or
removing content files in bulk. Astro caches the content layer in `.astro/`, and
a stale cache shows up as a 500 on the page you just edited, or as a collection
that silently returns nothing. `rm -rf .astro` and start again.

**A shared CSS class loses to a page's own styles.** Astro adds a scope
attribute to selectors in a page's `<style>`, so `.card` inside a page beats
`.card` in `global.css` on specificity. `global.css` holds tokens, typography
and a few genuinely global classes (`.btn`, `.pill`, `.display`); everything
else belongs in the page.

## Deploying

Pushing to `main` builds, tests and deploys
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). The build fails
the deploy if the tests fail. Saving in the CMS pushes to `main`, so an editor's
Save is a deploy.

The base path differs between local and production — the site lives in a
subdirectory on GitHub Pages — so **always build links from
`import.meta.env.BASE_URL`**, never as a bare `/agenda`. `astro.config.mjs` sets
it from `GITHUB_ACTIONS`.

A second workflow syncs the Google Calendar every night and commits any change,
which in turn triggers a deploy. [docs/architecture.md](docs/architecture.md)
covers what it does and does not own.

## Where to read next

- [docs/architecture.md](docs/architecture.md) — the data model, the
  calendar → agenda → archive pipeline, the libraries, the deploy
- [docs/castells.md](docs/castells.md) — castell notation, folre and agulla,
  vanos, figueretes, and how points are worked out
- [docs/cms.md](docs/cms.md) — what each collection is for and how the CMS is
  wired, for whoever maintains the editing experience
- [docs/open-questions.md](docs/open-questions.md) — the decisions still waiting
  on the colla, and the placeholder content still to replace
- [docs/concept-inicial.md](docs/concept-inicial.md) — the original proposal, in
  Catalan. Historical, and wrong in two places it names itself.
