import { useMemo } from 'react';

import { useMensaVerzeichnisse, type Gericht } from './api';
import { baueTokenGruppen, gerichtDietBetroffen } from './dietFilter';
import { useDietPreference } from './dietPreference';
import { gerichtBetroffen } from './intoleranceFilter';
import { useIntolerances } from './intolerances';
import { preisFuer } from './preise';
import { usePriceGroup } from './priceGroup';
import { usePriceLimit } from './priceLimit';

// MENSA-F-190 / F-200 / F-210: gebündelter Filter — Preis-Höchstgrenze (F-235),
// Unverträglichkeiten (Zusatzstoffe, F-180), Lebensstil-Vorgabe (F-250) und
// Ausschluss (F-260). Ein Gericht ist „betroffen", wenn eine Vorgabe zutrifft;
// die Hauptansicht blendet betroffene Gerichte aus, die Ansicht aller Mensen
// graut sie aus.

export type GerichtKennzeichen = Partial<Gericht>;

/** Liefert ein Prädikat `betroffen(gericht)` und ob überhaupt ein Filter aktiv ist. */
export function useGerichtFilter() {
  const { codes } = useIntolerances();
  const { prefs } = useDietPreference();
  const { group } = usePriceGroup();
  const { limit } = usePriceLimit();
  const verzeichnisse = useMensaVerzeichnisse();

  return useMemo(() => {
    const zusatzLabel = new Map(
      (verzeichnisse.data?.zusatzstoffe ?? []).map((z) => [z.id, z.bezeichnung]),
    );
    const kennzLabel = new Map(
      (verzeichnisse.data?.kennzeichnungen ?? []).map((k) => [k.id, k.bezeichnung]),
    );

    const zusatzAusgewaehlt = new Set<string>();
    for (const code of codes) {
      zusatzAusgewaehlt.add(code);
      const label = zusatzLabel.get(code);
      if (label) zusatzAusgewaehlt.add(label);
    }

    const nurZeigen = baueTokenGruppen(prefs.nurZeigen, (id) => kennzLabel.get(id));
    const ausschluss = baueTokenGruppen(prefs.ausschluss, (id) => kennzLabel.get(id));

    const aktiv =
      limit != null ||
      zusatzAusgewaehlt.size > 0 ||
      nurZeigen.length > 0 ||
      ausschluss.length > 0;

    const betroffen = (g: GerichtKennzeichen): boolean => {
      if (limit != null) {
        const preis = preisFuer(g as Gericht, group);
        if (preis != null && preis > limit + 1e-9) return true;
      }
      return (
        gerichtBetroffen(g.zusatzstoffe, zusatzAusgewaehlt) ||
        gerichtDietBetroffen(g.kennzeichnungen, nurZeigen, ausschluss)
      );
    };

    return { betroffen, aktiv };
  }, [codes, prefs, group, limit, verzeichnisse.data]);
}
