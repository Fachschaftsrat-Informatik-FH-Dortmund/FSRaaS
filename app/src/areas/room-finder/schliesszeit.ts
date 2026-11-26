import { logDatenhinweis } from '@/errors/AppError';

// Gebäudeschließzeit eines kuratierten Raums (Requirement „Gepflegte
// Gebäudeschließzeit statt fester Wert"). Das Feld ist im Vertrag ein freier
// String aus der Verwaltungsoberfläche; gelesen werden `HH:MM`, `HH.MM` und
// `HHMM`. Ein unlesbarer Wert wird protokolliert (SEC-F-060) und wie eine
// fehlende Schließzeit behandelt — die App setzt nie einen eigenen Wert ein.

const MUSTER = /^(\d{1,2})[:.]?(\d{2})$/;

/** Minuten seit Mitternacht, oder `null` ohne gepflegte bzw. lesbare Schließzeit. */
export function schliesszeitMinuten(wert: string | null | undefined): number | null {
  if (wert === null || wert === undefined || wert.trim() === '') return null;
  const treffer = MUSTER.exec(wert.trim());
  if (treffer) {
    const stunden = Number(treffer[1]);
    const minuten = Number(treffer[2]);
    if (stunden <= 24 && minuten < 60 && stunden * 60 + minuten <= 24 * 60) return stunden * 60 + minuten;
  }
  logDatenhinweis('raum.schliesszeit', 'unlesbare Schließzeit', 1);
  return null;
}

/** Schließzeitpunkt am Kalendertag (Ortszeit des Geräts) von `bezug`, oder `null`. */
export function schliesszeitAm(wert: string | null | undefined, bezug: Date): Date | null {
  const minuten = schliesszeitMinuten(wert);
  if (minuten === null) return null;
  const tag = new Date(bezug);
  tag.setHours(Math.floor(minuten / 60), minuten % 60, 0, 0);
  return tag;
}
