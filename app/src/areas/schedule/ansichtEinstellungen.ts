import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';
import type { Weekday } from './typen';

// Ansichtseinstellungen des Stundenplans (`openspec/specs/schedule/spec.md`
// Abschnitt 5): proportionale Zeitachse oder kompakte Liste (SCHED-F-530) und
// Sprung zum aktuellen Wochentag beim Öffnen (SCHED-F-150). Rein
// gerätelokal. Reaktiver Modul-Speicher wie `canteen/selection.ts`.
//
// Requirement, REMOVED „Schalter zum Ausblenden gruppenfremder Termine" und
// „Schalter zum Abschalten aller Filter" (entschieden 2026-09-08): Beide
// Schalter entfallen ersatzlos. Der Gültigkeitszeitraum gilt seither
// unbedingt (`wochenansicht.ts`), es gibt keine wirksamen Filter mehr, über
// die diese Ansicht Buch führen müsste.

const KEY = 'scheduleViewSettings';

export interface AnsichtEinstellungen {
  /** SCHED-F-520/530: `true` = proportionale Zeitachse (Vorgabe), `false` = kompakte Liste. */
  zeitachse: boolean;
  /** SCHED-F-150: beim Öffnen automatisch zum aktuellen Wochentag springen. */
  sprungZuHeute: boolean;
  /**
   * Requirement „Farbwahl je Termin": `true` (Vorgabe) — neu angelegte
   * Termine erhalten die automatisch vergebene Farbe (`farbe.ts`). `false`
   * schaltet nur die Vergabe für künftig angelegte Termine ab; bereits
   * gesetzte Farben — automatisch oder von Hand gewählt — bleiben davon
   * unberührt, es geht dadurch nie eine eigene Farbwahl verloren.
   */
  farbautomatik: boolean;
  /**
   * Requirement „Einblenden aller Veranstaltungen gewählter Module": `false`
   * (Vorgabe) — zusätzlich zu den eigenen Terminen auch die weiteren
   * Termine der gewählten Module anzeigen (`alternativen.ts`).
   */
  alternativenEinblenden: boolean;
}

const STANDARD: AnsichtEinstellungen = {
  zeitachse: true,
  sprungZuHeute: true,
  farbautomatik: true,
  alternativenEinblenden: false,
};

let snapshot: AnsichtEinstellungen = STANDARD;
let geladen = false;
let ladeGestartet = false;
const hoerer = new Set<() => void>();

function melden() {
  for (const h of hoerer) h();
}

/**
 * Requirement, REMOVED „Schalter zum Ausblenden gruppenfremder Termine" und
 * „Schalter zum Abschalten aller Filter": gespeicherte Altwerte
 * `gruppenfremdeAusblenden` und `alleAnzeigen` werden beim Laden verworfen,
 * statt in den zurückgegebenen Stand übernommen zu werden — dieselbe Stelle,
 * die schon zuvor jeden Wert einzeln gelesen hat.
 */
function bereinige(v: unknown): AnsichtEinstellungen {
  const roh = (v ?? {}) as Partial<Record<keyof AnsichtEinstellungen, unknown>>;
  const alsBoolean = (x: unknown, standard: boolean): boolean => (typeof x === 'boolean' ? x : standard);
  return {
    zeitachse: alsBoolean(roh.zeitachse, STANDARD.zeitachse),
    sprungZuHeute: alsBoolean(roh.sprungZuHeute, STANDARD.sprungZuHeute),
    farbautomatik: alsBoolean(roh.farbautomatik, STANDARD.farbautomatik),
    alternativenEinblenden: alsBoolean(roh.alternativenEinblenden, STANDARD.alternativenEinblenden),
  };
}

function subscribe(cb: () => void): () => void {
  hoerer.add(cb);
  if (!ladeGestartet) {
    ladeGestartet = true;
    readJson<AnsichtEinstellungen>(KEY, STANDARD)
      .then((v) => {
        snapshot = bereinige(v);
      })
      .catch((error) => logError('ansichtEinstellungen.load', error))
      .finally(() => {
        geladen = true;
        melden();
      });
  }
  return () => {
    hoerer.delete(cb);
  };
}

function schreiben(next: AnsichtEinstellungen) {
  snapshot = next;
  geladen = true;
  melden();
  writeJson(KEY, next).catch((error) => logError('ansichtEinstellungen.save', error));
}

export function readAnsichtEinstellungen(): Promise<AnsichtEinstellungen> {
  return readJson<AnsichtEinstellungen>(KEY, STANDARD).then(bereinige);
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetAnsichtEinstellungenForTest(): void {
  snapshot = STANDARD;
  geladen = false;
  ladeGestartet = false;
  hoerer.clear();
}

export function useAnsichtEinstellungen() {
  const einstellungen = useSyncExternalStore(subscribe, () => snapshot);
  const loaded = useSyncExternalStore(subscribe, () => geladen);

  const toggleZeitachse = useCallback(() => schreiben({ ...snapshot, zeitachse: !snapshot.zeitachse }), []);
  /** Requirement „Ansichts- und Verwaltungsblatt in der Kopfzeile", Szenario „Sprung zu heute umschalten". */
  const toggleSprungZuHeute = useCallback(
    () => schreiben({ ...snapshot, sprungZuHeute: !snapshot.sprungZuHeute }),
    [],
  );
  /** Requirement „Farbwahl je Termin": Farbautomatik im Ansichts-Blatt abschaltbar. */
  const toggleFarbautomatik = useCallback(
    () => schreiben({ ...snapshot, farbautomatik: !snapshot.farbautomatik }),
    [],
  );
  /** Requirement „Einblenden aller Veranstaltungen gewählter Module". */
  const toggleAlternativenEinblenden = useCallback(
    () => schreiben({ ...snapshot, alternativenEinblenden: !snapshot.alternativenEinblenden }),
    [],
  );

  return {
    einstellungen,
    loaded,
    toggleZeitachse,
    toggleSprungZuHeute,
    toggleFarbautomatik,
    toggleAlternativenEinblenden,
  };
}

// Der zuletzt betrachtete Ausschnitt (Woche und Wochentag) liegt in einem
// eigenen Speicherschlüssel — Ansichtszustand, nicht Nutzerinhalt: im
// `planStore` abgelegt, markierte jedes Blättern den Plan als geändert
// (design.md, Entscheidung 4).

const KEY_ZULETZT = 'scheduleLastViewed';

export interface Ansichtsstand {
  /** Montag der betrachteten Woche als ISO-Datum `"YYYY-MM-DD"` (`wochenrechnung.ts`). */
  wochenanfang: string;
  wochentag: Weekday;
}

const WOCHENTAGE: readonly Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/;

function bereinigeStand(v: unknown): Ansichtsstand | null {
  if (typeof v !== 'object' || v === null) return null;
  const roh = v as Record<string, unknown>;
  if (typeof roh.wochenanfang !== 'string' || !ISO_DATUM.test(roh.wochenanfang)) return null;
  if (typeof roh.wochentag !== 'string' || !WOCHENTAGE.includes(roh.wochentag as Weekday)) return null;
  return { wochenanfang: roh.wochenanfang, wochentag: roh.wochentag as Weekday };
}

/**
 * Requirement „Sprung zum aktuellen Wochentag": Ist die Einstellung aktiv,
 * zeigt die App den aktuellen Wochentag. Ist sie abgeschaltet, kehrt sie zum
 * zuletzt betrachteten Stand zurück; liegt keiner vor, zeigt sie die laufende
 * Woche und den aktuellen Wochentag. Reine Funktion — der Ausweichtag am
 * Wochenende (`wochenrechnung.zielWochentagBeimOeffnen`) gilt laut Anforderung
 * allein beim automatischen Sprung und wird deshalb von der aufrufenden Stelle
 * auf `heute` angewandt, nicht auf den gespeicherten Stand.
 */
export function anfangsAnsicht(
  sprungZuHeute: boolean,
  zuletztBetrachtet: Ansichtsstand | null,
  heute: Ansichtsstand,
): Ansichtsstand {
  if (sprungZuHeute) return heute;
  return zuletztBetrachtet ?? heute;
}

let standSnapshot: Ansichtsstand | null = null;
let standGeladen = false;
let standLadeGestartet = false;
const standHoerer = new Set<() => void>();

function standMelden() {
  for (const h of standHoerer) h();
}

function standSubscribe(cb: () => void): () => void {
  standHoerer.add(cb);
  if (!standLadeGestartet) {
    standLadeGestartet = true;
    readJson<unknown>(KEY_ZULETZT, null)
      .then((v) => {
        standSnapshot = bereinigeStand(v);
      })
      .catch((error) => logError('ansichtEinstellungen.standLoad', error))
      .finally(() => {
        standGeladen = true;
        standMelden();
      });
  }
  return () => {
    standHoerer.delete(cb);
  };
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetAnsichtsstandForTest(): void {
  standSnapshot = null;
  standGeladen = false;
  standLadeGestartet = false;
  standHoerer.clear();
}

export function useAnsichtsstand() {
  const zuletztBetrachtet = useSyncExternalStore(standSubscribe, () => standSnapshot);
  const loaded = useSyncExternalStore(standSubscribe, () => standGeladen);

  const merkeStand = useCallback((stand: Ansichtsstand) => {
    standSnapshot = stand;
    standGeladen = true;
    standMelden();
    writeJson(KEY_ZULETZT, stand).catch((error) => logError('ansichtEinstellungen.standSave', error));
  }, []);

  return { zuletztBetrachtet, loaded, merkeStand };
}
