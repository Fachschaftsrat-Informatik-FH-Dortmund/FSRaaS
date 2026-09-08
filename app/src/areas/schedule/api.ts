import { useMutation, useQuery } from '@tanstack/react-query';

import { gcTime, staleTime } from '@/cache/ttl';
import { api, unwrap } from '@/net/client';
import { holeGruppenkennungZuMatrikelnummer, holeStudiengaenge, holeTermine, type FbwsStudiengang } from './fbwsClient';
import { normalizeOfficialTermine } from './normalize';
import type { OfficialTermin } from './typen';

// TanStack-Query-Hooks für den Stundenplan. INT-001 (Studiengänge) und INT-002
// (Termine) sind Direktabrufe gegen FBWS über `fbwsClient.ts`, kein Zugriff
// über den eigenen OpenAPI-Vertrag (`@/net/client`s `api` bedient hier nur den
// Rückfallweg gegen das eigene Backend, INT-008). Gültigkeitsdauer je
// Datenart aus `@/cache/ttl` (DATA-F-080).

export type { FbwsStudiengang };

/**
 * SCHED-F-020: Studiengänge mit Fachsemestern (INT-001). SCHED-F-254: Ist
 * INT-001 nicht erreichbar, wird auf die vom eigenen Backend vorgehaltene
 * Rückfallliste (`GET /stundenplan/studiengaenge`) ausgewichen — Muster wie
 * `canteen/api.ts`s `useMensen`/`istAusgangsbestand`, hier aber ein zweiter
 * Netzabruf statt eines mitgelieferten Anwendungspakets, da das Backend die
 * Rückfallliste selbst aktuell hält (API-F-240).
 */
export function useStudiengaenge() {
  const primaer = useQuery<FbwsStudiengang[]>({
    queryKey: ['stundenplanStudiengaenge', 'fbws'],
    staleTime: staleTime('studiengaenge'),
    gcTime: gcTime('studiengaenge'),
    queryFn: holeStudiengaenge,
  });

  const rueckfallAktiv = primaer.isError;
  const rueckfall = useQuery<FbwsStudiengang[]>({
    queryKey: ['stundenplanStudiengaenge', 'rueckfall'],
    enabled: rueckfallAktiv,
    staleTime: staleTime('studiengaenge'),
    gcTime: gcTime('studiengaenge'),
    queryFn: async () => {
      const liste = unwrap(await api.GET('/stundenplan/studiengaenge'));
      // Die Rückfallliste des eigenen Backends (INT-008) führt kein `po` —
      // `endpunkte.ts` leitet die Prüfungsordnung dort bei Bedarf aus dem
      // Klarnamen ab (design.md, Entscheidung 2).
      return liste.map((s): FbwsStudiengang => ({
        name: s.name,
        sname: s.kurzname,
        grades: s.fachsemester.map(String),
        po: null,
      }));
    },
  });

  const istRueckfall = rueckfallAktiv && rueckfall.data !== undefined;
  const studiengaenge = primaer.data ?? (istRueckfall ? rueckfall.data! : []);
  return { studiengaenge, istRueckfall, query: primaer, rueckfallQuery: rueckfall };
}

/** SCHED-F-030: Termine eines Studiengang/Fachsemester-Paars (INT-002), bereits normalisiert. */
export function useTermine(sname: string | undefined, grade: string | undefined) {
  return useQuery<OfficialTermin[]>({
    queryKey: ['stundenplanTermine', sname, grade],
    enabled: Boolean(sname) && Boolean(grade),
    staleTime: staleTime('stundenplanTermine'),
    gcTime: gcTime('stundenplanTermine'),
    queryFn: async () => normalizeOfficialTermine(await holeTermine(sname!, grade!)),
  });
}

/**
 * SCHED-F-400: Termine der FBWS-Sammelkategorie der Wahlpflichtmodule
 * (`sname=WFPB`, `grade=*`) — technisch derselbe INT-002-Endpunkt wie
 * `useTermine`, keine eigene Integration.
 */
export function useWahlpflichtTermine() {
  return useQuery<OfficialTermin[]>({
    queryKey: ['stundenplanTermine', 'WFPB', '*'],
    staleTime: staleTime('stundenplanTermine'),
    gcTime: gcTime('stundenplanTermine'),
    queryFn: async () => normalizeOfficialTermine(await holeTermine('WFPB', '*')),
  });
}

/**
 * Requirement „Kennzeichnung vorlesungsfreier Wochen": Semesterbeginn und
 * -ende aus den ferngepflegten Stammdaten (`GET /stammdaten`, API-F-230) als
 * Unix-Sekunden, wie `wochenrechnung.wocheAusserhalbVorlesungszeit` sie
 * erwartet. Fehlt eine der beiden Angaben, bleibt sie `null` — ohne bekannte
 * Vorlesungszeit erzeugt die Ansicht keinen Hinweis, statt einen Fehlalarm zu
 * riskieren.
 */
export function useVorlesungszeit() {
  return useQuery<{ von: number | null; bis: number | null }>({
    queryKey: ['stammdaten', 'vorlesungszeit'],
    staleTime: staleTime('stammdaten'),
    gcTime: gcTime('stammdaten'),
    queryFn: async () => {
      const stammdaten = unwrap(await api.GET('/stammdaten'));
      return {
        von: alsUnixSekunden(stammdaten.semestertermine.semesterBeginn),
        bis: alsUnixSekunden(stammdaten.semestertermine.semesterEnde),
      };
    },
  });
}

/** ISO-Datum `"YYYY-MM-DD"` als Unix-Sekunden zur Mittagszeit — zeitzonenunempfindlicher Vergleichspunkt. */
function alsUnixSekunden(datum: string | undefined): number | null {
  if (!datum) return null;
  const [y, m, d] = datum.split('-').map(Number);
  if (!y || !m || !d) return null;
  return Math.floor(new Date(y, m - 1, d, 12, 0, 0).getTime() / 1000);
}

/** Studiengänge ohne React — für Hintergrundabgleiche (z. B. `semesterwechsel.ts` außerhalb eines Bildschirms). */
export async function ladeStudiengaenge(): Promise<FbwsStudiengang[]> {
  return holeStudiengaenge();
}

/** Termine ohne React, bereits normalisiert (Vorbild: `canteen/api.ts`s `ladeMensen`). */
export async function ladeTermine(sname: string, grade: string): Promise<OfficialTermin[]> {
  return normalizeOfficialTermine(await holeTermine(sname, grade));
}

/**
 * SCHED-F-690: ermittelt die Gruppenkennung zu einer Matrikelnummer über
 * INT-019. Liefert `null`, wenn keine Kennung hinterlegt ist (INT-019: leere
 * Liste oder `fhDoStudentSet: false`, beide als „nicht gefunden" behandelt,
 * `fbwsClient.holeGruppenkennungZuMatrikelnummer`). Bewusst kein `useQuery`:
 * INT-019 wird laut Cache-Regel nicht zwischengespeichert, der Abruf erfolgt
 * einmalig auf ausdrückliche Anfrage (`mutate`), nicht automatisch.
 */
export function useGruppenkennungErmitteln() {
  return useMutation<string | null, unknown, string>({
    mutationFn: (matrikelnummer: string) => holeGruppenkennungZuMatrikelnummer(matrikelnummer),
  });
}

/** Gruppenkennung ohne React ermitteln (SCHED-F-690), z. B. für Hintergrundabgleiche. */
export async function ermittleGruppenkennung(matrikelnummer: string): Promise<string | null> {
  return holeGruppenkennungZuMatrikelnummer(matrikelnummer);
}
