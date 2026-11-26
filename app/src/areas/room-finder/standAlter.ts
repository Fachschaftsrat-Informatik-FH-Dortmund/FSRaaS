import { RAUMPLAN_ABRUFTAKT } from '@/cache/ttl';
import type { StandAlter } from './api';

// Requirement „Alter eines veralteten Raumplan-Stands anzeigen": veraltet ist
// ein Bestand, der beim Abruf durch die App älter war als der stündliche
// Abruftakt des Backends. Gemessen beim Abruf, damit die Gültigkeitsdauer des
// App-Zwischenspeichers nicht zum Bestandsalter hinzukommt (design.md).

/** Ob der Bestand zum Zeitpunkt des Abrufs (`dataUpdatedAt`) veraltet war. */
export function raumplanVeraltet(standAlter: StandAlter, dataUpdatedAt: number): boolean {
  const abgerufen = Date.parse(standAlter.abgerufenAm);
  if (Number.isNaN(abgerufen)) return false;
  return dataUpdatedAt - abgerufen > RAUMPLAN_ABRUFTAKT;
}

/**
 * Angabe für `AsyncStates.quelleStand`. Die Grundstruktur prüft
 * `jetzt − Stand > Höchstalter`; mit dem Höchstalter `Takt + (jetzt −
 * dataUpdatedAt)` ist das genau die Bedingung „beim Abruf älter als der Takt".
 */
export function raumplanQuelleStand(
  standAlter: StandAlter | undefined,
  dataUpdatedAt: number,
  jetzt: number = Date.now(),
) {
  return {
    zeitpunkt: standAlter?.abgerufenAm,
    maxAlterMs: RAUMPLAN_ABRUFTAKT + Math.max(0, jetzt - dataUpdatedAt),
    hinweis: 'raum.standVeraltet',
  };
}
