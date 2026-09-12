Es vol fer una página web per la colla castellera xoriguers de la udg.
Ara que ja tenim decidit **GitHub Pages + Astro + Decap CMS + DecapBridge**, jo ho plantejaria com un petit sistema editorial per a la colla, no simplement com una web estàtica.

La idea important és aquesta:

> **La persona de comunicació no ha de saber que existeix GitHub.**
> Ella entra a `/admin`, edita contingut amb formularis i prem «Publicar». La resta ho fa automàticament el sistema.

Decap funciona precisament com una capa visual sobre el repositori Git: el contingut queda guardat com a fitxers al repositori, mentre que el CMS proporciona la interfície d'edició. ([Decap CMS][1])

---

# 1. Visió general de l'arquitectura

Jo faria aquesta arquitectura:

```text
                         ┌─────────────────────┐
                         │       USUARI        │
                         │                     │
                         │ www.collacastellera │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    GITHUB PAGES     │
                         │                     │
                         │     Web pública     │
                         └──────────┬──────────┘
                                    │
                                    │ genera
                                    ▼
                         ┌─────────────────────┐
                         │        ASTRO        │
                         │                     │
                         │  Plantilles + dades │
                         └──────────┬──────────┘
                                    │
                                    │ llegeix
                                    ▼
                         ┌─────────────────────┐
                         │   GITHUB REPO       │
                         │                     │
                         │ /src                │
                         │ /content            │
                         │ /public             │
                         └──────────▲──────────┘
                                    │
                           escriu / llegeix
                                    │
                         ┌──────────┴──────────┐
                         │     DECAP CMS       │
                         │                     │
                         │      /admin         │
                         └──────────▲──────────┘
                                    │
                             autenticació
                                    │
                         ┌──────────┴──────────┐
                         │    DECAPBRIDGE      │
                         │                     │
                         │ usuaris + permisos │
                         └─────────────────────┘
```

I hi hauria una segona via:

```text
Instagram
    │
    ├──────────────► Instagram de la colla
    │
    └──────────────► Web (feed / enllaços / contingut seleccionat)
```

**Instagram i la web no haurien de ser el mateix sistema.**

Instagram és el canal social i immediat.

La web és **l'arxiu oficial i permanent de la colla**.

---

# 2. Què hi ha realment dins de GitHub?

El repositori seria la peça central.

Per exemple:

```text
colla-web/
│
├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   │
│   └── content/
│       ├── agenda/
│       ├── noticies/
│       ├── castells/
│       ├── galeria/
│       └── historia/
│
├── public/
│   └── images/
│
├── admin/
│   ├── index.html
│   └── config.yml
│
├── astro.config.mjs
├── package.json
└── ...
```

La persona de comunicació **no toca mai aquests fitxers**.

Els veuria només la gent que mantingui tècnicament el projecte.

Decap transforma aquestes carpetes i fitxers en formularis. Les `collections` són precisament la manera com Decap defineix els diferents tipus de contingut que l'editor veurà al panell. ([Decap CMS][2])

---

# 3. Què veu un visitant normal?

El visitant entra a:

```text
www.collacastellera.cat
```

I **no sap ni li importa** que darrere hi hagi GitHub, Astro o Decap.

Veu:

### INICI

```text
┌─────────────────────────────────────────┐
│ LOGO                    AGENDA  LA COLLA │
│                         CASTELLS GALERIA │
├─────────────────────────────────────────┤
│                                         │
│       [ FOTO GRAN DE LA COLLA ]         │
│                                         │
│       FEM CASTELLS. FEM UNIVERSITAT.    │
│                                         │
│       [ VINE A ASSAJAR ]                │
│                                         │
├─────────────────────────────────────────┤
│ PROPERA ACTUACIÓ                        │
│                                         │
│  📅 25 OCT                              │
│  📍 Barcelona                            │
│  🏰 Diada castellera                    │
│                                         │
├─────────────────────────────────────────┤
│ ÚLTIMS CASTELLS                          │
│                                         │
│  3d7       4d7       2d6               │
│                                         │
├─────────────────────────────────────────┤
│ INSTAGRAM / ÚLTIMES FOTOS               │
└─────────────────────────────────────────┘
```

Tot això és generat per Astro a partir del contingut que hi ha al repositori.

---

# 4. Què passa quan arriba la persona de comunicació?

Aquesta persona va a:

```text
www.collacastellera.cat/admin
```

I troba una interfície de gestor de continguts.

Decap és una aplicació web que s'instal·la precisament en una ruta `/admin`. ([Decap CMS][3])

La seva experiència seria aproximadament:

```text
┌──────────────────────────────────────────┐
│  COLLA CASTELLERA                        │
│                                          │
│  CONTINGUT                               │
│                                          │
│  🏠 Pàgina principal                     │
│  📅 Agenda                               │
│  📰 Notícies                             │
│  🏰 Castells                             │
│  📷 Galeria                              │
│  📖 Història                             │
│  👥 La colla                             │
│                                          │
│  ⚙ Configuració                          │
│                                          │
└──────────────────────────────────────────┘
```

I això és **l'únic que hauria de necessitar aprendre**.

---

# 5. Exemple: crear una actuació

La persona prem:

**Agenda → Nova actuació**

I apareix:

```text
NOVA ACTUACIÓ

Nom
[ Diada Universitària                 ]

Data
[ 25/10/2026 ]

Hora
[ 17:30 ]

Lloc
[ Plaça Major                        ]

Població
[ Barcelona                          ]

Descripció
[                                      ]
[                                      ]

Tipus
[ Actuació ▼ ]

Cartell
[ + Pujar imatge ]

Colles participants
[ + Afegir ]

□ Mostrar a portada

        [ DESAR ]    [ PUBLICAR ]
```

No ha de crear cap HTML.

No ha de tocar Markdown.

No ha de fer `git commit`.

No ha de fer `git push`.

No ha de fer cap deploy.

---

# 6. Què passa quan prem "Publicar"?

Aquí està la gràcia del sistema.

El flux seria:

```text
Comunicació
     │
     │ "Publicar"
     ▼
Decap CMS
     │
     │ guarda contingut
     ▼
GitHub
     │
     │ detecta canvi
     ▼
GitHub Actions
     │
     │ npm run build
     ▼
Astro
     │
     │ genera web estàtica
     ▼
GitHub Pages
     │
     ▼
🌍 WEB ACTUALITZADA
```

Decap pot guardar directament els canvis al repositori, o bé utilitzar el seu **Editorial Workflow** per treballar amb esborranys i aprovacions abans de publicar. ([Decap CMS][4])

---

# 7. Jo activaria l'Editorial Workflow

Això ens permet tenir tres estats:

```text
              ┌───────────┐
              │ ESBORRANY │
              └─────┬─────┘
                    │
                    ▼
              ┌───────────┐
              │  REVISIÓ  │
              └─────┬─────┘
                    │
                    ▼
              ┌───────────┐
              │ PUBLICAT  │
              └───────────┘
```

Per exemple:

La persona de comunicació prepara:

> **"Aquest dissabte actuem a la Diada de..."**

Ho guarda com a esborrany.

Una altra persona ho revisa.

Quan està correcte:

**Publicar**

I passa a la web.

Tècnicament, Decap implementa aquest sistema mitjançant branques i pull requests de GitHub, però la persona que edita ho veu com un flux editorial, no com Git. ([Decap CMS][4])

---

# 8. Els diferents tipus d'usuari

Aquí jo faria una distinció molt clara.

## 🟢 Visitant

És qualsevol persona que entra a la web.

Pot:

* veure la pàgina principal
* consultar l'agenda
* veure castells
* consultar la història
* veure fotografies
* llegir notícies
* veure informació de la colla
* consultar com venir a assajar
* anar a Instagram

**No pot modificar res.**

---

# 9. 🟡 Comunicació

Aquest és l'usuari més important.

És qui manté la web.

Entraria a:

```text
/admin
```

I tindria:

### Agenda

* crear actuació
* editar actuació
* cancel·lar actuació
* afegir cartell
* afegir crònica
* afegir fotos

### Notícies

* crear notícia
* editar notícia
* afegir fotografies
* publicar

### Galeria

* crear àlbum
* pujar fotos
* seleccionar portada
* associar-lo a una actuació

### Castells

* registrar un castell
* indicar plaça
* indicar data
* indicar actuació
* afegir foto/vídeo

### Pàgines

* modificar "La colla"
* modificar informació de contacte
* modificar FAQ
* etc.

---

# 10. 🔵 Administrador

Aquí posaria molt poca gent.

L'administrador és qui controla:

* usuaris
* permisos
* configuració
* integracions
* estructura del CMS

Amb DecapBridge, els usuaris poden ser convidats i gestionar-se des de la seva plataforma; els collaborators poden editar contingut, mentre que els administradors poden gestionar altres usuaris i permisos segons el pla. ([DecapBridge][5])

Per tant:

```text
ADMIN
  │
  ├── Comunicació 1
  ├── Comunicació 2
  └── Tècnic
```

I així, quan canviï la junta de la colla, **no cal tocar el codi de la web**.

---

# 11. Un punt molt important: les dades dels castells

Aquí faria una cosa una mica diferent.

No faria que comunicació escrivís:

> "Aquest any hem fet 12 tres de set..."

La informació dels castells seria **estructurada**.

Per exemple:

```yaml
data: 2026-09-20
actuacio: diada-universitaria
castell: 3d7
estat: descarregat
ronda: 2
```

I després la web calcula automàticament:

```text
CASTELLS 2026

3d7 ................ 8
4d7 ................ 5
2d7 ................ 3
5d7 ................ 1
```

I també:

```text
CASTELL MÉS ALT

🏆 4d8

PRIMER 4d8
12 maig 2026
```

Això ens permetrà fer una web molt més interessant sense obligar comunicació a mantenir manualment les estadístiques.

---

# 12. Agenda → crònica → fotos → castells

Aquí podem fer que les dades estiguin relacionades.

Per exemple:

```text
ACTUACIÓ
"Diada Universitària 2026"
        │
        ├── 📅 Data
        ├── 📍 Lloc
        │
        ├── 🏰 Castells
        │      ├── 3d7
        │      ├── 4d7
        │      └── 2d6
        │
        ├── 📝 Crònica
        │
        ├── 📷 Galeria
        │
        └── 🎥 Vídeo
```

Això és important perquè **una mateixa informació només s'ha d'introduir una vegada**.

La pàgina de l'actuació pot mostrar-la.

L'agenda pot mostrar-la.

La pàgina de castells pot utilitzar-la.

Les estadístiques poden calcular-la.

---

# 13. Galeria

La persona de comunicació podria tenir:

```text
GALERIA

[ + NOU ÀLBUM ]

2026
────────────────────────

📷 Diada Universitària
25/10/2026
126 fotografies

📷 Assaig de tardor
18/10/2026
74 fotografies

📷 Diada de Primavera
14/05/2026
183 fotografies
```

Quan entra a un àlbum:

```text
DIADA UNIVERSITÀRIA

[ + AFEGIR FOTOS ]

┌────┐ ┌────┐ ┌────┐
│ 📷 │ │ 📷 │ │ 📷 │
└────┘ └────┘ └────┘
┌────┐ ┌────┐ ┌────┐
│ 📷 │ │ 📷 │ │ 📷 │
└────┘ └────┘ └────┘
```

Decap permet pujar fitxers des del CMS i configurar on s'emmagatzemen dins del repositori. ([Decap CMS][2])

---

# 14. Instagram

Aquí faria una separació molt clara.

## Instagram

Serveix per:

* actualitat
* vídeos
* reels
* stories
* interacció
* captar gent

## Web

Serveix per:

* informació oficial
* agenda
* història
* estadístiques
* arxiu fotogràfic
* cròniques
* captació de nous castellers

Per exemple, a la portada:

```text
SEGUEIX-NOS

[ Instagram ]

@nomcolla

[ veure Instagram ]
```

I opcionalment podem mostrar els últims posts.

Però **mai faria que si Instagram cau la web deixi de funcionar**.

---

# 15. I què passa amb els anys?

Aquesta arquitectura té un avantatge enorme per una colla universitària.

Imagineu:

```text
2026
     ├── Agenda
     ├── Castells
     ├── Galeria
     └── Notícies

2027
     ├── Agenda
     ├── Castells
     ├── Galeria
     └── Notícies

2028
     ├── Agenda
     ├── Castells
     ├── Galeria
     └── Notícies
```

La web es converteix progressivament en **l'arxiu històric de la colla**.

I quan canviï la persona de comunicació, no perdrem l'historial.

---

# 16. Una altra decisió que prendria: separar "codi" i "contingut"

A GitHub hi hauria conceptualment dues coses:

```text
             GITHUB
                │
       ┌────────┴────────┐
       │                 │
     CODI             CONTINGUT
       │                 │
   Astro/CSS/JS      Agenda
   components        Notícies
   plantilles        Castells
   funcionalitats    Galeria
```

La persona tècnica toca:

```text
CODI
```

La persona de comunicació toca:

```text
CONTINGUT
```

Aquesta separació és **clau per al manteniment a llarg termini**.

---

# 17. Qui fa què?

| Tasca                  | Visitant | Comunicació | Admin | Desenvolupador |
| ---------------------- | :------: | :---------: | :---: | :------------: |
| Veure web              |     ✅    |      ✅      |   ✅   |        ✅       |
| Veure agenda           |     ✅    |      ✅      |   ✅   |        ✅       |
| Crear actuació         |     ❌    |      ✅      |   ✅   |       ⚙️       |
| Crear notícia          |     ❌    |      ✅      |   ✅   |       ⚙️       |
| Pujar fotos            |     ❌    |      ✅      |   ✅   |       ⚙️       |
| Registrar castell      |     ❌    |      ✅      |   ✅   |       ⚙️       |
| Publicar               |     ❌    |      ✅*     |   ✅   |       ⚙️       |
| Gestionar usuaris      |     ❌    |      ❌      |   ✅   |       ⚙️       |
| Canviar disseny        |     ❌    |      ❌      |   ❌   |        ✅       |
| Canviar estructura CMS |     ❌    |      ❌      |   ❌   |        ✅       |
| Modificar codi         |     ❌    |      ❌      |   ❌   |        ✅       |

* Podem fer que comunicació publiqui directament o que necessiti aprovació.

---

# 18. Què passa si demà desapareix DecapBridge?

Aquesta és una de les raons per les quals m'agrada aquesta arquitectura.

El contingut **no viu dins de DecapBridge**.

Viu a GitHub.

DecapBridge proporciona la capa d'autenticació/accés i la connexió amb Git, però el repositori continua sent la font del contingut. La seva arquitectura separa precisament autenticació, gestió de llocs i el seu Git Gateway. ([DecapBridge][6])

Per tant:

```text
DECABBRIDGE
     ↓
  desapareix
     ↓
CONTINGUT A GITHUB
     ↓
   continua
```

Podríem canviar posteriorment el sistema d'autenticació sense haver de reconstruir tota la web.

Això és especialment interessant per una **colla universitària**, perquè no volem construir una cosa que depengui completament d'una persona concreta.

---

# 19. El flux complet d'un dia normal

Imaginem que dissabte hi ha una actuació.

### Abans de l'actuació

Comunicació entra:

```text
/admin
   ↓
Agenda
   ↓
Diada Universitària
   ↓
Edita
```

Canvia l'hora.

**Publica.**

Uns minuts després:

```text
www.collacastellera.cat/agenda/diada-universitaria
```

ja mostra la nova informació.

---

### Durant l'actuació

Es fan:

```text
3d7
4d7
2d6
```

---

### Després

Comunicació entra:

```text
Agenda
  ↓
Diada Universitària
  ↓
Afegir crònica
  ↓
Afegir castells
  ↓
Afegir fotos
```

I publica.

Automàticament la web passa a tenir:

```text
ACTUACIÓ
   │
   ├── Crònica
   ├── Castells
   ├── Fotografies
   └── Estadístiques
```

I **no ha hagut d'editar cinc pàgines diferents**.

---

# 20. El resultat final

En resum, jo pensaria el projecte així:

```text
                    🌍 VISITANTS
                         │
                         ▼
                ┌─────────────────┐
                │   WEB PÚBLICA    │
                │                  │
                │      ASTRO       │
                └────────┬────────┘
                         │
                    llegeix
                         │
                         ▼
                ┌─────────────────┐
                │     GITHUB      │
                │                 │
                │  Codi + Dades   │
                └────────▲────────┘
                         │
                      escriu
                         │
                ┌────────┴────────┐
                │    DECAP CMS    │
                │                 │
                │     /admin      │
                └────────▲────────┘
                         │
                    login/users
                         │
                ┌────────┴────────┐
                │  DECAPBRIDGE    │
                └─────────────────┘
```

I la filosofia seria:

**Visitant → veu la web.**
**Comunicació → gestiona el contingut.**
**Administrador → gestiona usuaris.**
**Desenvolupador → manté el sistema.**

Això ens dona una web **gratuïta d'allotjament, ràpida, versionada, editable sense coneixements tècnics i amb el contingut sota control de la colla**, que és exactament el que buscaria per aquest projecte. Decap està pensat perquè l'editor treballi amb una interfície web mentre el contingut continua versionat al repositori Git. ([Decap CMS][7])

### El següent pas que faria

Abans de construir tota la web, faria un **MVP tècnic molt petit**:

```text
1. GitHub repo
2. Astro
3. GitHub Pages
4. Decap CMS
5. DecapBridge
6. /admin
7. Una "Actuació"
8. Una "Notícia"
9. Un "Àlbum"
10. Publicació automàtica
```

I el provaria amb **una persona de comunicació real**. Si aquesta persona pot fer *«crear actuació → pujar foto → publicar»* sense que ningú li expliqui GitHub, tenim validada l'arquitectura. A partir d'aquí ja construiria la resta de la web.

[1]: https://decapcms.org/docs/architecture/?utm_source=chatgpt.com "Architecture | Decap CMS | Open-Source Content Management System"
[2]: https://decapcms.org/docs/configuration-options/?utm_source=chatgpt.com "Configuration Options | Decap CMS | Open-Source Content Management System"
[3]: https://decapcms.org/docs/basic-steps/?utm_source=chatgpt.com "Basic Steps | Decap CMS | Open-Source Content Management System"
[4]: https://decapcms.org/docs/editorial-workflows/?utm_source=chatgpt.com "Editorial Workflows | Decap CMS | Open-Source Content Management System"
[5]: https://decapbridge.com/docs/getting-started?utm_source=chatgpt.com "Getting started — DecapBridge"
[6]: https://decapbridge.com/docs/architecture?utm_source=chatgpt.com "Architecture — DecapBridge"
[7]: https://decapcms.org/docs/intro/?utm_source=chatgpt.com "Decap CMS overview | Decap CMS | Open-Source Content Management System"
