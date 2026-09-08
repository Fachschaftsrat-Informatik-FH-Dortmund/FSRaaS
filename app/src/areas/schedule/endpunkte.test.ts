import { filtereEndpunktGruppen, gruppiereEndpunkte } from './endpunkte';
import type { FbwsStudiengang } from './fbwsClient';

function s(sname: string, name: string, po: string | null): FbwsStudiengang {
  return { sname, name, grades: ['0'], po };
}

// Der vollständige, verwertbare INT-001-Bestand vom 2026-09-08 (21 Einträge,
// integrations.md „Befund: Die Liste führt nicht nur Studiengänge"). `po` ist
// hier bereits durch `fbwsClient.holeStudiengaenge` vereinheitlicht — die
// Zeichenkette "NULL" (FemINF) kommt dort schon als `null` an.
const BESTAND_2026_09_08: FbwsStudiengang[] = [
  s('Blockwoche1', 'Blockwoche 1 (13.04.-17.04.2026)', null),
  s('Blockwoche2', 'Blockwoche 2 (18.05.-22.05.2026)', null),
  s('Blockwoche3', 'Blockwoche 3 (27.07.-31.07.2026)', null),
  s('DDPM', 'Master Digital Design (StgPO 2024)', '2024'),
  s('FemINF', 'FemINF (Tutorium für Studentinnen)', null),
  s('INDBDM', 'Informatik Dual VR Digitalisierungsmanagement StgPO 2022', '2022'),
  s('INDBNS', 'Informatik Dual VR Netztechnik und Systemintegration StgPO 2022', '2022'),
  s('INDBST', 'Informatik Dual VR Softwaretechnik StgPO 2022', '2022'),
  s('INPBDS', 'Bachelor Informatik (StgPO 2019), VR Data Science  ', '2019'),
  s('INPBPI', 'Bachelor Informatik (StgPO 2019), VR Praktische Inf. ', '2019'),
  s('INPBTI', 'Bachelor Informatik (StgPO 2019), VR Technische Inf. ', '2019'),
  s('INPM', 'Master Informatik (StgPO 2019)', '2019'),
  s('MIDB', 'Medizinische Informatik Dual (StgPO 2021)', '2021'),
  s('MIPB', 'Medizinische Inf. (StgPO 2019)', '2019'),
  s('MIPM', 'Master Medizinische Inf. (StgPO 2019)', '2019'),
  s('QDL', 'QDL', null),
  s('SMPB', 'Bachelorseminare', null),
  s('TUPB', 'Tutorien', null),
  s('WFPB', 'Bachelor Wahlpflichtfächer WPF', null),
  s('WIPB', 'Wirtschaftsinf. (StgPO 2018)', '2018'),
  s('WIPM', 'Master Wirtschaftsinf. (StgPO 2018)', '2018'),
];

function snamesJeGruppe(gruppen: ReturnType<typeof gruppiereEndpunkte>): Record<string, string[]> {
  const ergebnis: Record<string, string[]> = {};
  for (const g of gruppen) ergebnis[g.schluessel] = g.eintraege.map((e) => e.sname);
  return ergebnis;
}

describe('Gruppierung der Endpunkte in der Auswahl', () => {
  it('ordnet alle 21 verwertbaren Endpunkte des Bestands vom 2026-09-08 den acht Gruppen zu', () => {
    const gruppen = gruppiereEndpunkte(BESTAND_2026_09_08);
    const gesamt = gruppen.reduce((n, g) => n + g.eintraege.length, 0);
    expect(gesamt).toBe(21);

    const nach = snamesJeGruppe(gruppen);
    expect(nach.bachelor).toEqual(['WIPB', 'INPBDS', 'INPBPI', 'INPBTI', 'MIPB']);
    expect(nach.bachelorDual).toEqual(['MIDB', 'INDBDM', 'INDBNS', 'INDBST']);
    expect(nach.master).toEqual(['WIPM', 'INPM', 'MIPM', 'DDPM']);
    expect(nach.blockwoche).toEqual(['Blockwoche1', 'Blockwoche2', 'Blockwoche3']);
    expect(nach.seminar).toEqual(['SMPB']);
    expect(nach.tutorium?.sort()).toEqual(['FemINF', 'TUPB']);
    expect(nach.wahlpflicht).toEqual(['WFPB']);
    expect(nach.sonstige).toEqual(['QDL']);
  });

  it('führt FemINF (po: "NULL" laut Rohbestand, hier bereits als null geführt) in der Gruppe „Tutorien"', () => {
    const gruppen = gruppiereEndpunkte(BESTAND_2026_09_08);
    const tutorien = gruppen.find((g) => g.schluessel === 'tutorium');
    expect(tutorien?.eintraege.some((e) => e.sname === 'FemINF')).toBe(true);
  });

  it('trennt duale Bachelor-Studiengänge von den Präsenz-Bachelor-Studiengängen', () => {
    const gruppen = gruppiereEndpunkte(BESTAND_2026_09_08);
    const bachelor = gruppen.find((g) => g.schluessel === 'bachelor')!.eintraege.map((e) => e.sname);
    const dual = gruppen.find((g) => g.schluessel === 'bachelorDual')!.eintraege.map((e) => e.sname);
    expect(bachelor).not.toContain('INDBDM');
    expect(dual).not.toContain('INPBPI');
  });

  it('ordnet innerhalb einer Gruppe nach Prüfungsordnung und darunter alphabetisch', () => {
    const gruppen = gruppiereEndpunkte(BESTAND_2026_09_08);
    const master = gruppen.find((g) => g.schluessel === 'master')!.eintraege;
    // Prüfungsordnungen 2019 < 2019 < 2018 < 2024 als Zeichenketten sortiert:
    // "2018" < "2019" < "2024" — WIPM (2018) zuerst, dann INPM/MIPM (2019,
    // alphabetisch „Informatik" vor „Medizinische"), dann DDPM (2024).
    expect(master.map((e) => e.sname)).toEqual(['WIPM', 'INPM', 'MIPM', 'DDPM']);
  });
});

describe('Auffangkorb für nicht zuzuordnende Endpunkte', () => {
  it('stellt einen erfundenen Endpunkt ohne passendes Merkmal im Auffangkorb zur Auswahl, statt ihn auszulassen', () => {
    const erfunden = s('ZZXY', 'Sonderprogramm Robotik', null);
    const gruppen = gruppiereEndpunkte([...BESTAND_2026_09_08, erfunden]);
    const sonstige = gruppen.find((g) => g.schluessel === 'sonstige');
    expect(sonstige?.eintraege.map((e) => e.sname)).toContain('ZZXY');

    const gesamt = gruppen.reduce((n, g) => n + g.eintraege.length, 0);
    expect(gesamt).toBe(BESTAND_2026_09_08.length + 1);
  });
});

describe('Prüfungsordnung fehlt im Feld po', () => {
  it('leitet die Prüfungsordnung aus dem Klarnamen ab, wenn po fehlt (Gestalt der Rückfallliste, INT-008)', () => {
    // Die Rückfallliste des eigenen Backends liefert kein `po` — `api.ts`
    // setzt es dafür bereits auf `null` (design.md, Entscheidung 2).
    const rueckfallEintrag = s('INPBPI', 'Bachelor Informatik (StgPO 2019), VR Praktische Inf.', null);
    const gruppen = gruppiereEndpunkte([rueckfallEintrag]);
    expect(gruppen[0]!.eintraege[0]!.po).toBe('2019');
  });

  it('bleibt ohne Prüfungsordnung, wenn weder po noch der Klarname eine trägt', () => {
    const gruppen = gruppiereEndpunkte([s('QDL', 'QDL', null)]);
    expect(gruppen[0]!.eintraege[0]!.po).toBeNull();
  });
});

describe('Freitextsuche in der Endpunktauswahl', () => {
  it('findet einen Endpunkt über seinen Kurznamen', () => {
    const gruppen = gruppiereEndpunkte(BESTAND_2026_09_08);
    const gefiltert = filtereEndpunktGruppen(gruppen, 'inpbpi');
    const gefundene = gefiltert.flatMap((g) => g.eintraege.map((e) => e.sname));
    expect(gefundene).toEqual(['INPBPI']);
  });

  it('findet einen Endpunkt über seinen Klarnamen, diakritika- und großschreibungstolerant', () => {
    const gruppen = gruppiereEndpunkte(BESTAND_2026_09_08);
    const gefiltert = filtereEndpunktGruppen(gruppen, 'BLOCKWOCHE');
    const gefundene = gefiltert.flatMap((g) => g.eintraege.map((e) => e.sname));
    expect(gefundene).toEqual(['Blockwoche1', 'Blockwoche2', 'Blockwoche3']);
  });

  it('liefert bei leerem Suchtext alle Gruppen unverändert', () => {
    const gruppen = gruppiereEndpunkte(BESTAND_2026_09_08);
    expect(filtereEndpunktGruppen(gruppen, '')).toEqual(gruppen);
  });

  it('lässt eine Gruppe ganz aus dem Ergebnis, wenn kein Eintrag passt', () => {
    const gruppen = gruppiereEndpunkte(BESTAND_2026_09_08);
    const gefiltert = filtereEndpunktGruppen(gruppen, 'nichts passt hier');
    expect(gefiltert).toEqual([]);
  });
});
