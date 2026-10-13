import { describe, expect, it } from 'vitest';
import { parseCastells, parseCsv, parseHistorial } from './registre-csv';

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

describe('parseCastells', () => {
  it('raises a vano as the three pilars it is', () => {
    expect(parseCastells('vano5').map((c) => c.canonic)).toEqual(['pd5', '2pd4']);
    expect(parseCastells('van5').map((c) => c.canonic)).toEqual(['pd5', '2pd4']);
    expect(parseCastells('vanod3').map((c) => c.canonic)).toEqual(['pd3', '2pd2']);
  });

  it("carries the vano's outcome to both pilars", () => {
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
