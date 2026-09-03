import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';
import { ladeMensen, ladeSpeiseplanGerichte } from './api';
import {
  findeNeueTreffer,
  istVormittag,
  ledgerAktualisieren,
  type NotifiedLedger,
  type TagesplanEingang,
} from './backgroundCheck';
import { readFavorites } from './favorites';
import { benachrichtigungErlaubt, zeigeLieblingsgerichtHinweis } from './notifications';
import { readSelection } from './selection';

// MENSA-F-100 / MENSA-N-010: betriebssystemeigener Weckruf (WorkManager /
// BGTaskScheduler über expo-background-fetch — kein Firebase). Der Task lädt den
// Tagesplan der gewählten Mensen selbst und gleicht lokal gegen die Lieblingsliste
// ab. Verpasst das OS den Weckruf, holt nachholenBeimAppStart() den Abgleich beim
// nächsten Öffnen nach, solange es noch vormittags ist (Abschnitt 9).

const TASK = 'mensa-lieblingsgericht-abgleich';
const LEDGER_KEY = 'mensaNotified';
const LETZTER_ABGLEICH_KEY = 'mensaLetzterAbgleich';

function isoDatum(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Kernabgleich. Zeigt bei neuen Treffern eine lokale Benachrichtigung und
 * schreibt sie ins Ledger (MENSA-F-110 — höchstens eine je Gericht-Mensa-Tag).
 * Gibt die Anzahl neuer Treffer zurück.
 */
export async function fuehreLieblingsgerichtAbgleichAus(jetzt: Date = new Date()): Promise<number> {
  if (!istVormittag(jetzt)) return 0;
  if (!(await benachrichtigungErlaubt())) return 0;

  const [favoritenListe, auswahl] = await Promise.all([readFavorites(), readSelection()]);
  const favoriten = new Set(favoritenListe.map((f) => f.schluessel));
  if (favoriten.size === 0 || auswahl.length === 0) return 0;

  const datum = isoDatum(jetzt);
  const namen = await namensKarteAsync(auswahl);
  const plaene: TagesplanEingang[] = [];

  for (const mensaId of auswahl) {
    try {
      const gerichte = await ladeSpeiseplanGerichte(mensaId, datum);
      plaene.push({
        mensaId,
        mensaName: namen.get(mensaId) ?? mensaId,
        datum,
        gerichte: gerichte.map((g) => ({ schluessel: g.schluessel, bezeichnung: g.bezeichnung })),
      });
    } catch (error) {
      logError('mensa.backgroundFetch', error);
    }
  }

  const ledger = await readJson<NotifiedLedger>(LEDGER_KEY, {});
  const treffer = findeNeueTreffer({ plaene, favoriten, ledger });
  if (treffer.length > 0) await zeigeLieblingsgerichtHinweis(treffer);
  await writeJson(LEDGER_KEY, ledgerAktualisieren(ledger, treffer, datum));
  await writeJson(LETZTER_ABGLEICH_KEY, datum);
  return treffer.length;
}

async function namensKarteAsync(auswahl: string[]): Promise<Map<string, string>> {
  try {
    const mensen = await ladeMensen();
    return new Map(mensen.map((m) => [m.id, m.name]));
  } catch (error) {
    logError('mensa.backgroundFetch.mensen', error);
    return new Map(auswahl.map((id) => [id, id]));
  }
}

/** Vordergrund-Nachholung beim App-Start (Abschnitt 9), einmal je Tag. */
export async function nachholenBeimAppStart(jetzt: Date = new Date()): Promise<void> {
  if (!istVormittag(jetzt)) return;
  const letzter = await readJson<string>(LETZTER_ABGLEICH_KEY, '');
  if (letzter === isoDatum(jetzt)) return;
  await fuehreLieblingsgerichtAbgleichAus(jetzt).catch((error) => logError('mensa.nachholen', error));
}

TaskManager.defineTask(TASK, async () => {
  try {
    const neue = await fuehreLieblingsgerichtAbgleichAus();
    return neue > 0 ? BackgroundFetch.BackgroundFetchResult.NewData : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    logError('mensa.backgroundTask', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Registriert den Hintergrund-Weckruf. Idempotent — mehrfacher Aufruf ist
 * unschädlich. Wird beim ersten Markieren eines Lieblingsgerichts aufgerufen
 * (SEC-F-080: erst bei tatsächlichem Bedarf).
 */
export async function lieblingsgerichtAbgleichRegistrieren(): Promise<void> {
  try {
    const registriert = await TaskManager.isTaskRegisteredAsync(TASK);
    if (registriert) return;
    await BackgroundFetch.registerTaskAsync(TASK, {
      minimumInterval: 2 * 60 * 60, // 2 h; das OS bestimmt den tatsächlichen Zeitpunkt (MENSA-N-010)
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (error) {
    logError('mensa.registerBackgroundTask', error);
  }
}
