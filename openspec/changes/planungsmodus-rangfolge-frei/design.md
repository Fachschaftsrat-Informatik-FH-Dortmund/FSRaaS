## Context

Der erste Zug (Change `planungsmodus-voreinstellungen-anpinnen`) hat die acht
Kriterien als reine Bewertungsfunktionen (`planungskriterien.ts`), den greedy
Vorschlag (`planungsvorschlag.ts`) und einen gerätelokalen Speicher der
Planungseinstellungen (`planungseinstellungen.ts`) gebaut. Gespeichert war
dort nur der Name der gewählten Voreinstellung; `rangfolgeAus` las daraus die
feste Liste. `bewerteEntwurf` nimmt bereits eine beliebige Liste von
Kriterien in beliebiger Reihenfolge entgegen, und das Kriterium
*Zeitfenster* rechnet schon, sobald `KriterienParameter.zeitfenster` gesetzt
ist. Für diesen Zug fehlen also nur Speicher und Bedienung.

## Goals / Non-Goals

**Goals:** Rangfolge frei ordnen und Kriterien abschalten, barrierefrei;
Voreinstellungen als Abkürzung erhalten; Zeitfenster festlegen und
kennzeichnen; alte Bestände ohne Zutun übernehmen.

**Non-Goals:** Ziehgeste, Zeitfenster je Wochentag, weitere Kriterien.

## Decisions

### 1. Gespeichert wird die Rangfolge, die Voreinstellung wird abgeleitet

Der Speicher hält `rangfolge: Kriterium[]`, die eingeschalteten Kriterien in
ihrer Reihenfolge. Was fehlt, ist abgeschaltet. Die Reihenfolge abgeschalteter
Kriterien hat keine Bedeutung und wird nicht gespeichert.

Welche Voreinstellung gewählt ist, wird nicht gespeichert, sondern berechnet
(`voreinstellungAus`): die Voreinstellung, deren Liste der Rangfolge genau
gleicht, sonst keine. Damit gibt es keinen Zustand, in dem Name und
Rangfolge auseinanderlaufen (Szenario „Eigene Rangfolge"). Wer von Hand genau
die Liste einer Voreinstellung herstellt, sieht diese wieder als gewählt. Das
ist richtig, denn die Reihung ist dann dieselbe.

Wird ein Kriterium eingeschaltet, kommt es ans Ende. Das ist die
vorsichtigste Stelle: Es wirkt zunächst nur bei Gleichstand aller anderen
und verändert keinen bestehenden Vorschlag ungefragt. Erst ein Verschieben
nach oben gibt ihm mehr Gewicht.

Alle Kriterien abzuschalten ist erlaubt. Der Vorschlag löst dann nur noch
Konflikte auf; bei Gleichstand bleibt die bisherige Wahl (Entscheidung 3 des
ersten Zugs). Ein Hinweis in den Einstellungen sagt das.

**Übernahme alter Bestände.** Ein Bestand aus dem ersten Zug hat kein Feld
`rangfolge`, nur `voreinstellung`. Dann füllt diese die Rangfolge. Ein
unlesbares Feld fällt auf die Vorgabe zurück und wird protokolliert;
unbekannte oder doppelte Kriterien in einer gespeicherten Rangfolge entfallen
einzeln (DATA-F-020, SEC-F-060). Geschrieben wird nur noch `rangfolge`.

*Verworfen:* eine feste Liste aller acht Kriterien mit `an`-Flag. Sie hätte
abgeschalteten Kriterien eine Stelle gegeben, die nichts bedeutet, und Auf-
und Ab-Schaltflächen hätten über abgeschaltete Zeilen hinweg springen müssen.

### 2. Umordnen über Auf- und Ab-Schaltflächen

Jede Zeile der eingeschalteten Kriterien hat links den Schalter (Kästchen
plus Stellenzahl, `accessibilityRole="switch"`) und rechts zwei
Schaltflächen mit Pfeilsymbol, je 44 × 44 dp. Ihre Beschriftung für
Hilfstechnologien nennt das Kriterium („Anwesenheitszeit nach oben").

- **Rand.** Am oberen bzw. unteren Rand ist die betreffende Schaltfläche
  sichtbar gesperrt (`disabled`, abgeblendet), nicht ausgeblendet. So stehen
  alle Pfeile spaltengenau untereinander und eine Zeile verrutscht nicht,
  wenn sie an den Rand wandert.
- **Ansage.** Nach dem Verschieben bleibt der Fokus des Bildschirmlesers auf
  der Schaltfläche, die Zeile ist aber darunter weggerückt. Das System sagt
  deshalb die neue Stelle über `AccessibilityInfo.announceForAccessibility`
  an („Anwesenheitszeit steht jetzt an Stelle 1"). Eine unsichtbare
  `accessibilityLiveRegion` wurde verworfen: Android liest Elemente ohne
  Ausdehnung oder mit Deckkraft 0 nicht zuverlässig vor, und iOS kennt die
  Eigenschaft nicht.
- **Abgeschaltete Kriterien** stehen darunter in einem eigenen Abschnitt,
  ohne Pfeile.

*Verworfen:* eine Ziehgeste (Drag and Drop) als einziger Weg. Sie bräuchte
eine zusätzliche Abhängigkeit und wäre ohne zweiten sichtbaren Weg nicht
zulässig. Mit acht Einträgen ist der Weg über Pfeile kurz genug: Jede
Umordnung braucht höchstens sieben Schritte.

### 3. Zeitfenster: ein Fenster, halbstündlich, 6 bis 22 Uhr

`zeitfenster: { vonMin, bisMin } | null`. `null` heißt „nicht festgelegt"
(Vorgabe). Eingeschaltet startet es bei 8:00–18:00. Beide Grenzen werden
wie die übrigen Werte über Schritt-Schaltflächen eingestellt, in
30-Minuten-Schritten zwischen 6:00 und 22:00. Der Beginn bleibt stets vor
dem Ende: Die Schaltfläche, die das verletzen würde, ist gesperrt, und der
Speicher weist ein solches Fenster zurück.

Das Fenster gilt für alle Wochentage gleich. Das folgt der Annahme der
offenen Frage in der Capability, ohne sie zu entscheiden.

Die **Kennzeichnung** steht in der Zeile der abgeleiteten Angaben jeder
Terminzeile des Planungsmodus: „◷ außerhalb des Zeitfensters", in
gedämpfter Farbe. Das Symbol trägt die Bedeutung zusätzlich zum Text. Die
Zeile bleibt wählbar und wird nicht ausgeblendet. Außerhalb heißt: Der
Termin beginnt vor dem Fensterbeginn oder endet nach dem Fensterende, wie im
Kriterium. Ist das Kriterium *Zeitfenster* abgeschaltet, weist der
Einstellungsbildschirm darauf hin, dass das Fenster dann nur kennzeichnet.

### 4. Werkzeugzeile

Die Werkzeugzeile des Planungsmodus nennt die abgeleitete Voreinstellung,
bei einer eigenen Rangfolge „Eigene Rangfolge". Sonst ändert sich am
Planungsmodus nichts: Der Vorschlag liest die Rangfolge erst beim Auslösen.

## Risks / Trade-offs

- **Langer Einstellungsbildschirm.** Voreinstellung, Rangfolge, Zeitfenster,
  Pflicht, Vorbereitungszeiten und Abstand stehen untereinander. Die
  Abschnitte tragen Überschriften (`accessibilityRole="header"`), sodass ein
  Bildschirmleser zwischen ihnen springen kann. Ob die Länge am Gerät stört,
  zeigt die Geräteabnahme.
- **Eingeschaltetes Kriterium ans Ende.** Wer erwartet, dass ein neu
  eingeschaltetes Kriterium sofort sichtbar wirkt, sieht womöglich keine
  Änderung des Vorschlags. Der Hinweistext oben im Abschnitt erklärt das
  Prinzip „das oberste entscheidet".
