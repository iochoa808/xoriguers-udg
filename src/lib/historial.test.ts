import { describe, expect, it } from 'vitest';
import {
  millorEstat,
  normalitzaNom,
  notacioAmbEstat,
  parseCastell,
  parseCastells,
  parseCsv,
  parseHistorial,
  punts,
  puntsDiada,
  valorBase,
} from './historial';

describe('parseCsv', () => {
  it('keeps commas and doubled quotes inside quoted fields', () => {
    const rows = parseCsv('a,b\n"3d7, 2p4",«x»\n"diu ""hola""",z\n');
    expect(rows[1]).toEqual(['3d7, 2p4', '«x»']);
    expect(rows[2]).toEqual(['diu "hola"', 'z']);
  });

  it('drops fully blank lines', () => {
    expect(parseCsv('a,b\n\n,\nc,d\n')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });
});

describe('parseCastell', () => {
  it('reads modern notation', () => {
    expect(parseCastell('4d7')).toMatchObject({ canonic: '4d7', pisos: 7, pilar: false, estat: 'descarregat' });
    expect(parseCastell('pd4')).toMatchObject({ canonic: 'pd4', pisos: 4, pilar: true });
    expect(parseCastell('2pd4')).toMatchObject({ canonic: '2pd4', pisos: 4, pilar: true });
  });

  it('unifies old slash notation with the modern form', () => {
    expect(parseCastell('4/5')).toMatchObject({ canonic: '4d5', pisos: 5 });
    expect(parseCastell('p/4')).toMatchObject({ canonic: 'pd4', pilar: true });
    expect(parseCastell('3/5aco')).toMatchObject({ canonic: '3d5' });
    expect(parseCastell('4/5net')).toMatchObject({ canonic: '4d5' });
  });

  it('keeps folre and agulla as part of the castell', () => {
    expect(parseCastell('3d8f').canonic).toBe('3d8f');
    expect(parseCastell('2d7f').canonic).toBe('2d7f');
    expect(parseCastell('pd6f').canonic).toBe('pd6f');
    expect(parseCastell('4d7a').canonic).toBe('4d7a');
  });

  it('derives the estat from the outcome marker, not the structure', () => {
    expect(parseCastell('3d7c').estat).toBe('carregat');
    expect(parseCastell('2d7fc')).toMatchObject({ canonic: '2d7f', estat: 'carregat' });
    expect(parseCastell('pd5(c)')).toMatchObject({ canonic: 'pd5', estat: 'carregat' });
    expect(parseCastell('id4d7')).toMatchObject({ canonic: '4d7', estat: 'intent' });
    expect(parseCastell('i3d7a')).toMatchObject({ canonic: '3d7a', estat: 'intent' });
    expect(parseCastell('2/5id')).toMatchObject({ canonic: '2d5', estat: 'intent' });
  });

  it('returns null for prose', () => {
    expect(parseCastell('germanor')).toBeNull();
    expect(parseCastell('facultat')).toBeNull();
  });

  it('reads a figuereta without mistaking its f and g for folre and agulla', () => {
    expect(parseCastell('2d5fig')).toMatchObject({ canonic: '2d5fig', pisos: 5, estat: 'descarregat' });
    expect(parseCastell('2d6figuereta').canonic).toBe('2d6fig');
    expect(parseCastell('2d5figc')).toMatchObject({ canonic: '2d5fig', estat: 'carregat' });
  });

  it('keeps the ors spelling that marks a non-traditional build', () => {
    expect(parseCastell('6ors5')).toMatchObject({ canonic: '6ors5', pisos: 5, pilar: false });
    // a traditional sis de cinc stays a separate castell
    expect(parseCastell('6d5').canonic).toBe('6d5');
  });
});

describe('parseCastells', () => {
  it('raises a vano as the three pilars it is', () => {
    expect(parseCastells('vano5').map((c) => c.canonic)).toEqual(['pd5', '2pd4']);
    expect(parseCastells('van5').map((c) => c.canonic)).toEqual(['pd5', '2pd4']);
    expect(parseCastells('vanod3').map((c) => c.canonic)).toEqual(['pd3', '2pd2']);
  });

  it('carries the vano\'s outcome to both pilars', () => {
    expect(parseCastells('vano5c').map((c) => c.estat)).toEqual(['carregat', 'carregat']);
    expect(parseCastells('vano5').every((c) => c.estat === 'descarregat')).toBe(true);
  });

  it('passes anything else through as a single castell', () => {
    expect(parseCastells('4d7').map((c) => c.canonic)).toEqual(['4d7']);
    expect(parseCastells('germanor')).toEqual([]);
  });
});

describe('parseHistorial', () => {
  const csv = [
    'Data,Curs,Nom,Castells,CCCC,observacions',
    '28/05/2026,2025-2026,Diada primavera,pd4 3d6,,',
    '14/05/2026,2025-2026,Diada Xoriguers,3d8f 5d7,,COLLA DE VUIT',
    '12/21/2000,2000-2001,Diada hivern,"4/5a, 3/5net",yes,',
    '5/3/2001,2000-2001,Actuació,p/4ps,,',
  ].join('\n');

  const diades = parseHistorial(csv);

  it('reads every row and attaches its season', () => {
    expect(diades).toHaveLength(4);
    expect(diades[0].temporada).toBe('2025-2026');
    expect(diades[0].nom).toBe('Diada primavera');
  });

  it('reads recent rows as day/month', () => {
    expect(diades[0].data?.toISOString().slice(0, 10)).toBe('2026-05-28');
  });

  it('reads older rows as month/day, including ambiguous ones in the same season', () => {
    expect(diades[2].data?.toISOString().slice(0, 10)).toBe('2000-12-21');
    // 5/3/2001 sits in a MM/DD season, so it is 3 May and not 5 March
    expect(diades[3].data?.toISOString().slice(0, 10)).toBe('2001-05-03');
  });

  it('splits castells on commas as well as spaces', () => {
    expect(diades[2].castells.map((c) => c.canonic)).toEqual(['4d5a', '3d5']);
  });

  it('reads a vano written out in words', () => {
    const [d] = parseHistorial(
      'Data,Curs,Nom,Castells,CCCC,observacions\n29/11/2001,2001-2002,x,"p/4ps, 3/6aco, vano de 4",,'
    );
    expect(d.castells.map((c) => c.canonic)).toEqual(['pd4', '3d6', 'pd4', '2pd3']);
  });

  it('treats a lone "i" as the Catalan "and", not as an intent', () => {
    const [d] = parseHistorial(
      'Data,Curs,Nom,Castells,CCCC,observacions\n01/12/2011,2011-2012,x,"p4, 5d6, 4d7, 2d6 i p5",,'
    );
    expect(d.castells.map((c) => c.canonic)).toEqual(['pd4', '5d6', '4d7', '2d6', 'pd5']);
    expect(d.castells.every((c) => c.estat === 'descarregat')).toBe(true);
  });

  it('still reads written-out intents', () => {
    const [d] = parseHistorial(
      'Data,Curs,Nom,Castells,CCCC,observacions\n01/12/2011,2011-2012,x,id4d7 3d6i 2/5id,,'
    );
    expect(d.castells.map((c) => c.estat)).toEqual(['intent', 'intent', 'intent']);
  });

  it('carries the observacions and the CCCC flag', () => {
    expect(diades[1].observacio).toBe('COLLA DE VUIT');
    expect(diades[2].cccc).toBe(true);
    expect(diades[0].cccc).toBe(false);
  });
});

describe('puntuació', () => {
  it('uses the concurs value for a descarregat', () => {
    expect(punts({ canonic: '3d7', notacio: '3d7', pisos: 7, pilar: false, estat: 'descarregat' })).toBe(415);
  });

  it('scores a carregat at 82% and an intent at zero', () => {
    expect(punts({ canonic: '3d7', notacio: '3d7c', pisos: 7, pilar: false, estat: 'carregat' })).toBe(340);
    expect(punts({ canonic: '3d7', notacio: 'i3d7', pisos: 7, pilar: false, estat: 'intent' })).toBe(0);
  });

  it('multiplies pilars by how many went up at once', () => {
    expect(valorBase('pd4')).toBe(30);
    expect(valorBase('3pd4')).toBe(90);
  });

  it('scores a figuereta as the castell underneath it', () => {
    expect(valorBase('2d6fig')).toBe(valorBase('2d6'));
    expect(valorBase('2d5fig')).toBe(valorBase('2d5'));
  });

  it('gives a non-traditional build no invented value', () => {
    expect(valorBase('6ors5')).toBe(0);
  });

  it('adds up a whole diada', () => {
    const [diada] = parseHistorial(
      'Data,Curs,Nom,Castells,CCCC,observacions\n14/05/2026,2025-2026,x,3d7 4d7 pd4,,'
    );
    expect(puntsDiada(diada)).toBe(415 + 395 + 30);
  });
});

describe('notacioAmbEstat', () => {
  it('writes the outcome, so it does not rest on colour alone', () => {
    expect(notacioAmbEstat({ canonic: '4d7', estat: 'descarregat' })).toBe('4d7');
    expect(notacioAmbEstat({ canonic: '4d7', estat: 'carregat' })).toBe('4d7c');
    expect(notacioAmbEstat({ canonic: '4d7', estat: 'intent' })).toBe('4d7i');
  });

  it('never doubles a marker that the notation already carried', () => {
    const llegit = parseCastell('2d7fc');
    expect(llegit).toMatchObject({ canonic: '2d7f', estat: 'carregat' });
    expect(notacioAmbEstat(llegit)).toBe('2d7fc');
  });
});

describe('millorEstat', () => {
  it('ranks descarregat over carregat over intent', () => {
    expect(millorEstat(['intent', 'carregat', 'descarregat'])).toBe('descarregat');
    expect(millorEstat(['intent', 'carregat'])).toBe('carregat');
    expect(millorEstat(['intent'])).toBe('intent');
  });
});

describe('normalitzaNom', () => {
  it('groups the same diada across seasons', () => {
    expect(normalitzaNom('Diada hivern Xoriguers')).toBe('diada hivern xoriguers');
    expect(normalitzaNom('Aniverfest del XVIII')).toBe('aniverfest');
    expect(normalitzaNom('Aniverfest del 25è')).toBe('aniverfest');
    expect(normalitzaNom('Diada primavera 2024')).toBe('diada primavera');
  });
});
