import { reineZusatzstoffe } from './gerichtsangaben';

describe('Gerichtsangaben — Kategorie, Bezeichnung, Preise, Zusatzstoffe', () => {
  it('rechnet Allergene aus den Zusatzstoffen heraus, damit kein Hinweis doppelt erscheint', () => {
    const g = { zusatzstoffe: ['Gluten', 'Nüsse', 'Farbstoff'], allergene: ['Gluten', 'Nüsse'] };
    expect(reineZusatzstoffe(g)).toEqual(['Farbstoff']);
  });

  it('lässt Zusatzstoffe unverändert, wenn keine Allergene geführt werden', () => {
    const g = { zusatzstoffe: ['Farbstoff'], allergene: [] };
    expect(reineZusatzstoffe(g)).toEqual(['Farbstoff']);
  });

  it('lässt Zusatzstoffe unverändert, wenn das Feld `allergene` fehlt', () => {
    const g = { zusatzstoffe: ['Farbstoff'] };
    expect(reineZusatzstoffe(g)).toEqual(['Farbstoff']);
  });

  it('liefert eine leere Liste ohne Zusatzstoffe', () => {
    expect(reineZusatzstoffe({})).toEqual([]);
  });
});
