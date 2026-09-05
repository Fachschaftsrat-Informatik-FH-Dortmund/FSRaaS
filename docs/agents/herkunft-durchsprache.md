# Herkunfts-Durchsprache

Wie der Anforderungsbestand daraufhin durchgesprochen wird, ob er noch das
will, was der FSR will. Gedacht für eine eigene Sitzung je Capability, mit
`/grill-with-docs`.

## Warum es diese Durchsprache gibt

Der Bestand ist in drei Schichten entstanden, und **keine davon war eine
Anforderungserhebung mit Nutzerinnen**:

1. **Rückwärts aus zwei Alt-Apps erschlossen.** Eine Flutter/iOS-App und die
   Android-App 1.4.11 unter `alte apps/`. Was diese Apps taten, wurde gelesen
   und als Anforderung aufgeschrieben. Der Quellcode der Android-App war
   jahrelang unauffindbar; niemand konnte sagen, welches Verhalten Absicht war
   und welches Zufall.
2. **In langen Sitzungen mit einem Assistenten ausformuliert** (Claude Desktop,
   August/September 2026). Dabei sind viele Anforderungen entstanden, die in
   keiner Alt-App stehen — teils auf ausdrückliche Entscheidung des FSR, teils
   weil sie im Fluss der Ausformulierung plausibel wirkten. **Diese beiden
   Fälle sind im Bestand nicht durchgängig unterscheidbar.** Genau das ist der
   Grund für diese Durchsprache.
3. **Nach OpenSpec überführt** (ADR 0019, 2026-09-05). Eine Formatumstellung —
   sie hat den Inhalt nicht geprüft, nur umgeschrieben.

Der FSR wechselt seine Aktiven jährlich. Eine Anforderung, die niemand mehr
begründen kann, wird beim nächsten Wechsel entweder blind umgesetzt oder blind
gestrichen. Beides ist schlecht.

## Was die Herkunftsmarkierung sagt — und was nicht

```bash
node tools/spec-check/src/cli.js --herkunft       # Verteilung
node tools/spec-check/src/cli.js --herkunft NEU   # Requirements je Capability
```

Stand 2026-09-05, 570 Requirements:

| Herkunft | Anzahl | Was das heißt |
|---|---|---|
| `NEU` | 397 (70 %) | stützt sich auf **nichts außerhalb der Spec** |
| `Alt: <pfad>:<zeile>` | 105 (18 %) | im Alt-Code nachschlagbar |
| `Recherche: <quelle>, <datum>` | 67 (12 %) | an einer datierten Quelle nachprüfbar |
| `Android: unbekannt` | 1 | Verhalten der Alt-App war nicht ermittelbar |

**`NEU` heißt nicht „erfunden".** Ein Teil dieser Anforderungen geht auf
ausdrückliche Entscheidungen zurück — im Bestand stehen rund 50 datierte Belege
in 17 Capabilities, meist im Abschnitt `Erläuterungen`. Die Durchsprache trennt
genau diese beiden Fälle:

- **`NEU` mit Beleg** — eine Entscheidung ist dokumentiert. Prüfen, ob sie noch
  gilt; im Zweifel stehen lassen.
- **`NEU` ohne Beleg** — niemand weiß mehr, warum das dort steht. Das ist die
  eigentliche Arbeit.

## Vorgehen

Eine Sitzung je Capability, nicht alles auf einmal — `canteen` allein hat 56
`NEU`-Requirements.

1. Liste holen: `node tools/spec-check/src/cli.js --herkunft NEU`
2. Die Capability-Spec lesen, aber **nur** von `## Requirements` bis zur
   nächsten `## `-Überschrift, dazu den Abschnitt `Erläuterungen` (dort stehen
   die Entscheidungsbelege). Siehe `docs/agents/domain.md`, Abschnitt
   „Read narrowly".
3. `/grill-with-docs` mit dieser Liste als Frontier.
4. Je Requirement genau eine Frage: **Würde der FSR das heute noch so
   beschließen — und woran erkennt man das?**

Nützliche Nachfragen, wenn die Antwort unsicher ist:

- Was passiert, wenn wir es einfach weglassen? Wer merkt es, und woran?
- Steht dahinter eine Beobachtung an einer echten Nutzerin oder eine Vermutung?
- Widerspricht es einer ADR in `specs/decisions/`? (Dann laut sagen, nicht
  stillschweigend überschreiben.)
- Ist es überhaupt eine Anforderung oder eine Umsetzungsentscheidung, die in
  den Code gehört?

## Was mit dem Ergebnis geschieht

- **Bleibt** → Beleg nachtragen, wenn einer fehlt: ein Satz in `Erläuterungen`
  mit „Entschieden <Datum>." Damit fällt es beim nächsten Durchgang nicht
  wieder auf.

  **Keine Zuschreibung an ein Gremium** (präzisiert 2026-09-05). Ältere Belege
  lauten „Entscheidung FSR FB4, <Datum>" und behaupten damit ein
  Rückfrageverfahren, das es nicht gab: die Festlegungen stammen vom einzigen
  Entwickler des Projekts, der zugleich FSR-Mitglied ist. Das Datum trägt die
  Information, die ein Nachfolger braucht, der Beschlussweg nicht. In den drei
  Mensa-Capabilities ist das umgestellt, im übrigen Bestand steht es aus.
- **Fällt weg** → als `REMOVED`-Delta über einen OpenSpec-Change führen, **nie
  löschen**. Die ID bleibt für immer vergeben; `spec-check` liest den Abschnitt
  `## Entfallene Anforderungen` und hält Verweise darauf weiterhin für gültig.
- **Ändert sich** → normaler Change mit Spec-Delta, wie bei jeder anderen
  Änderung auch.

## Womit anfangen

Zuerst die beiden Bereiche, die **nur als Spec existieren** — dort kostet eine
Streichung keinen Code:

- **Mensa-Sortier-/Gruppierpresets** (`canteen`, MENSA-F-300 ff.). Ausdrücklich
  spec-only; die Preset-Liste wurde bereits einmal von sechs auf vier gekürzt.
- **Stundenplan ab SCHED-F-460** (`schedule`). In einer Sitzung entstanden, 23
  Requirements auf einmal; die Umsetzung ist nach Etappe 2 pausiert.

Danach nach Anzahl: `canteen` (56), `backend-and-api` (53), `schedule` (29),
`news` (24), `identity-and-moderation` (23), `admin` (22).

Nicht sinnvoll: `integrations`. Dessen Einträge sind an echten Endpunkten
gemessen und tragen fast durchgehend `Recherche:`.

## Was der erste Durchgang gezeigt hat

`canteen`, `canteen-photos` und `canteen-ratings` am 2026-09-05 (Changes
`herkunft-canteen-durchsprache` und `canteen-durchsprache-inhalt`). Vier
Dinge, die beim nächsten Mal Zeit sparen:

**Die Frontier nicht von Hand zählen.** `grep` über die Spec zählt auch die
`Herkunft:`-Zeilen im Abschnitt „Entfallene Anforderungen" mit und liefert
daher zu hohe Werte. `--herkunft NEU` zählt richtig — 56 für `canteen`, nicht
58.

**Umgesetzte Requirements sind eine andere Frage.** Wo Code und Tests laufen,
lautet die Leitfrage faktisch nicht mehr „würde man das heute noch
beschließen", sondern „ist die laufende Umsetzung in Ordnung" — die Antwort
liegt dann meist schon vor. Solche Requirements gesammelt bestätigen, aber im
Beleg festhalten, **worauf** sich die Bestätigung stützt: eine laufende
Implementierung ist ein schwächerer Beleg als eine Nutzerbeobachtung, und der
Unterschied entscheidet, wie fest die Anforderung beim nächsten Durchgang
steht.

**Der Ertrag liegt in den Erläuterungen, nicht in den Requirements.** Von 56
durchgesprochenen Requirements entfiel keines und drei änderten sich. Die
eigentlichen Funde standen daneben: eine Erläuterung, die ein Requirement
still um einen Fall erweiterte, den es nicht nennt; eine Begründung, die im
nächsten Satz das Gegenteil ihrer selbst festlegte. Beim Lesen also nicht bei
`## Requirements` aufhören.

**Widersprüche zu querschnittlichen Regeln laut sagen.** Der Wochenend-Fall
stand gegen SEC-F-060 („keine stillen Fehler"). Er wurde bewusst beibehalten —
aber erst, nachdem der Konflikt benannt war, und mit einer Begründung, die
vorher nirgends stand. Das ist der Normalfall, nicht die Ausnahme: die
Durchsprache produziert seltener Streichungen als nachgetragene Gründe.
