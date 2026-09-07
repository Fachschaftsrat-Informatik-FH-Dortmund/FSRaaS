import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';
import {
  istGueltigeKombination,
  istVordefiniert,
  loeseAuf,
  type AufgeloestesPreset,
  type EigenesPreset,
  type Kombination,
} from './sortierung';

// Requirements „Speichern eines eigenen Presets", „Umbenennen und Löschen
// eigener Presets" und „Merken des zuletzt gewählten Presets" (canteen/spec.md).
// Rein gerätelokal, reaktiver Modul-Speicher wie `selection.ts` — Kopfzugang,
// Auswahl-Ansicht und Gerichtsliste teilen denselben Stand ohne globalen Store
// (ARCH-N-030). Kein Konto, keine Übertragung, kein Backend-Aufruf.

const KEY_PRESETS = 'canteenSortPresets';
const KEY_ACTIVE = 'canteenSortActive';

let presets: EigenesPreset[] = [];
let activeId: string | null = null;
// Nicht persistierte, gerade in der Auswahl zusammengestellte Kombination. Sie
// überlagert das aufgelöste Preset für die Anzeige, bis die Nutzerin ein Preset
// wählt oder die Zusammenstellung als eigenes Preset speichert. Beim App-Start
// leer — dann greift `activeId` (Requirement „Merken des zuletzt gewählten
// Presets").
let entwurf: Kombination | null = null;
let geladen = false;
let ladeGestartet = false;
const hoerer = new Set<() => void>();

/** Kennung der transienten Zusammenstellung (nicht in `VORDEFINIERTE_PRESETS`). */
export const ENTWURF_ID = '__entwurf';

function melden() {
  for (const h of hoerer) h();
}

/**
 * Defensive Bereinigung beim Laden: ein eigenes Preset mit unbekanntem
 * Kriterium/unbekannter Richtung wird verworfen, nicht die ganze Liste.
 */
function bereinigePresets(v: unknown): EigenesPreset[] {
  if (!Array.isArray(v)) return [];
  const out: EigenesPreset[] = [];
  for (const roh of v) {
    if (roh == null || typeof roh !== 'object') continue;
    const p = roh as Partial<EigenesPreset>;
    if (typeof p.id !== 'string' || typeof p.name !== 'string') continue;
    if (!istGueltigeKombination(p.kombination)) continue;
    out.push({ id: p.id, name: p.name, kombination: p.kombination as Kombination });
  }
  return out;
}

function bereinigeAktiv(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function subscribe(cb: () => void): () => void {
  hoerer.add(cb);
  if (!ladeGestartet) {
    ladeGestartet = true;
    Promise.all([
      readJson<unknown>(KEY_PRESETS, []).then((v) => {
        presets = bereinigePresets(v);
      }),
      readJson<unknown>(KEY_ACTIVE, null).then((v) => {
        activeId = bereinigeAktiv(v);
      }),
    ])
      .catch((error) => logError('sortierPreset.load', error))
      .finally(() => {
        geladen = true;
        melden();
      });
  }
  return () => {
    hoerer.delete(cb);
  };
}

function schreibePresets(next: EigenesPreset[]) {
  presets = next;
  geladen = true;
  melden();
  writeJson(KEY_PRESETS, next).catch((error) => logError('sortierPreset.savePresets', error));
}

function schreibeAktiv(next: string | null) {
  activeId = next;
  geladen = true;
  melden();
  writeJson(KEY_ACTIVE, next).catch((error) => logError('sortierPreset.saveActive', error));
}

function neueId(): string {
  return `eigen-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetSortierPresetForTest(): void {
  presets = [];
  activeId = null;
  entwurf = null;
  geladen = false;
  ladeGestartet = false;
  hoerer.clear();
}

function setzeEntwurf(next: Kombination | null) {
  entwurf = next;
  melden();
}

export function useSortierGruppierung() {
  const eigene = useSyncExternalStore(subscribe, () => presets);
  const aktivId = useSyncExternalStore(subscribe, () => activeId);
  const roherEntwurf = useSyncExternalStore(subscribe, () => entwurf);
  const loaded = useSyncExternalStore(subscribe, () => geladen);

  // Die transiente Zusammenstellung überlagert das gemerkte Preset für die
  // Anzeige (Requirement „Wahl der Gruppierung": die Wahl wirkt sofort).
  const aktiv: AufgeloestesPreset = roherEntwurf
    ? { id: ENTWURF_ID, eigen: false, ...roherEntwurf }
    : loeseAuf(aktivId, eigene);

  const waehle = useCallback((id: string) => {
    setzeEntwurf(null);
    schreibeAktiv(id);
  }, []);

  /** Live-Zusammenstellung ändern, ohne ein Preset zu wählen oder zu speichern. */
  const stelleEin = useCallback((kombination: Kombination) => setzeEntwurf(kombination), []);

  const speichereEigenes = useCallback((name: string, kombination: Kombination) => {
    const preset: EigenesPreset = { id: neueId(), name: name.trim(), kombination };
    schreibePresets([...presets, preset]);
    setzeEntwurf(null);
    schreibeAktiv(preset.id);
    return preset.id;
  }, []);

  const benenneUm = useCallback((id: string, name: string) => {
    if (istVordefiniert(id)) return;
    schreibePresets(presets.map((p) => (p.id === id ? { ...p, name: name.trim() } : p)));
  }, []);

  const loesche = useCallback((id: string) => {
    if (istVordefiniert(id)) return;
    schreibePresets(presets.filter((p) => p.id !== id));
  }, []);

  return {
    aktiv,
    /** true, solange eine ungespeicherte Live-Zusammenstellung angezeigt wird. */
    istEntwurf: roherEntwurf != null,
    presets: eigene,
    loaded,
    waehle,
    stelleEin,
    speichereEigenes,
    benenneUm,
    loesche,
  };
}
