import { teileEndzahl } from './namenskuerzung';

describe('Kürzung langer Veranstaltungsnamen unter Erhalt einer Endzahl', () => {
  it('trennt eine Endzahl vom Stamm, damit sie beim Kürzen erhalten bleibt', () => {
    expect(teileEndzahl('Mathematik für Informatiker 1')).toEqual({
      stamm: 'Mathematik für Informatiker',
      endzahl: '1',
    });
    expect(teileEndzahl('Mathematik für Informatiker 2')).toEqual({
      stamm: 'Mathematik für Informatiker',
      endzahl: '2',
    });
  });

  it('erkennt mehrstellige, direkt angehängte und gegliederte Endzahlen', () => {
    expect(teileEndzahl('Analysis 12')).toEqual({ stamm: 'Analysis', endzahl: '12' });
    expect(teileEndzahl('Mathe2')).toEqual({ stamm: 'Mathe', endzahl: '2' });
    expect(teileEndzahl('Web 2.0')).toEqual({ stamm: 'Web', endzahl: '2.0' });
  });

  it('liefert ohne Endzahl den ganzen Namen, der dann am Ende gekürzt wird', () => {
    expect(teileEndzahl('Grundlagen der Betriebssysteme')).toEqual({
      stamm: 'Grundlagen der Betriebssysteme',
      endzahl: null,
    });
  });

  it('wertet eine Zahl in der Mitte nicht als Endzahl', () => {
    expect(teileEndzahl('Web 2.0 Technologien')).toEqual({ stamm: 'Web 2.0 Technologien', endzahl: null });
  });

  it('lässt einen reinen Zahlnamen und römische Ziffern unzerlegt', () => {
    expect(teileEndzahl('2024')).toEqual({ stamm: '2024', endzahl: null });
    expect(teileEndzahl('Analysis II')).toEqual({ stamm: 'Analysis II', endzahl: null });
  });

  it('ignoriert Leerraum am Ende des Namens', () => {
    expect(teileEndzahl('Mathematik 1 ')).toEqual({ stamm: 'Mathematik', endzahl: '1' });
  });
});
