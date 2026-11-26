import { dehydrate, hydrate, onlineManager, QueryClient } from '@tanstack/react-query';

import { AppError } from '@/errors/AppError';
import {
  definiereSchreibvorgang,
  leseWarteschlange,
  MAX_WIEDERHOLUNGEN,
  nimmZurueck,
  raeumeVerfalleneAuf,
  registriereSchreibvorgaenge,
  reiheEin,
  setzeWarteschlangeFort,
  sollEintragPersistieren,
  VERFALL_MS,
  versucheErneut,
  verwirf,
  wiederholungsabstand,
  type Schreibvorgang,
} from './schreibwarteschlange';

// Tests gegen einen echten QueryClient: Sie schlagen fehl, wenn sich das
// Pause-/Scope-Verhalten von TanStack Query in einer neuen Version ändert
// (Change `besetzt-meldungen`, design.md „Risks").

const offline = () => new AppError({ kind: 'offline', message: 'error.offline', retryable: true });
const dauerhaft = () =>
  new AppError({ kind: 'notFound', code: 'raum_unbekannt', message: 'x', status: 404, retryable: false });

/** Wartet, bis alle ausstehenden Mikro- und Makroaufgaben gelaufen sind. */
const ruhe = () => new Promise((r) => setTimeout(r, 0));
async function bis(bedingung: () => boolean) {
  for (let i = 0; i < 50 && !bedingung(); i++) await ruhe();
  expect(bedingung()).toBe(true);
}

let client: QueryClient;
let gesendet: string[];
let antwort: (wert: string) => Promise<string>;

const test1 = definiereSchreibvorgang<{ wert: string }, string>('test', {
  ausfuehren: async (auftrag) => antwort(auftrag.nutzdaten.wert),
});
const vorgaenge = [test1] as unknown as Schreibvorgang<never, never>[];

function neuerClient() {
  const c = new QueryClient();
  registriereSchreibvorgaenge(c, vorgaenge);
  c.mount();
  return c;
}

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  onlineManager.setOnline(true);
  gesendet = [];
  antwort = async (wert) => {
    gesendet.push(wert);
    return wert;
  };
  client = neuerClient();
});

afterEach(() => {
  client.unmount();
  client.clear();
  onlineManager.setOnline(true);
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('Offline-Warteschlange für Schreibvorgänge', () => {
  it('Schreibvorgang ohne Netz: eingereiht und nach Wiederverbindung automatisch übertragen', async () => {
    onlineManager.setOnline(false);
    reiheEin(client, test1, { wert: 'a' });
    await ruhe();

    expect(gesendet).toEqual([]);
    expect(leseWarteschlange(client).map((e) => e.zustand)).toEqual(['wartend']);

    onlineManager.setOnline(true);
    await bis(() => gesendet.length === 1);
    await bis(() => leseWarteschlange(client).length === 0);
  });

  it('jeder Eintrag trägt einen eigenen Idempotenz-Schlüssel', () => {
    onlineManager.setOnline(false);
    const a = reiheEin(client, test1, { wert: 'a' });
    const b = reiheEin(client, test1, { wert: 'b' });
    expect(a.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(a.id).not.toBe(b.id);
  });

  it('Verwaltungshandlungen ohne eigene Vorgaben laufen nicht über die Warteschlange', () => {
    const verwaltung = { options: { mutationKey: ['verwaltung', 'rollen'] }, state: { status: 'pending' } };
    expect(sollEintragPersistieren(verwaltung)).toBe(false);
  });
});

describe('Lokale Offline-Warteschlange mit FIFO-Übertragung', () => {
  it('Verbindung wiederhergestellt: Übertragung in Entstehungsreihenfolge', async () => {
    onlineManager.setOnline(false);
    reiheEin(client, test1, { wert: 'erster' });
    reiheEin(client, test1, { wert: 'zweiter' });
    reiheEin(client, test1, { wert: 'dritter' });
    await ruhe();

    onlineManager.setOnline(true);
    await bis(() => gesendet.length === 3);
    expect(gesendet).toEqual(['erster', 'zweiter', 'dritter']);
  });

  it('ein späterer Eintrag wartet, bis der frühere übertragen ist', async () => {
    let freigeben: () => void = () => {};
    antwort = (wert) => {
      gesendet.push(wert);
      return wert === 'langsam' ? new Promise((r) => { freigeben = () => r(wert); }) : Promise.resolve(wert);
    };
    reiheEin(client, test1, { wert: 'langsam' });
    reiheEin(client, test1, { wert: 'schnell' });
    await ruhe();

    expect(gesendet).toEqual(['langsam']);
    expect(leseWarteschlange(client).map((e) => e.zustand)).toEqual(['laeuft', 'wartend']);

    freigeben();
    await bis(() => gesendet.length === 2);
  });

  it('übersteht einen Neustart: wiederhergestellte Einträge laufen in derselben Reihenfolge', async () => {
    onlineManager.setOnline(false);
    reiheEin(client, test1, { wert: 'eins' });
    reiheEin(client, test1, { wert: 'zwei' });
    await ruhe();
    const gespeichert = JSON.parse(JSON.stringify(dehydrate(client, { shouldDehydrateMutation: sollEintragPersistieren })));
    // Die beendete App sendet nichts mehr.
    client.unmount();
    client.getMutationCache().clear();

    const nachNeustart = neuerClient();
    hydrate(nachNeustart, gespeichert);
    onlineManager.setOnline(true);
    setzeWarteschlangeFort(nachNeustart);

    await bis(() => gesendet.length === 2);
    expect(gesendet).toEqual(['eins', 'zwei']);
    await bis(() => leseWarteschlange(nachNeustart).length === 0);
    nachNeustart.unmount();
  });
});

describe('Pause-/Fortsetzungs-Mechanismus der Offline-Warteschlange', () => {
  it('Verbindung während der Übertragung unterbrochen: automatische Fortsetzung ohne Eingreifen', async () => {
    jest.useFakeTimers();
    let versuche = 0;
    antwort = async (wert) => {
      versuche += 1;
      if (versuche === 1) {
        onlineManager.setOnline(false); // die Verbindung reißt mitten in der Übertragung ab
        throw offline();
      }
      gesendet.push(wert);
      return wert;
    };
    reiheEin(client, test1, { wert: 'a' });
    // Erster Fehlversuch, dann der Backoff-Abstand; danach pausiert der Eintrag.
    await jest.advanceTimersByTimeAsync(wiederholungsabstand(0));
    expect(leseWarteschlange(client)[0]?.zustand).toBe('wartend');
    expect(gesendet).toEqual([]);

    onlineManager.setOnline(true);
    await jest.advanceTimersByTimeAsync(0);
    expect(gesendet).toEqual(['a']);
    expect(leseWarteschlange(client)).toEqual([]);
  });

  it('Abstand der Wiederholungen steigt und ist nach oben begrenzt', () => {
    expect(wiederholungsabstand(0)).toBe(2_000);
    expect(wiederholungsabstand(1)).toBe(4_000);
    expect(wiederholungsabstand(3)).toBe(16_000);
    expect(wiederholungsabstand(20)).toBe(300_000);
  });
});

describe('Manuelle Entscheidung bei dauerhaft fehlgeschlagenem Schreibvorgang', () => {
  it('Dauerhafter Fehlschlag: Eintrag bleibt zur Entscheidung stehen', async () => {
    antwort = async () => {
      throw dauerhaft();
    };
    reiheEin(client, test1, { wert: 'a' });
    await bis(() => leseWarteschlange(client)[0]?.zustand === 'fehlgeschlagen');

    const [eintrag] = leseWarteschlange(client);
    expect(eintrag?.fehler).toEqual({ kind: 'notFound', code: 'raum_unbekannt' });
  });

  it('wiederholbare Fehler gehen erst nach der Höchstzahl an Versuchen in die Entscheidung', async () => {
    jest.useFakeTimers();
    let versuche = 0;
    antwort = async () => {
      versuche += 1;
      throw new AppError({ kind: 'server', message: 'x', status: 503, retryable: true });
    };
    reiheEin(client, test1, { wert: 'a' });
    for (let i = 0; i <= MAX_WIEDERHOLUNGEN; i++) await jest.advanceTimersByTimeAsync(300_000);

    expect(versuche).toBe(MAX_WIEDERHOLUNGEN + 1);
    expect(leseWarteschlange(client)[0]?.zustand).toBe('fehlgeschlagen');
  });

  it('erneut versuchen sendet denselben Auftrag mit demselben Schlüssel', async () => {
    const schluessel: string[] = [];
    let scheitern = true;
    const vorgang = definiereSchreibvorgang<{ wert: string }, string>('test', {
      ausfuehren: async () => '',
    });
    antwort = async (wert) => {
      if (scheitern) throw dauerhaft();
      gesendet.push(wert);
      return wert;
    };
    const auftrag = reiheEin(client, vorgang, { wert: 'a' });
    schluessel.push(auftrag.id);
    await bis(() => leseWarteschlange(client)[0]?.zustand === 'fehlgeschlagen');

    scheitern = false;
    versucheErneut(client, leseWarteschlange(client)[0]!);
    await bis(() => gesendet.length === 1);
    await bis(() => leseWarteschlange(client).length === 0);
    expect(schluessel).toEqual([auftrag.id]);
  });

  it('verwerfen entfernt den Eintrag ohne erneuten Versuch', async () => {
    antwort = async () => {
      throw dauerhaft();
    };
    reiheEin(client, test1, { wert: 'a' });
    await bis(() => leseWarteschlange(client)[0]?.zustand === 'fehlgeschlagen');

    verwirf(client, leseWarteschlange(client)[0]!);
    expect(leseWarteschlange(client)).toEqual([]);
  });

  it('ein fehlgeschlagener Eintrag blockiert die folgenden nicht', async () => {
    antwort = async (wert) => {
      if (wert === 'kaputt') throw dauerhaft();
      gesendet.push(wert);
      return wert;
    };
    reiheEin(client, test1, { wert: 'kaputt' });
    reiheEin(client, test1, { wert: 'gut' });
    await bis(() => gesendet.length === 1);
    expect(leseWarteschlange(client).map((e) => e.zustand)).toEqual(['fehlgeschlagen']);
  });

  it('fehlgeschlagene Einträge überdauern den Neustart', async () => {
    antwort = async () => {
      throw dauerhaft();
    };
    reiheEin(client, test1, { wert: 'a' });
    await bis(() => leseWarteschlange(client)[0]?.zustand === 'fehlgeschlagen');

    const nachNeustart = neuerClient();
    hydrate(nachNeustart, JSON.parse(JSON.stringify(dehydrate(client, { shouldDehydrateMutation: sollEintragPersistieren }))));
    setzeWarteschlangeFort(nachNeustart);

    expect(leseWarteschlange(nachNeustart)).toEqual([
      expect.objectContaining({ zustand: 'fehlgeschlagen', fehler: { kind: 'notFound', code: 'raum_unbekannt' } }),
    ]);
    nachNeustart.unmount();
  });
});

describe('Status der Offline-Warteschlange einsehbar', () => {
  it('Wartender Eintrag ohne Netz: als wartend sichtbar, bis er übertragen ist', async () => {
    onlineManager.setOnline(false);
    const auftrag = reiheEin(client, test1, { wert: 'a' });
    await ruhe();

    expect(leseWarteschlange(client)).toEqual([
      expect.objectContaining({ art: 'test', zustand: 'wartend', auftrag }),
    ]);
    onlineManager.setOnline(true);
    await bis(() => leseWarteschlange(client).length === 0);
  });

  it('Eintrag älter als die Verfallsfrist: entfernt und protokolliert', async () => {
    onlineManager.setOnline(false);
    reiheEin(client, test1, { wert: 'alt' });
    reiheEin(client, test1, { wert: 'neu' });
    await ruhe();

    const zeiten = leseWarteschlange(client).map((e) => Date.parse(e.auftrag.eingereihtAm));
    const verfallen = raeumeVerfalleneAuf(client, Math.min(...zeiten) + VERFALL_MS);
    expect(verfallen).toBe(0);

    const spaeter = raeumeVerfalleneAuf(client, Math.max(...zeiten) + VERFALL_MS + 1);
    expect(spaeter).toBe(2);
    expect(leseWarteschlange(client)).toEqual([]);
    expect(console.warn).toHaveBeenCalledWith('[schreibwarteschlange] verfallen: 2');
  });

  it('beschränkt die Sicht auf die erfragten Arten', async () => {
    onlineManager.setOnline(false);
    reiheEin(client, test1, { wert: 'a' });
    await ruhe();
    expect(leseWarteschlange(client, ['andere'])).toEqual([]);
    expect(leseWarteschlange(client, ['test'])).toHaveLength(1);
  });
});

describe('Rücknahme eines noch nicht begonnenen Eintrags', () => {
  it('ein wartender Eintrag wird entfernt, ohne gesendet zu werden', async () => {
    onlineManager.setOnline(false);
    const auftrag = reiheEin(client, test1, { wert: 'a' });
    await ruhe();

    expect(nimmZurueck(client, auftrag.id)).toBe(true);
    onlineManager.setOnline(true);
    await ruhe();
    await ruhe();
    expect(gesendet).toEqual([]);
  });

  it('ein laufender Eintrag lässt sich nicht mehr zurücknehmen', async () => {
    antwort = () => new Promise(() => {});
    const auftrag = reiheEin(client, test1, { wert: 'a' });
    await ruhe();
    expect(nimmZurueck(client, auftrag.id)).toBe(false);
  });
});
