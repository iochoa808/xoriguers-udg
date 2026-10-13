# Open questions

Things that need a decision from the colla, or content that is still
scaffolding. Nothing here is a bug in the code; it is all "somebody has to tell
us". Last reviewed **13 October 2026**.

## Needs an answer from the colla

**The provisional points scale.** `/castells` ranks diades by points. The
official Concurs de Castells values stop at Grup 0 (`2d6`, `pd5`), and the colla
does plenty below that line, so `PROVISIONAL` in
[`src/lib/historial.ts`](../src/lib/historial.ts) is our own scale and has never
been approved. Until it is, the archive's rankings below Grup 0 are indicative.
A consequence: `6ors5` — the *sis de cinc* — scores **zero**, because inventing
a number for a non-traditional build seemed worse than showing none.

**Is a *vano de 3* `pd3` + `2pd2`?** The rule "one de N flanked by two de N−1"
came from the colla for a *vano de 5*. Applying it to a vano de 3 is an
extrapolation, and `2pd2` looks odd. Two historical entries depend on it.

**Four rows of the registre were never migrated.** Their dates were unusable or
impossible (one was typed `3022`), and one of them — an `Actuació RESA` — has
five castells recorded. Guessing a date would have put invented facts into the
colla's permanent record, so they were left out. Somebody who was there could
date them, and then they can be added through `/admin` like any other diada. The
spreadsheet is at `git show 2c57ebc:src/data/historial_castells.csv`.

**The contact address.** `src/content/pagines/la-colla.md` said
`xoriguers.ufg@gmail.com`, which looks like `udg` typed wrong, and has been
corrected to `xoriguers.udg@gmail.com`. **Please confirm** — and note that the
old site also used `xoriguers@udg.cat` in places. One of the two should win.

**Which days do the músics assagen?** The site says Tuesdays and Thursdays at
19:30 in barracó M-25 (`src/content/pagines/uneix-te.md`). The old site said
Wednesdays and Thursdays at the colla's own local. Whichever is right, it is now
written in exactly one place and shown on Uneix-te, La colla and Xorimúsics.

**The YouTube channel.** `youtubeUrl` in Configuració is still the placeholder
`[URL DEL CANAL DE YOUTUBE]`. The footer link is hidden while it looks like
that, so nothing is broken — but nothing links to YouTube either.

## Content still to replace

**`src/content/patrocinadors/patrocinador-1.md`** is an empty form: its name is
literally `[Nom del patrocinador]`, and it renders on `/col-laboradors` as a
card with that text in it. Either fill it in or delete the file.

**The two galeria albums** (`assaig-de-tardor`, `diada-de-tardor`) have
`fotos: ["placeholder-1", …]` rather than real uploads, so they render as
striped placeholder tiles. They are there to show the layout works.

**The notícia about the first 3d8f** is dated 2 days *before* the diada it
describes (the notícia is 12 May 2026, the Diada primavera with the `3d8f` is
14 May 2026) and is written in the past tense. The castell itself is real and in
the record. The date wants fixing by someone who knows which it should be.

**"Assajos setmanals al Pavelló UdG"**, in the other notícia, does not match any
venue the site now lists (Politècnica, barracó M-25, facultat de Dret when it
rains, the Marrecs' local).

**The old site** at <https://www.xoriguers-udg.com/> still holds material that
has not been brought over. What has been brought over is the season shape, the
credits course, the footer details and the benvinguda document.

## Known limitations, accepted for now

**A vano typed in the CMS is not expanded.** `vano5` entered as a castell today
is stored verbatim and scores zero; the expansion only runs in the spreadsheet
migration. Enter the pilars separately. See
[castells.md](castells.md#vanos) for why the fix is not a one-liner.

**`cccc` is stored but never shown.** Two entries from 2011-12 carry the flag
from the registre. It is kept as data; no page displays it.

**A galeria album cannot be linked to a diada.** They are separate collections
with no field joining them, so a diada's page cannot show its album. It would
need a new field on one side or the other.

**`benvinguda-a-la-colla-xoriguera.pdf` is 19 MB** and is in git history, so
every clone pays for it. Replacing the file with a lighter export helps new
clones only if the history is rewritten too, which is not worth it for this
repo — but do not add more PDFs that size.

**The site's default header image is `images.jpg`.** It is a real photo doing a
real job under an unhelpful name. Renaming it means updating the Configuració
entry and anything else pointing at it.
