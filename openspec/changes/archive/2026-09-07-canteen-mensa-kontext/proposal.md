# Mensa-Kontext in der Gerichtsliste sichtbar machen

## Why

Seit der Umstellung auf frei wählbare Sortierung und Gruppierung (Change
`canteen-sortieren-gruppieren`, 2026-09-07) verliert die Gerichtsliste in drei
Punkten den Bezug zum Ort:

1. **Die Mensa fehlt am Gericht**, sobald nicht nach Mensa gruppiert wird. Bei
   „keine Gruppierung" und „nach Kategorie" trägt keine Überschrift mehr den
   Mensa-Namen, und die „Angeboten in"-Zeile erscheint nur bei mehr als einer
   anbietenden Mensa. Wer die Liste nach Preis sortiert, sieht damit nicht, wo
   das günstigste Gericht ausgegeben wird — die Kernfrage der Ansicht.
2. **Eine geschlossene Mensa verschwindet aus der Gliederung.** Der
   Geschlossen-Hinweis steht als Fußzeile am Listenende, während die Chip-Leiste
   ihren Chip als nicht auswählbar führt. Die Mensa ist dadurch dreifach
   abgewertet: kein Abschnitt, kein Chip, eine Zeile ganz unten. Und die Frage,
   die sich unmittelbar anschließt — „wann hat sie wieder auf?" —, beantwortet
   die Ansicht gar nicht, obwohl die Öffnungszeiten in den Stammdaten stehen.
3. **Die Öffnungszeit steht weit weg von der Mensa, zu der sie gehört.** Sie
   wird am Listenende als Zeile „Mensa X: geöffnet 11:30–14:30" geführt, also
   getrennt von der Abschnittsüberschrift derselben Mensa.

Dazu kommt eine Beschriftung, die nichts erklärt: Das Reihenfolge-Kriterium
heißt in allen drei Kontexten „Reihenfolge der Quelle". Gemeint sind aber drei
verschiedene Dinge — bei Mensa-Gruppierung die von der Nutzerin selbst
eingestellte Mensa-Reihenfolge, bei Kategorie-Gruppierung die Reihenfolge der
Ausgabestellen wie die Mensa sie führt, und bei der Gerichte-Sortierung die
Reihenfolge, in der die Mensa die Gerichte des Tages ausgibt. „Quelle" ist ein
Begriff aus der Innensicht des Systems (INT-015) und in der Oberfläche fehl am
Platz.

Roadmap-Zuordnung: Nachbesserung an Roadmap-Schritt 4 (Mensaplan). Kein neuer
Schritt, keine Vorwegnahme von Schritt 9 — die bewertungsgekoppelten
Anforderungen bleiben unberührt.

Kein offener Punkt aus `specs/open-questions.md` oder aus dem Abschnitt „Offene
Fragen" der Capability `canteen` wird hier auf Verdacht entschieden. Der dort
offene Punkt „Weitere Gruppierungs-/Sortier-Bausteine" (u. a. Sortierung nach
Öffnungsstatus) bleibt offen: Dieser Schnitt fügt keinen Baustein hinzu, er
macht nur den vorhandenen Kontext sichtbar.

## What Changes

- **Geschlossene Mensa wird ein eigener Abschnitt** — aber nur bei Gruppierung
  „nach Mensa". Jede gewählte Mensa erhält dann einen Abschnitt in der gewählten
  Gruppenreihenfolge, auch ohne Angebot; statt Gerichten steht darin der Hinweis,
  dass sie an diesem Tag geschlossen ist. Bei „keine Gruppierung" und „nach
  Kategorie" bleibt der Geschlossen-Hinweis wie bisher am Listenende — dort gibt
  es keinen Abschnitt, in den er gehören könnte.
  Das kehrt die Erläuterung „Geschlossene Mensa am Seitenende" bewusst um; die
  Begründung („verdrängt nichts vom tatsächlichen Angebot") gilt für die
  ungegliederte Liste weiter, nicht aber für eine nach Mensa gegliederte, in der
  eine fehlende Mensa als Lücke gelesen wird.
- **Wiedereröffnungshinweis** unter dem Geschlossen-Hinweis: der nächste
  Wochentag, für den die Mensa-Stammdaten eine Öffnungszeit führen. Quelle sind
  ausschließlich die gepflegten wöchentlichen Öffnungszeiten (entschieden
  2026-09-07) — kein zusätzlicher Speiseplan-Abruf, offline verfügbar. Der
  Hinweis spricht deshalb von „wieder geöffnet", nicht von „wieder Gerichte":
  Feiertage und vorlesungsfreie Zeit bildet er nicht ab, und eine Aussage über
  das Angebot wäre von den Daten nicht gedeckt (SEC-F-060, keine stillen
  Falschaussagen).
- **Öffnungszeit an der Abschnittsüberschrift** statt am Listenende: bei
  Gruppierung „nach Mensa" steht sie als kompakte Angabe unmittelbar neben dem
  Mensa-Namen. Bei den übrigen Gruppierungen bleibt sie am Listenende, weil es
  dort keine Mensa-Überschrift gibt.
- **Mensa am Gericht, wenn die Gliederung sie nicht trägt**: Bei „keine
  Gruppierung" und „nach Kategorie" nennt jedes Gericht seine anbietende(n)
  Mensa/Mensen. Bei Gruppierung „nach Mensa" bleibt es wie bisher — die
  Überschrift trägt den Ort, genannt werden nur weitere anbietende Mensen. Ist
  ohnehin nur eine Mensa gewählt, entfällt die Angabe ganz.
- **Vollständig weggefilterte Mensa behält ihren Abschnitt** bei Mensa-Gruppierung,
  mit einem eigenen Hinweis, der sie vom Geschlossen-Fall unterscheidet. Ohne
  diese Ergänzung entstünde durch die vorige Änderung eine Lücke, die wie
  „geschlossen" aussähe, es aber nicht ist.
- **Chips folgen den Abschnitten**: Bei Mensa-Gruppierung hat damit jede gewählte
  Mensa einen Abschnitt und ihr Chip ist auswählbar. Nicht auswählbar bleiben nur
  Gruppen ohne Abschnitt — das betrifft künftig allein die Kategorie-Gruppierung.
- **Beschriftung des Reihenfolge-Kriteriums wird kontextabhängig** (entschieden
  2026-09-07): bei Mensa-Gruppierung „Meine Mensa-Reihenfolge", bei
  Kategorie-Gruppierung und bei der Gerichte-Sortierung „Reihenfolge der Mensa".
  Die Beschriftung „Reihenfolge der Quelle" entfällt in der Oberfläche; der
  Begriff „Quelle" bleibt in Spec-Prosa und Code-Kommentaren zulässig, wo er die
  Herkunft aus INT-015 bezeichnet.
- **Unverändert:** die „Alle Mensen"-Ansicht (weiterhin fest nach Mensa
  gegliedert, Mensen ohne Angebot weiterhin ausgelassen), die maßgebliche Mensa,
  die Presets, die Filterlogik und jede Sortierregel.

Bewusst nicht Teil dieses Schnitts: eine Vorausschau über echte Speisepläne, um
den ersten Tag mit tatsächlichem Angebot zu nennen (verworfen 2026-09-07 — bis zu
sieben zusätzliche Abrufe je geschlossener Mensa, offline wirkungslos); ein
Öffnungsstatus „öffnet in 20 Minuten" oder „jetzt geöffnet"; und jede Änderung an
der Preisanzeige.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `canteen`: sieben Requirements ändern sich, vier kommen hinzu.
  - Geändert: „Ausweis mehrerer anbietender Mensen je Gericht" (Mensa auch bei
    einer anbietenden Mensa, wenn die Gliederung den Ort nicht trägt),
    „Gliederung nach Mensa-Auswahlreihenfolge bei aktiver Mensa-Gruppierung"
    (Abschnitt je gewählter Mensa statt nur je Mensa mit Angebot),
    „Geschlossen-Hinweis für Mensa ohne Angebot" (Ort des Hinweises hängt von der
    Gruppierung ab), „Keine Öffnungszeit für Mensa ohne Angebot" (gilt für jede
    Darstellungsform, nicht nur für die Zeile), „Nicht auswählbare Chips ohne
    sichtbaren Abschnitt" (nur noch Gruppen ohne Abschnitt), „Sortierkriterien
    für Gerichte" (Kriterium heißt „Reihenfolge der Mensa"),
    „Gruppenreihenfolge-Kriterien bei Mensa-Gruppierung" (Kriterium heißt
    „eingestellte Mensa-Reihenfolge").
  - Neu: „Wiedereröffnungshinweis an der geschlossenen Mensa", „Öffnungszeit an
    der Mensa-Abschnittsüberschrift", „Hinweis bei vollständig gefilterter
    Mensa", „Beschriftung des Reihenfolge-Kriteriums nach seiner Bedeutung".

## Impact

- **Betroffener Code (App), ausschließlich Anzeige:**
  - geändert: `app/src/areas/canteen/screens/CanteenScreen.tsx` (Abschnittsaufbau,
    Kopfzeile je Abschnitt, Fußbereich, Gericht-Karte),
    `app/src/areas/canteen/sortierung.ts` (Abschnitte für gewählte Mensen ohne
    Gerichte; `Abschnitt` bekommt einen Zustand),
    `app/src/areas/canteen/screens/SortierGruppierScreen.tsx` (kontextabhängige
    Beschriftung), `app/src/i18n/de.json` + `en.json`.
  - neu: eine reine Funktion für den nächsten Öffnungstag
    (`app/src/areas/canteen/oeffnungszeiten.ts`) mit eigenen Tests; die
    Wochentag-Auflösung aus `CanteenScreen.tsx` zieht mit dorthin.
  - Tests: je „muss"-Requirement mindestens ein `describe` mit Requirement-Titel;
    `sortierung.test.ts`, `screens/CanteenScreen.test.tsx`,
    `screens/SortierGruppierScreen.test.tsx` nachziehen.
- **Kein Vertrag, kein Backend, keine Integration betroffen.**
  `openspec/specs/api-contract.yaml` bleibt unberührt; `oeffnungszeiten` steht
  bereits im Mensa-Schema.
- **Keine neue Abhängigkeit, kein neuer Speicherschlüssel, keine Übertragung.**
- **Prosa-Nachführung in `openspec/specs/canteen/spec.md`** im selben Merge:
  Erläuterung „Geschlossene Mensa am Seitenende" auf die neue Regel umschreiben,
  „Reihenfolge der Quelle" in der Bausteine-Erläuterung durch die neue
  Beschriftung ersetzen, Umsetzungsstand fortschreiben.
