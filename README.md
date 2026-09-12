# xoriguers-udg

Web de la colla castellera Xoriguers UdG. Astro + Decap CMS, com es descriu a [concept.md](concept.md).

## Provar-ho en local

```bash
npm install
npm run dev:all
```

Això aixeca dues coses alhora:

- La web pública a http://localhost:4321
- El proxy de Decap CMS (`decap-server`) al port 8081, que permet editar contingut a http://localhost:4321/admin sense necessitar GitHub, DecapBridge ni cap compte — llegeix i escriu directament als fitxers del repositori local.

Si prefereixes dos terminals separats: `npm run dev` en un i `npm run cms` en l'altre.

El contingut viu a `src/content/` (agenda, castells, notícies, galeria) i es pot editar tant a mà com des de `/admin`. Les dades actuals són fictícies, pensades per provar el flux esborrany → revisió → publicat.