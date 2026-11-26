import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';
import type { Meldung } from './api';

// Angepinnte Meldungen (Requirements „Anpinnen und Ablösen einzelner Meldungen",
// „Dauerhafte Anzeige angepinnter Meldungen", DATA-F-060). Rein gerätelokal: der
// Server erfährt nie, was angepinnt ist. Je Meldung liegt eine Kopie vor, damit
// sie unabhängig von ihrem Alter, offline und nach einem Neustart oben steht
// (Change `news-redaktion`, design.md D4). Eine zurückgezogene Meldung wird nur
// gekennzeichnet, nicht stillschweigend entfernt (Requirement „Entfernen
// zurückgezogener Meldungen aus der Liste").

const KEY = 'news.angepinnt';

export interface AngepinnteMeldung {
  meldung: Meldung;
  angepinntAm: string;
  zurueckgezogen: boolean;
}

/**
 * Gleicht die Kopien mit dem geladenen Bestand ab: eine Meldung, die in einer
 * geladenen Seite auftaucht, wird aufgefrischt und gilt als nicht zurückgezogen;
 * eine, deren Kennung unter `zurueckgezogen` steht, wird als zurückgezogen
 * gekennzeichnet. Liefert dieselbe Referenz, wenn sich nichts ändert.
 */
export function abgleichen(
  pins: readonly AngepinnteMeldung[],
  meldungen: readonly Meldung[],
  zurueckgezogen: readonly string[],
): readonly AngepinnteMeldung[] {
  if (pins.length === 0) return pins;
  const geladen = new Map(meldungen.map((m) => [m.id, m]));
  const weg = new Set(zurueckgezogen);
  let geaendert = false;
  const neu = pins.map((p) => {
    const aktuell = geladen.get(p.meldung.id);
    if (aktuell) {
      if (!p.zurueckgezogen && gleich(aktuell, p.meldung)) return p;
      geaendert = true;
      return { ...p, meldung: aktuell, zurueckgezogen: false };
    }
    if (weg.has(p.meldung.id) && !p.zurueckgezogen) {
      geaendert = true;
      return { ...p, zurueckgezogen: true };
    }
    return p;
  });
  return geaendert ? neu : pins;
}

function gleich(a: Meldung, b: Meldung): boolean {
  return (
    a.titel === b.titel &&
    a.text === b.text &&
    a.veroeffentlichtAm === b.veroeffentlichtAm &&
    a.klassifizierung === b.klassifizierung &&
    a.quelle === b.quelle
  );
}

const zeitwert = (iso: string | null | undefined) => {
  const ms = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(ms) ? -Infinity : ms;
};

/** Absteigend nach Veröffentlichungszeitpunkt; ohne lesbaren Zeitpunkt zuletzt. */
export function chronologisch<T>(liste: readonly T[], zeit: (x: T) => string | null | undefined): T[] {
  return [...liste].sort((a, b) => zeitwert(zeit(b)) - zeitwert(zeit(a)));
}

/**
 * Ordnung der Liste: angepinnte Meldungen oben, unabhängig vom Alter; darunter
 * die übrigen ohne die angepinnten, damit nichts doppelt erscheint.
 */
export function ordnen(
  meldungen: readonly Meldung[],
  pins: readonly AngepinnteMeldung[],
): { angepinnt: AngepinnteMeldung[]; uebrige: Meldung[] } {
  const ids = new Set(pins.map((p) => p.meldung.id));
  return {
    angepinnt: chronologisch(pins, (p) => p.meldung.veroeffentlichtAm),
    uebrige: chronologisch(
      meldungen.filter((m) => !ids.has(m.id)),
      (m) => m.veroeffentlichtAm,
    ),
  };
}

export function umschalten(
  pins: readonly AngepinnteMeldung[],
  meldung: Meldung,
  jetzt: Date = new Date(),
): AngepinnteMeldung[] {
  return pins.some((p) => p.meldung.id === meldung.id)
    ? pins.filter((p) => p.meldung.id !== meldung.id)
    : [...pins, { meldung, angepinntAm: jetzt.toISOString(), zurueckgezogen: false }];
}

// ------------------------------------------------------------------ Ablage
// Ein gemeinsamer Stand für Liste und Detailansicht: Anpinnen in der einen ist
// in der anderen sofort sichtbar.

let stand: readonly AngepinnteMeldung[] = [];
let geladen = false;
let laden: Promise<void> | null = null;
const hoerer = new Set<() => void>();

function setzen(neu: readonly AngepinnteMeldung[]) {
  if (neu === stand) return;
  stand = neu;
  hoerer.forEach((h) => h());
  writeJson(KEY, neu).catch((error) => logError('news.angepinnt.save', error));
}

function sicherstellenGeladen(): Promise<void> {
  if (geladen) return Promise.resolve();
  laden ??= readJson<AngepinnteMeldung[]>(KEY, [])
    .then((gelesen) => {
      // Erst nach dem Lesen anpinnen lassen hätte das Antippen kurz wirkungslos
      // gemacht; ein vor dem Lesen gesetzter Stand wird mit dem gelesenen vereinigt.
      const vorher = stand;
      const ids = new Set(vorher.map((p) => p.meldung.id));
      stand = [...vorher, ...gelesen.filter((p) => !ids.has(p.meldung.id))];
      geladen = true;
      hoerer.forEach((h) => h());
      if (vorher.length > 0) {
        writeJson(KEY, stand).catch((error) => logError('news.angepinnt.save', error));
      }
    })
    .catch((error) => {
      logError('news.angepinnt.load', error);
      geladen = true;
    });
  return laden;
}

function abonnieren(h: () => void) {
  hoerer.add(h);
  void sicherstellenGeladen();
  return () => {
    hoerer.delete(h);
  };
}

/** Nur für Tests: setzt die gemeinsame Ablage zurück. */
export function _zuruecksetzenFuerTests() {
  stand = [];
  geladen = false;
  laden = null;
  hoerer.clear();
}

/** Liest die gespeicherte Liste (Neustart-Fall). */
export function angepinnteLesen(): Promise<AngepinnteMeldung[]> {
  return readJson<AngepinnteMeldung[]>(KEY, []);
}

export function useAngepinnt() {
  const pins = useSyncExternalStore(abonnieren, () => stand, () => stand);

  const istAngepinnt = useCallback(
    (id: string) => pins.some((p) => p.meldung.id === id),
    [pins],
  );
  const pinUmschalten = useCallback((meldung: Meldung) => setzen(umschalten(stand, meldung)), []);
  const loesen = useCallback(
    (id: string) => setzen(stand.filter((p) => p.meldung.id !== id)),
    [],
  );
  const mitBestandAbgleichen = useCallback(
    (meldungen: readonly Meldung[], zurueckgezogen: readonly string[]) => {
      if (!geladen) return;
      setzen(abgleichen(stand, meldungen, zurueckgezogen));
    },
    [],
  );

  return { pins, istAngepinnt, umschalten: pinUmschalten, loesen, abgleichen: mitBestandAbgleichen };
}
