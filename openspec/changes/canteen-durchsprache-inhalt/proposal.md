# Inhaltliche Durchsprache der Capability canteen

## Warum

Nach `docs/agents/herkunft-durchsprache.md` durchgesprochen, Leitfrage je Requirement: *Würde der FSR das heute noch so beschließen — und woran erkennt man das?* Vorgenommen am 2026-09-05 für alle 56 `NEU`-Requirements der Capability `canteen`.

Eingestiegen beim Sortier-/Gruppierblock (15 Requirements), den die Anleitung ausdrücklich zuerst nennt: Er ist spec-only — `app/src/areas/canteen/ui/` enthält nur Ankernavigation und Filterzugang —, eine Streichung kostet dort keinen Code, und die Preset-Liste war am 2026-09-04 bereits einmal von sechs auf vier gekürzt worden.

**Ergebnis: kein Requirement entfällt.** Drei ändern sich, der Rest bleibt mit nachgetragenem Beleg. Das ist ein schmaleres Ergebnis, als der Umfang des Blocks vermuten ließ, und der Grund ist benennbar: die 41 Requirements außerhalb des Blocks sind umgesetzt und durch Tests belegt, und die Umsetzung trägt.

## Was sich ändert

**Die Voreinstellung wechselt auf „Mensa, günstigstes zuerst".** Bisher war „Mensa, eigene Bewertung" voreingestellt — ein Preset, das bis Roadmap-Schritt 9 nicht funktioniert, weil es keine Bewertungsdaten gibt, und das bis dahin alphabetisch sortiert. Die App wäre monatelang in einem Zustand gestartet, dessen Name nicht beschreibt, was er tut. „Mensa, günstigstes zuerst" ist das einzige gruppierte Preset, das heute vollständig trägt; mit Schritt 9 kann die Voreinstellung zurückwechseln.

**Unbewertete Gerichte ordnen sich untereinander nach Quellreihenfolge statt alphabetisch.** Bis Schritt 9 trägt kein Gericht eine Bewertung, die Regel greift also für die gesamte Liste. Alphabetisch ordnet dann nach einem Merkmal, das niemanden interessiert; die Quellreihenfolge hält die Gliederung der Mensa zusammen und macht den Übergangszustand brauchbar.

**Die Sortierrichtung bekommt ein eigenes Auswahlfeld.** Kriterium und Richtung werden getrennt gewählt, statt als kombinierte Einträge. Alle fünf Kriterien bleiben in beiden Richtungen kombinierbar, auch „Reihenfolge der Quelle, absteigend" — die Vorgabe „maximale Flexibilität" vom 2026-09-04 wurde bestätigt.

## Was bleibt, mit nachgetragenem Beleg

- **Vier vordefinierte Presets.** Zwei davon sind bis Schritt 9 ununterscheidbar; das löst sich von selbst auf und wird in den Erläuterungen festgehalten, damit es beim nächsten Durchgang nicht als Fehler auffällt.
- **Gruppierung „nach Kategorie"** als Baustein ohne eigenes Preset — an der Hauptmensa aussagekräftig, anderswo nicht, die Abstufung ist richtig.
- **Eigene Presets** vollständig: speichern, umbenennen, löschen, merken.
- **Chip-Leiste ausblenden ohne Gruppierung** — das einzige Requirement des Blocks, das bestehenden Code anfasst (`AnkerListe.tsx`); der Eingriff fällt ohnehin an, sobald die Gruppierung wählbar wird.
- **Zwei getrennte Zugänge im Kopfbereich** für Filter und Sortierung — verschiedene Fragen, verschiedene Menüs.
- **Ausblenden in der Hauptansicht, Ausgrauen in der Vergleichsansicht** — zwei Ansichten beantworten zwei Fragen.
- **Die sechs Lieblingsgericht- und Benachrichtigungs-Requirements.** Sie sind bis Schritt 9 nicht erfüllbar und heute nur umgesetzt, weil der Stern-Prototyp sie trägt, der mit Issue #19 verschwindet. Das wird ergänzt, sonst liest ein Nachfolger die grünen Tests als Erfüllungsnachweis.
- **Die 35 übrigen umgesetzten Requirements**, gesammelt bestätigt. Die Bestätigung stützt sich auf die laufende Implementierung, nicht auf eine Nutzerbeobachtung — auch das steht im Beleg, weil es den Unterschied ausmacht.

## Zwei Erläuterungen werden berichtigt

**Der Datenschutzhinweis im Filtermenü.** Die Begründung verlangte eine „unmittelbare, unübersehbare Zusicherung, nicht nur eine an anderer Stelle nachlesbare" — und der nächste Satz verschob den Hinweis ans Seitenende. Die Position bleibt (ein Hinweis über der Auswahl wird nach dem dritten Öffnen nicht mehr gelesen), der Anspruch „unübersehbar" entfällt.

**Das Überspringen angebotsfreier Wochenendtage.** Die Erläuterung erweitert das Requirement still um einen Fall, den es nicht nennt: fehlt der Bestand (offline, Ladefehler), gilt der Tag als angebotsfrei und wird übersprungen. Damit wird ein Ladefehler zu einer Tatsachenaussage, was gegen SEC-F-060 (keine stillen Fehler) steht. Bewusst beibehalten, aber jetzt mit dem Grund, der das trägt: die Mensen des Studierendenwerks führen an Wochenenden praktisch nie ein Angebot, die Fehldeutung ist deshalb folgenlos. Der Grund stand bisher nirgends.
