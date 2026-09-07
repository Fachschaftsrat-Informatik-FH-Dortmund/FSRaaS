import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';
import type { Weekday } from './typen';

// Ansichtseinstellungen des Stundenplans (`openspec/specs/schedule/spec.md`
// Abschnitt 5): proportionale Zeitachse oder kompakte Liste (SCHED-F-530),
// gruppenfremde Termine ausblenden (SCHED-F-145), Sprung zum aktuellen
// Wochentag beim Öffnen (SCHED-F-150) und der Schalter, der sämtliche Filter
// der Wochenansicht auf einmal abschaltet. Rein gerätelokal. Reaktiver
// Modul-Speicher wie `canteen/selection.ts`.

const KEY = 'scheduleViewSettings';

export interface AnsichtEinstellungen {
  /** SCHED-F-520/530: `true` = proportionale Zeitachse (Vorgabe), `false` = kompakte Liste. */
  zeitachse: boolean;
  /** SCHED-F-145: gruppenfremde Termine ausblenden statt nur zu kennzeichnen (SCHED-F-140). */
  gruppenfremdeAusblenden: boolean;
  /** SCHED-F-150: beim Öffnen automatisch zum aktuellen Wochentag springen. */
  sprungZuHeute: boolean;
  /**
   * Requirement „Schalter zum Abschalten aller Filter": überlagert die übrigen
   * Filtereinstellungen, statt sie zurückzusetzen (design.md, Entscheidung 3).
   * Die gespeicherten Werte bleiben unangetastet und wirken nach dem
   * Zurücknehmen unverändert weiter — als Rücksetzknopf wäre die von der
   * Anforderung verlangte Rücknahme unmöglich.
   */
  alleAnzeigen: boolean;
}

const STANDARD: AnsichtEinstellungen = {
  zeitachse: true,
  gruppenfremdeAusblenden: false,
  sprungZuHeute: true,
  alleAnzeigen: false,
};

/** Die Filter, die die Wochenansicht tatsächlich auswertet — nach der Überlagerung. */
export interface WirksameFilter {
  /** SCHED-F-145: gruppenfremde Termine ausblenden. */
  gruppenfremdeAusblenden: boolean;
  /** Requirement „Anzeige nur im Gültigkeitszeitraum": Termine außerhalb ihres Zeitraums verbergen. */
  gueltigkeitszeitraumPruefen: boolean;
}

/**
 * Requirement „Schalter zum Abschalten aller Filter": Solange `alleAnzeigen`
 * gesetzt ist, übergeht die Auswertung die gespeicherten Filterwerte; sie
 * werden dabei nicht verändert.
 */
export function wirksameFilter(einstellungen: AnsichtEinstellungen): WirksameFilter {
  if (einstellungen.alleAnzeigen) {
    return { gruppenfremdeAusblenden: false, gueltigkeitszeitraumPruefen: false };
  }
  return {
    gruppenfremdeAusblenden: einstellungen.gruppenfremdeAusblenden,
    gueltigkeitszeitraumPruefen: true,
  };
}

let snapshot: AnsichtEinstellungen = STANDARD;
let geladen = false;
let ladeGestartet = false;
const hoerer = new Set<() => void>();

function melden() {
  for (const h of hoerer) h();
}

function bereinige(v: unknown): AnsichtEinstellungen {
  const roh = (v ?? {}) as Partial<Record<keyof AnsichtEinstellungen, unknown>>;
  const alsBoolean = (x: unknown, standard: boolean): boolean => (typeof x === 'boolean' ? x : standard);
  return {
    zeitachse: alsBoolean(roh.zeitachse, STANDARD.zeitachse),
    gruppenfremdeAusblenden: alsBoolean(roh.gruppenfremdeAusblenden, STANDARD.gruppenfremdeAusblenden),
    sprungZuHeute: alsBoolean(roh.sprungZuHeute, STANDARD.sprungZuHeute),
    alleAnzeigen: alsBoolean(roh.alleAnzeigen, STANDARD.alleAnzeigen),
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
  const toggleGruppenfremdeAusblenden = useCallback(
    () => schreiben({ ...snapshot, gruppenfremdeAusblenden: !snapshot.gruppenfremdeAusblenden }),
    [],
  );
  const toggleSprungZuHeute = useCallback(
    () => schreiben({ ...snapshot, sprungZuHeute: !snapshot.sprungZuHeute }),
    [],
  );
  /** Requirement „Schalter zum Abschalten aller Filter": legt allein die Überlagerung um. */
  const toggleAlleAnzeigen = useCallback(
    () => schreiben({ ...snapshot, alleAnzeigen: !snapshot.alleAnzeigen }),
    [],
  );

  return {
    einstellungen,
    loaded,
    filter: wirksameFilter(einstellungen),
    toggleZeitachse,
    toggleGruppenfremdeAusblenden,
    toggleSprungZuHeute,
    toggleAlleAnzeigen,
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
