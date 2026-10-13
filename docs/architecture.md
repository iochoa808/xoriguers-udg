# Architecture

How the pieces fit together, and why. Start with the
[README](../README.md) for setup; this document is for when you need to change
something structural.

## The one idea

The colla's events used to exist in three unconnected places: the Google
Calendar they actually schedule in, a handful of agenda entries on the site, and
a spreadsheet of historical diades. The same actuació got typed up to three
times, and "what we are doing" lived apart from "what we did".

Now there is **one entry per event, for its whole life**:

```
Google Calendar          an event is created: "ACTUACIÓ Barraques"
      │
      │  nightly workflow, scripts/import-calendar.mjs
      ▼
src/content/agenda/2026-10-29-actuacio-barraques.md
      │
      ├── while the date is in the future  →  /agenda,  and the homepage
      │
      ├── someone records the castells in /admin after it happens
      │
      └── once the date has passed        →  /castells (the archive)
                                              and its own page, /agenda/<id>
```

`/agenda` and `/castells` are two queries over the same collection, split by
date. Nothing is copied between them, so nothing can disagree.

A consequence worth remembering: **the archive changes without anybody editing
anything**, simply because a date passes. That is why the deploy workflow also
runs after the nightly calendar sync — otherwise a diada could sit in "upcoming"
for a day after it happened.

## Content collections

All of them are defined in [`src/content.config.ts`](../src/content.config.ts),
loaded from markdown with Astro's `glob` loader, and validated by Zod at build
time. A schema error fails the build, which is deliberate: bad content should
never reach the site.

| Collection | Files | What it is |
|---|---:|---|
| `agenda` | 284 | Every event, past and future: 154 diades, 127 actuacions, a trobada or two. The archive and the agenda both read it. |
| `pagines` | 15 | One file per page, for the editable parts of pages that are not lists. Also the page headers (`agenda.md`, `galeria.md`, …). |
| `noticies` | 2 | News items. The two most recent appear on the homepage. |
| `galeria` | 2 | Photo albums. |
| `activitats` | 4 | The colla's social life — Oktoberfest, Barraques, Calçotada, Aniverfest — shown on the homepage. |
| `junta-directiva`, `junta-tecnica` | 3 + 3 | One file per season, each with its members. |
| `productes` | 4 | Merchandising, with sizes and stock. |
| `patrocinadors` | 2 | Sponsor logos. |
| `documents` | 4 | PDFs: statutes, internal rules, protocols. |
| `configuracio` | 1 | Site-wide settings: social URLs, the calendar URL, the default header image, the SEO description. |

### The agenda entry

The fields that matter, and who owns them:

| Field | Owner | Notes |
|---|---|---|
| `nom`, `data`, `hora`, `lloc`, `poblacio`, `cancelada`, `calendarUid` | **the importer** | Overwritten on every nightly run. Editing them by hand is pointless; change the Google Calendar instead. |
| `castells[]`, `cartell`, `observacio`, `mostrarPortada`, `estat`, `collesParticipants`, body | **the editor** | The importer never touches these. |
| `tipus` | importer at creation, editor afterwards | Guessed from the name by `classificaEsdeveniment`. |
| `notacioOriginal`, `cccc` | the migration | Provenance from the old spreadsheet. |

`hora`, `lloc` and `poblacio` are **optional**, because the 282 migrated
historical entries have none and an all-day calendar event has no time. Guard
them in any page you write; `detallsEsdeveniment()` already does.

`temporada` is deliberately **not stored**. It is derived from `data` by
`temporadaDe()`, because a stored season is a second copy of the same fact and
the spreadsheet proved it drifts — two of its rows contradicted their own season
column.

## The libraries

Everything in [`src/lib`](../src/lib) is a plain module with a `.test.ts` beside
it. No framework, no mocks, 85 tests, under a second to run. Pages do the
reading and the rendering; the libraries hold anything worth testing.

| Module | Purpose |
|---|---|
| `historial.ts` | The castells domain: parse a castell, score it, group by gamma. See [castells.md](castells.md). |
| `registre-csv.ts` | Reads the old spreadsheet. **Migration only** — nothing in `src/pages` imports it. |
| `ical.ts` | A small RFC 5545 reader: enough for this one feed, not a general parser. Unfolds lines, handles the three `DTSTART` forms, flags recurring events. |
| `calendari.ts` | Everything derived from the single calendar URL in Configuració: the ICS feed, and the month embed with Google's chrome stripped off. |
| `esdeveniment.ts` | `classificaEsdeveniment` (name → type), `temporadaDe` (date → season), and the one-line "12:00 · Plaça del Vi, Girona". |
| `format.ts` | Catalan date formats. `formatDateNumeric` is pinned to UTC so a date cannot slip a day depending on where the site is built. |
| `media.ts`, `config.ts` | Turn a stored path into a URL under the right base; tell a real URL from a `[PLACEHOLDER]`. |
| `mailto.ts`, `roman-ordinal.ts` | A merchandising reservation link; `29` → `XXIXè`. |

## The calendar importer

[`scripts/import-calendar.mjs`](../scripts/import-calendar.mjs), run nightly by
[`import-calendar.yml`](../.github/workflows/import-calendar.yml) at 04:23 UTC,
or by hand with `npm run import:calendar` (`--dry` to see what it would do).

It reads the public ICS feed — derived from the embed URL already in
Configuració, so there is only ever one calendar address to keep right, and no
credentials anywhere — and then, for each event:

1. **Recurring events are skipped.** The weekly assaig is an `RRULE`; expanding
   it would create an entry every Tuesday and Thursday forever. The agenda page
   shows them through the embedded calendar instead.
2. It finds the existing entry by `calendarUid`, or adopts a file whose name
   already matches the date and slug (this is how historical entries get joined
   to their calendar event rather than duplicated).
3. It rewrites **only** the calendar-owned lines, by key, at column 0. Nested
   `castells:` entries are untouched by construction.
4. It prints past actuacions with no castells recorded — the "needs writing up"
   queue.

The ownership rule in step 3 is the whole safety of the thing. A nightly job
with write access to the colla's permanent record has to be unable to erase it.
If you extend the importer, extend `DEL_CALENDARI` consciously.

Two operational notes, both learned the hard way:

- The cron is at `:23`, not on the hour. GitHub queues every cron that lands on
  `:00` and silently drops what it cannot get to; the first scheduled run was
  lost that way.
- A push made with the default `GITHUB_TOKEN` does not trigger other workflows,
  so `deploy.yml` listens for `workflow_run` on the sync rather than for the
  push it makes.

## Build and deploy

`astro.config.mjs` sets `base` to `/xoriguers-udg/` when `GITHUB_ACTIONS` is
set, and `/` otherwise, because the site is not served from the root of
`iochoa808.github.io`. **Every internal link must be built from
`import.meta.env.BASE_URL`.** A bare `href="/agenda"` works locally and 404s in
production, which is the single easiest mistake to make here.

Output is fully static — 307 pages, no server, no client framework. The only
JavaScript shipped to the browser is the archive's tab/sort/filter behaviour and
the merchandising size picker, both written as progressive enhancement: the
archive renders every row server-side and a `<noscript>` block unhides the
panels, so it works with scripts off.

`deploy.yml` runs on every push to `main`, after the calendar sync, or by hand.
It installs, **runs the tests**, builds, and publishes to GitHub Pages. An
editor pressing Save in the CMS commits to `main`, so their Save is a deploy
that takes a couple of minutes.

## The migration, for the record

The 282 historical diades came from `src/data/historial_castells.csv`, the
colla's own registre. [`scripts/migrate-historial.mjs`](../scripts/migrate-historial.mjs)
converted it in commit `8b4f2cd` (24 September 2026) and the CSV was removed in
the same commit. To get it back:

```bash
git show 2c57ebc:src/data/historial_castells.csv > historial_castells.csv
```

The migration refused to invent anything. Rows whose date was unusable or
impossible — including an `Actuació RESA` with five castells recorded — were
**not** migrated rather than being given a guessed date; four rows remain in the
CSV and not on the site. See [open-questions.md](open-questions.md).

The parser is lossy on a few prose tokens, so each migrated entry keeps
`notacioOriginal`: the castells exactly as the registre wrote them, shown at the
bottom of the diada's page.
