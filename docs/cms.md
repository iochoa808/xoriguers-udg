# The CMS

Who edits this site, what they see, and how to change what they see.
[`public/admin/config.yml`](../public/admin/config.yml) is the whole of it:
eleven collections' worth of form definitions, no build step, no plugins.

## How it is wired

[Decap CMS](https://decapcms.org) is a single-page app loaded from a CDN by
[`src/pages/admin/index.astro`](../src/pages/admin/index.astro), pinned to an
exact version. It reads `config.yml`, renders a form per collection, and commits
the result straight to `main` as markdown. Authentication goes through
**DecapBridge** (`git-gateway`), so an editor signs in with an email and
password and never needs a GitHub account.

**There is no editorial workflow.** `publish_mode: editorial_workflow` was
removed on purpose: one or two people run this site and there is nobody to
review for. Save commits, and the commit deploys. The only visibility control is
the `estat` field — `publicat` (the default) or `esborrany`, which keeps an
entry out of the build entirely.

Locally, `local_backend: true` makes Decap talk to `decap-server` instead of
DecapBridge, so `npm run dev:all` gives you the real CMS writing to your own
checkout. Decap only honours that when the page is opened from localhost, so it
is safe to leave on.

## The hazard: add every field in two places

**Decap drops fields its config does not declare.** When an editor saves a page,
Decap writes back the fields it knows about and nothing else — so a field that
exists in `content.config.ts` and in the page but not in `config.yml` is
silently deleted from the markdown the next time anybody saves that page. It has
happened twice in this repo, once taking out a whole block of content.

So, to add something editable:

1. add it to the Zod schema in [`src/content.config.ts`](../src/content.config.ts)
2. add it to the matching collection or file in `public/admin/config.yml`
3. use it in the page
4. commit all three together
5. **after deploying, reload `/admin` before saving anything** — a browser
   holding the old config will drop the new field on the first save

Prefer `required: false` plus a sensible default in the schema. An editor
hitting a validation error they do not understand will edit the file some other
way, or give up.

## What the collections are for

| In the CMS | Files | Notes |
|---|---|---|
| **Agenda** | `src/content/agenda/` | Every event, past and future. The one collection editors spend real time in. |
| **Notícies** | `src/content/noticies/` | The two most recent show on the homepage. |
| **Galeria** | `src/content/galeria/` | Albums. Photos are uploads; anything that is not an uploaded path renders as a striped placeholder. |
| **Pàgines** | `src/content/pagines/` | A *file* collection, not a folder: one fixed form per page, so editors cannot create or delete pages. Includes the per-page header images and intro texts ("Capçalera: …"). |
| **Junta Directiva / Tècnica** | `src/content/junta-*/` | One entry per season, numbered; the number is rendered as a Roman ordinal. |
| **Merchandising** | `src/content/productes/` | Sizes and stock per product. |
| **Patrocinadors**, **Activitats**, **Documents** | | Sponsor logos, the social calendar shown on the homepage, and PDFs. |
| **Configuració** | `src/content/configuracio/general.md` | Social URLs, the Google Calendar URL, the default header image, the SEO description. |

Uploads go to `public/images/uploads` and are referenced as
`/images/uploads/…`; `mediaUrl()` prefixes the base path at render time, so a
stored path never contains it.

## The agenda list

With 284 entries and Catalan field names, the default Decap list was unusable —
it only infers sorting for fields called `title`, `date`, `author` or
`description`. So the agenda collection declares its own:

- `summary: "{{data}} · {{nom}}"` so each row reads as a date and a name
- `sortable_fields: [data, nom, tipus]`
- `view_groups`: by **Any** (a `\d{4}` pattern over `data`) and by **Tipus**
- `view_filters`: Actuacions, Diades, Assajos, and entries with an observació

If an editor says they cannot find a diada, that list is where to look.

## Fields the editor should leave alone

Three agenda fields belong to the machine, and their hints say so:

- **`calendarUid`** — the join key the nightly import matches on. Changing it
  duplicates the event.
- **`notacioOriginal`** — the castells as the old registre wrote them.
- `nom`, `data`, `hora`, `lloc` — editable, but the nightly import overwrites
  them from Google Calendar. The calendar is where to change them.

Everything else on an agenda entry is the editor's and is never touched by the
importer. See [architecture.md](architecture.md#the-calendar-importer).

## Writing hints

The hints are the documentation for people who will never read this file, so
they are worth as much care as the code:

- say what the field *does on the page*, not what type it is
- give the default when there is one ("Per defecte: 'Vine a assajar'")
- say when a field is read somewhere else — the assaig blocks on Uneix-te are
  also shown on La colla and on Xorimúsics, and an editor cannot guess that
- keep them in Catalan, like everything else an editor sees

When you change how a field is used, change its hint in the same commit. Three
hints in this file were describing an arrangement the site had grown out of.
