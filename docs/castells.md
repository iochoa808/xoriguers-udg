# Castells: notation, and how points are worked out

This is the domain knowledge behind [`src/lib/historial.ts`](../src/lib/historial.ts)
and the archive at `/castells`. If you are about to change how a castell is
read or scored, read this first — most of it came from the colla and cannot be
recovered from the code alone.

## How a castell is written

A castell is **how many people per floor, by how many floors**: `4d7` is a
*quatre de set*, four columns of people, seven floors high. The site stores
whatever an editor typed and derives a **canonical** form from it, so that `4/7`
typed in 2003 and `4d7` typed today count as the same castell.

```
   2 d 7 f c
   │ │ │ │ └── outcome: carregat
   │ │ │ └──── structure: folre
   │ │ └────── floors
   │ └──────── separator
   └────────── people per floor
```

| Piece | Means |
|---|---|
| `4d7`, `3d6`, `2d8` | the ordinary form: base de 4, de 3, de 2 |
| `pd4` | a **pilar**, a single column. `p` in place of the base |
| `2pd4` | **two** pilars de 4 raised at once. A leading number multiplies |
| `4/7`, `p/4` | the old way of writing the separator. Read as `4d7`, `pd4` |
| `6ors5` | a *sis de cinc*: a non-traditional build the colla writes this way on purpose, so `ors` is kept and it stays a different castell from `6d5` |
| `f`, `m`, `a` / `g` | **folre**, **manilles**, **agulla** — reinforcements and the pilar inside. Part of the castell's identity: `3d8f` and `3d8` are not the same thing |
| `fig` / `figuereta` | a figuereta on top. Can go on a `2dX`. Kept as a suffix: `2d6fig` |
| `aco`, `net`, `ps`, `cam`, `sim`, `fem`, `dol` | old notes about how it was done. Recorded, then dropped — they do not change which castell it was |

### How it went

Every castell has one of three outcomes, and the archive always writes it out
rather than relying on colour alone:

| | Written | Means |
|---|---|---|
| **descarregat** | `4d7` | up and down again — complete |
| **carregat** | `4d7c` | the enxaneta crowned it, but it came down badly |
| **intent** | `4d7i` | attempted, never crowned |

The registre wrote intents several ways — a leading `i` or `id` (`i3d7`,
`id4d7`), a trailing `i` or `id` (`3d6i`, `2/5id`) — and a carregat as a trailing
`c` or a note in brackets (`pd5(c)`). All of them are understood.

`notacioAmbEstat()` builds the displayed form from the *canonical* name, not from
what was typed, so a marker can never end up doubled (`2d7fc` stays `2d7fc`, not
`2d7fcc`).

### Vanos

A **vano** is three pilars raised together: one de N flanked by two de N−1. So a
*vano de 5* is `pd5` + `2pd4`, counted as two records.

This expansion lives in `registre-csv.ts`, because the spreadsheet wrote vanos
as single tokens (`vano5`, `van5`, `vano de 4`). **A vano typed into the CMS
today is not expanded** — it would be stored verbatim and scored zero. Enter the
pilars separately, or teach `llegeixCastellsRegistrats` to expand them (note
that the diada page pairs stored castells with parsed ones by index, so that
change is not a one-liner).

## Points

`/castells` scores each diada so they can be ranked against one another.

**The official half** comes from the Concurs de Castells de Tarragona table, and
is not ours to change: `3d8f` 970, `2d8f` 1210, `5d7` 565, `4d7` 395, `2d6` 300,
and so on down to Grup 0.

**The provisional half** is everything below where the concurs stops ranking
(`2d6`, `pd5`). The concurs simply does not score a `3d6` or a `pd4`, and the
colla does plenty of both, so the values in `PROVISIONAL` are the colla's own
working scale. They are **still waiting on the colla's sign-off** — the two maps
are kept separate in the code precisely so it stays obvious which numbers are
authoritative.

The rules on top:

- a **carregat** is worth 82% of the descarregat, rounded — the ratio the
  concurs table itself uses
- an **intent** is worth nothing
- `2pd4` is worth twice `pd4`: the multiplier multiplies
- a **figuereta** scores as the castell underneath it. It has no agreed value of
  its own, and scoring it as zero would have cost one diada 300 points for a
  castell it actually completed
- anything unrecognised scores **zero** rather than a guess. `6ors5` scores zero
  today for exactly this reason

## Gammes

The resum històric groups castells into bands, in this order, each castell
falling into the first band that claims it:

1. Castells de 8
2. Gamma alta de 7 — a `2`, `5`, `7` or `9` base, or anything with agulla
3. Castells de 7
4. Gamma alta de 6
5. Castells de 6
6. Castells de 5 i de 4
7. Pilars

## Reading the old spreadsheet

Only relevant if you ever re-run the migration. [`registre-csv.ts`](../src/lib/registre-csv.ts)
carries two quirks worth knowing about, both of which bit:

- **A lone `i` is the Catalan "and", not an intent.** The registre wrote
  `2d6 i p5` meaning "a 2d6 and a pilar de 5". Reading that `i` as an intent
  recorded a completed castell as a failure. Only `id` sets an intent.
- **A bare word attaches to the castell before it.** `3/5 aco net` and `4d7 c`
  are one castell each, written across several tokens.
- Dates mix `DD/MM/YYYY` (recent) with `MM/DD/YYYY` (up to 2013-14). Seasons
  appear as contiguous blocks, so each season's unambiguous rows decide how to
  read its ambiguous ones, and a season with no evidence follows its neighbour.

The figuereta is stripped from the suffix **before** folre and agulla are looked
for, or the `f` and the `g` of "fig" get read as a folre and an agulla.
