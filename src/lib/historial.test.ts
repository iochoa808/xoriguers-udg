import { describe, expect, it } from 'vitest';
import {
  llegeixCastellsRegistrats,
  millorEstat,
  normalitzaNom,
  notacioAmbEstat,
  parseCastell,
  punts,
  puntsDiada,
  valorBase,
} from './historial';

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

describe('llegeixCastellsRegistrats', () => {
  it('canonicalises what an editor typed', () => {
    const llegits = llegeixCastellsRegistrats([
      { castell: '4/7', estat: 'descarregat' },
      { castell: '2d7fc', estat: 'carregat' },
    ]);
    expect(llegits.map((c) => c.canonic)).toEqual(['4d7', '2d7f']);
  });

  it('lets the recorded estat win over whatever the notation said', () => {
    // the estat is its own field, chosen by whoever wrote the diada up
    const [llegit] = llegeixCastellsRegistrats([{ castell: 'i3d7', estat: 'descarregat' }]);
    expect(llegit).toMatchObject({ canonic: '3d7', estat: 'descarregat' });
  });

  it('keeps something unparseable rather than dropping it', () => {
    const [llegit] = llegeixCastellsRegistrats([{ castell: 'pilar caminant', estat: 'intent' }]);
    expect(llegit).toMatchObject({ canonic: 'pilar caminant', pisos: 0, estat: 'intent' });
  });

  it('returns one record per castell, in order', () => {
    // the diada page pairs these up by index with what the CMS stored
    const entrada = [
      { castell: '3d6', estat: 'descarregat' as const },
      { castell: 'pd4', estat: 'carregat' as const },
    ];
    expect(llegeixCastellsRegistrats(entrada)).toHaveLength(entrada.length);
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
    const diada = {
      castells: llegeixCastellsRegistrats([
        { castell: '3d7', estat: 'descarregat' },
        { castell: '4d7', estat: 'descarregat' },
        { castell: 'pd4', estat: 'descarregat' },
      ]),
    };
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
