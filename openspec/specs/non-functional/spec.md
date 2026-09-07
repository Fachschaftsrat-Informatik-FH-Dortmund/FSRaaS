## Purpose

Projektweite Qualitätsanforderungen: Leistung, Verfügbarkeit, Ressourcenverbrauch, Sprache, Wartbarkeit, Bildschirmausrichtung und Store-Veröffentlichung. Feature-spezifische Verschärfungen gehören in die jeweilige Feature-Capability und verweisen hierher. Vormals `specs/platform/non-functional.md` (Präfix `NFR`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: iOS-Mindestversion

Die Mindestversion für iOS muss 15 betragen. Herkunft: NEU (vormals NFR-N-010).

#### Scenario: Gerät unterhalb der Mindestversion
- **WHEN** ein Gerät mit iOS unter Version 15 die App installieren oder starten will
- **THEN** unterstützt das System dieses Gerät nicht

### Requirement: Android-Mindestversion

Die Mindestversion für Android muss API 29 (Android 10) betragen. Herkunft: NEU (vormals NFR-N-020).

#### Scenario: Gerät unterhalb der Mindestversion
- **WHEN** ein Gerät mit einer API-Stufe unter 29 die App installieren oder starten will
- **THEN** unterstützt das System dieses Gerät nicht

### Requirement: Startzeit bis zur ersten nutzbaren Ansicht

Die Startzeit bis zur ersten nutzbaren Ansicht sollte unter 2 Sekunden liegen (vorgeschlagen, zu bestätigen). Herkunft: NEU (vormals NFR-N-030).

#### Scenario: Kaltstart
- **WHEN** die App aus dem beendeten Zustand gestartet wird
- **THEN** ist die erste nutzbare Ansicht innerhalb von 2 Sekunden sichtbar

### Requirement: Reaktionszeit beim Blättern durch Zeit- oder Datumsseiten

Die Reaktionszeit beim Blättern durch Wochentage oder Datumsseiten sollte unter 200 ms liegen (vorgeschlagen, zu bestätigen). Herkunft: NEU (vormals NFR-N-040).

#### Scenario: Wechsel der Datumsseite
- **WHEN** die Nutzerin zu einer benachbarten Wochentags- oder Datumsseite blättert
- **THEN** reagiert die Ansicht innerhalb von 200 ms wahrnehmbar

### Requirement: Bedarfsgesteuertes Nachladen und Zwischenspeichern blätterbarer Seiten

Das System muss Inhalte blätterbarer Zeit- oder Datumsseiten bei Bedarf je Seite nachladen und im Zwischenspeicher vorhalten. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart:9 (vormals NFR-F-050).

#### Scenario: Erneuter Aufruf einer bereits geladenen Seite
- **WHEN** eine Nutzerin zu einer zuvor bereits geladenen Zeit- oder Datumsseite zurückblättert
- **THEN** zeigt das System den Zwischenspeicher, ohne die Seite erneut vom Fremdsystem abzurufen

### Requirement: Ladezustand-Anzeige ab 300 ms

Das System sollte bei Netzabrufen ab 300 ms einen Ladezustand anzeigen (vorgeschlagen, zu bestätigen). Herkunft: NEU (vormals NFR-N-060).

#### Scenario: Langsamer Netzabruf
- **WHEN** ein Netzabruf länger als 300 ms andauert
- **THEN** zeigt das System einen Ladezustand an

### Requirement: Abbruch und Wiederholen-Option bei Netzabruf-Zeitüberschreitung

Falls ein Netzabruf eine vorgegebene Zeitspanne überschreitet, muss das System den Abruf abbrechen und eine Fehlermeldung mit Wiederholen-Option anzeigen. Herkunft: NEU (vormals NFR-F-070).

#### Scenario: Timeout beim Netzabruf
- **WHEN** ein Netzabruf 10 Sekunden überschreitet
- **THEN** bricht das System den Abruf ab und zeigt eine Fehlermeldung mit Wiederholen-Option

### Requirement: Bereichsisolation bei Ausfall eines Fremdsystems

Falls ein Fremdsystem ausfällt, darf nur der davon abhängige Funktionsbereich beeinträchtigt sein, nicht die gesamte App. Herkunft: NEU (vormals NFR-N-080). Risikoeinschätzung je System siehe Capability `integrations`.

#### Scenario: Ausfall eines einzelnen Fremdsystems
- **WHEN** eines der in Capability `integrations` geführten Fremdsysteme nicht erreichbar ist
- **THEN** bleiben alle Funktionsbereiche nutzbar, die nicht von diesem System abhängen

### Requirement: Feste, sparsame Hintergrundabruf-Intervalle

Das System muss Hintergrundabrufe in festen, sparsamen Intervallen ausführen und darf gültige Zwischenspeicher nicht vorzeitig erneut abrufen. Herkunft: NEU (vormals NFR-N-090). Ein fester Zeitplan darf an bekannte Nutzungsspitzen angelehnt sein (z. B. Speiseplan-Auffrischung vor der Morgen- und Mittagszeit, Capability `backend-and-api`), solange die Auslösung nicht von der Anfragemenge abhängt.

#### Scenario: Gültiger Zwischenspeicher vorhanden
- **WHEN** ein Hintergrundabrufzeitpunkt eintritt und der Zwischenspeicher für die betroffenen Daten noch gültig ist
- **THEN** unterbleibt der erneute Abruf

### Requirement: Rücksicht auf Mobilfunkverbindungen bei umfangreichen Abrufen

Umfangreiche Abrufe (z. B. Wiki-Vorabladen) sollten Rücksicht auf Mobilfunkverbindungen nehmen und deren Datenverbrauch begrenzen. Herkunft: NEU (vormals NFR-N-100).

#### Scenario: Umfangreicher Abruf über Mobilfunk
- **WHEN** ein umfangreicher Abruf wie das Wiki-Vorabladen über eine Mobilfunkverbindung ausgelöst würde
- **THEN** begrenzt das System den dadurch verursachten Datenverbrauch

### Requirement: Deutsch als einzige Oberflächensprache (entfallen)

Das System muss Deutsch als einzige Oberflächensprache verwenden. — entfallen, ersetzt durch das Requirement „Wahl zwischen Deutsch und Englisch als Oberflächensprache" (Entscheidung FSR FB4, 2026-08-25: Mehrsprachigkeit von Anfang an statt nur vorsorglich architektonisch offenzuhalten). Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/main.dart:37 (vormals NFR-F-110).

#### Scenario: Nicht mehr geltendes Verhalten
- **WHEN** die App eine Oberflächensprache wählt
- **THEN** ist Deutsch als einzige mögliche Sprache nicht mehr zutreffend — es gilt stattdessen die Sprachwahl aus dem Requirement „Wahl zwischen Deutsch und Englisch als Oberflächensprache"

### Requirement: Wahl zwischen Deutsch und Englisch als Oberflächensprache

Das System muss der Nutzerin die Wahl zwischen Deutsch und Englisch als Oberflächensprache ermöglichen. Herkunft: NEU (vormals NFR-F-115).

#### Scenario: Sprachwahl in den Einstellungen
- **WHEN** die Nutzerin zwischen Deutsch und Englisch als Oberflächensprache wählt
- **THEN** zeigt das System die Oberfläche in der gewählten Sprache

### Requirement: Deutsche Formatkonvention für Datum, Zeit und Währung

Das System muss Datums-, Zeit- und Währungsangaben nach deutscher Konvention formatieren. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/main.dart:37 (vormals NFR-F-120). Gilt unabhängig von der gewählten Oberflächensprache.

#### Scenario: Anzeige in englischer Oberfläche
- **WHEN** die Oberflächensprache auf Englisch eingestellt ist und ein Datum, eine Uhrzeit oder ein Währungsbetrag angezeigt wird
- **THEN** verwendet das System weiterhin die deutsche Formatkonvention

### Requirement: Architektonische Offenheit für künftige Mehrsprachigkeit (entfallen)

Die Architektur sollte künftige Mehrsprachigkeit nicht grundsätzlich ausschließen, auch wenn sie aktuell nicht umgesetzt wird. — entfallen, da Mehrsprachigkeit (Deutsch + Englisch) von Anfang an umgesetzt wird statt nur vorsorglich offengehalten (Entscheidung FSR FB4, 2026-08-25). Herkunft: NEU (vormals NFR-N-130).

#### Scenario: Nicht mehr geltendes Verhalten
- **WHEN** die Architektur auf Mehrsprachigkeit geprüft wird
- **THEN** ist die vorsorgliche Offenheit gegenstandslos, da Deutsch und Englisch bereits umgesetzt sind

### Requirement: Keine Verhaltensänderung ohne Spec-Änderung

Das System muss so betrieben werden, dass jede Verhaltensänderung mit einer Änderung der zugehörigen Spec einhergeht — durch eine automatisierte CI-Pipeline durchgesetzt, nicht durch eine benannte Kontrollperson (Entscheidung FSR FB4, 2026-08-25). Herkunft: NEU (vormals NFR-N-140). Die automatisierbare Prüfung dieser Regel ist Sache der Capability `quality-and-testing`.

#### Scenario: Pull Request ändert Verhalten ohne Spec-Delta
- **WHEN** ein Pull Request eine Verhaltensänderung enthält, aber kein zugehöriges Spec-Delta mitbringt
- **THEN** blockiert die CI-Pipeline den Merge

### Requirement: Hochformat als einzige Bildschirmausrichtung

Die App muss Hochformat als einzige Bildschirmausrichtung verwenden, ohne Ausnahmen für einzelne Ansichten. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/main.dart:113 (vormals NFR-N-150). Breite Inhalte (z. B. Wiki-Tabellen, Raumpläne) werden stattdessen horizontal scrollbar gestaltet, siehe Capability `ux-and-theming`. Auf Bildschirmen ab 1024 px Breite (Tablets, Faltgeräte) gilt die Ausrichtung nicht als erzwungen; adaptives Layout ist dort zulässig (Ergänzung 2026-08-26, derselbe Schwellwert wie in der Capability `admin`).

#### Scenario: Smartphone unterhalb der Breitenschwelle
- **WHEN** die App auf einem gewöhnlichen Smartphone unterhalb von 1024 px Breite läuft
- **THEN** erzwingt das System durchgehend Hochformat, ohne Ausnahme für einzelne Ansichten

#### Scenario: Großer Bildschirm ab 1024 px Breite
- **WHEN** die App auf einem Bildschirm ab 1024 px Breite läuft (Tablet, Faltgerät)
- **THEN** gilt die Hochformat-Vorgabe nicht als erzwungen und adaptives Layout ist zulässig

### Requirement: Vollständig quelloffener Quellcode unter MIT-Lizenz

Der App-Quellcode muss vollständig unter der MIT-Lizenz veröffentlicht werden. Herkunft: NEU (vormals NFR-N-160).

#### Scenario: Veröffentlichung eines neuen Quellcode-Bestandteils
- **WHEN** ein neuer Bestandteil des App-Quellcodes veröffentlicht wird
- **THEN** steht er unter der MIT-Lizenz

### Requirement: Keine proprietären Android-Build-Abhängigkeiten

Der Android-Build darf keine proprietären Abhängigkeiten enthalten, die eine Aufnahme in den F-Droid-Hauptindex verhindern, insbesondere keine Firebase- oder Google-Play-Services-Bibliotheken. Herkunft: Recherche: f-droid.org/en/docs/Inclusion_Policy, 2026-08-25 (vormals NFR-N-170).

#### Scenario: Prüfung des Android-Builds vor F-Droid-Aufnahme
- **WHEN** der Android-Build für die Aufnahme in den F-Droid-Hauptindex geprüft wird
- **THEN** enthält er keine Firebase- oder Google-Play-Services-Bibliotheken oder andere proprietäre Abhängigkeiten

### Requirement: Firebase nur als Messaging-Modul auf iOS

Der iOS-Build darf ausschließlich das Firebase-Messaging-Modul einbinden, kein Firebase Analytics oder Crashlytics. Herkunft: NEU (vormals NFR-N-240). Ohne diese Einschränkung würde die auf Android verfolgte Datensparsamkeits-Linie auf iOS unbemerkt unterlaufen — die Capability `security-and-privacy` untersagt die Übermittlung von Absturzberichten an Dritte für iOS genauso wie für Android.

#### Scenario: Prüfung der eingebundenen Firebase-Module
- **WHEN** die im iOS-Build eingebundenen Firebase-Module geprüft werden
- **THEN** ist ausschließlich das Messaging-Modul enthalten, nicht Analytics oder Crashlytics

### Requirement: Gleicher Funktionsumfang über alle Vertriebswege

Das System muss auf allen drei Vertriebswegen denselben fachlichen Funktionsumfang bereitstellen, mit Ausnahme rein technischer, plattformbedingter Unterschiede (z. B. gewählter UnifiedPush-Distributor gemäß Capability `integrations`). Herkunft: NEU (vormals NFR-F-180).

#### Scenario: Vergleich der Funktionsumfänge
- **WHEN** derselbe fachliche Funktionsumfang über App Store, Play Store und F-Droid verglichen wird
- **THEN** unterscheiden sich die Vertriebswege nur in rein technischen, plattformbedingten Details

### Requirement: Einhaltung der Google-Play-Ziel-API-Stufe

Der Android-Build muss die von Google Play jeweils zum Veröffentlichungszeitpunkt geforderte Mindest-Ziel-API-Stufe einhalten. Herkunft: Recherche: developer.android.com/google/play/requirements/target-sdk, 2026-08-25 (vormals NFR-N-190).

#### Scenario: Veröffentlichung eines Updates
- **WHEN** ein Android-Update auf Google Play veröffentlicht wird
- **THEN** erfüllt der Build die zu diesem Zeitpunkt von Google Play geforderte Mindest-Ziel-API-Stufe

### Requirement: Geschlossener Test vor Google-Play-Produktivfreigabe

Das System muss vor der ersten Google-Play-Produktivfreigabe einen geschlossenen Test mit mindestens 12 durchgängig teilnehmenden Testenden über mindestens 14 zusammenhängende Tage durchlaufen, sofern das verwendete Google-Play-Entwicklerkonto dieser Auflage unterliegt. Herkunft: Recherche: support.google.com/googleplay/android-developer/answer/14151465, 2026-08-25 (vormals NFR-N-200).

#### Scenario: Neu angelegtes Entwicklerkonto vor erster Freigabe
- **WHEN** ein neu angelegtes Google-Play-Entwicklerkonto der Testauflage unterliegt und die erste Produktivfreigabe ansteht
- **THEN** durchläuft die App zuvor einen geschlossenen Test mit mindestens 12 durchgängig teilnehmenden Testenden über mindestens 14 zusammenhängende Tage

### Requirement: Reproduzierbarer F-Droid-Build

Der Android-Build muss so gestaltet sein, dass F-Droids Build-Server ihn ohne Zugriff auf projektinterne Signaturschlüssel oder Geheimnisse reproduzierbar aus dem öffentlichen Quellcode erzeugen können. Herkunft: Recherche: f-droid.org/docs/Reproducible_Builds, 2026-08-25 (vormals NFR-N-210).

#### Scenario: Build durch F-Droids Build-Server
- **WHEN** F-Droids Build-Server den Android-Build aus dem öffentlichen Quellcode erzeugt, ohne Zugriff auf projektinterne Signaturschlüssel oder Geheimnisse
- **THEN** entsteht ein reproduzierbares, identisches Build-Ergebnis

### Requirement: Öffentlich erreichbare Datenschutzerklärung je Vertriebsweg

Das System muss für jeden Vertriebsweg eine öffentlich erreichbare, versionsunabhängige URL zur Datenschutzerklärung bereitstellen. Herkunft: NEU (vormals NFR-N-220).

#### Scenario: Aufruf der Datenschutzerklärung aus einem Store-Eintrag
- **WHEN** eine Nutzerin die in einem der drei Store-Einträge hinterlegte URL zur Datenschutzerklärung aufruft
- **THEN** erreicht sie die aktuelle Datenschutzerklärung, unabhängig von der installierten App-Version

### Requirement: Eindeutige und konsistente Versions- und Build-Nummer

Anzeigeversion und fortlaufende Build-Nummer müssen über alle drei Vertriebswege hinweg eindeutig und konsistent vergeben werden, sodass ein Fehlerbericht eindeutig einer Quellcode-Version zuordenbar ist. Herkunft: NEU (vormals NFR-N-230).

#### Scenario: Fehlerbericht aus einem beliebigen Vertriebsweg
- **WHEN** ein Fehlerbericht mit Anzeigeversion und Build-Nummer eingeht, unabhängig davon über welchen Vertriebsweg die App installiert wurde
- **THEN** lässt sich daraus eindeutig die zugehörige Quellcode-Version bestimmen

### Requirement: Fester Store-Titel der App

Die App muss auf allen drei Vertriebswegen unter dem Titel „FSR Informatik – FH Dortmund" geführt werden. Herkunft: NEU (Entscheidung FSR FB4, 2026-09-07). Der Titel nennt Träger, Fachgebiet und Hochschule und deckt damit die Begriffe ab, unter denen die Zielgruppe sucht; „FB4" allein ist außerhalb der Hochschule bedeutungslos. Mit 28 Zeichen bleibt er innerhalb der von Google Play zugelassenen 30 Zeichen. Der Titel ist vom Gerätenamen zu unterscheiden, siehe Requirement „Vom Store-Titel getrennter Gerätename".

#### Scenario: Store-Eintrag wird angelegt oder geändert
- **WHEN** der Eintrag der App in einem der drei Vertriebswege angelegt oder geändert wird
- **THEN** trägt er den Titel „FSR Informatik – FH Dortmund"

#### Scenario: Längengrenze des Play-Store-Titels
- **WHEN** der Titel in die Google Play Console eingetragen wird
- **THEN** unterschreitet er mit 28 Zeichen deren Grenze von 30 Zeichen

### Requirement: Unveränderlicher Paket-Identifikator

Die App muss auf Android und iOS dauerhaft unter dem Identifikator `de.fsrfb4.app` veröffentlicht werden. Herkunft: NEU (Entscheidung FSR FB4, 2026-09-07). Der Identifikator folgt der Reverse-DNS-Konvention aus `fsrfb4.de`, einer Domain im Verfügungsbereich des FSR (dort läuft unter `app.fsrfb4.de` das Altbackend, Capability `integrations` INT-008). Er ist nach der ersten Veröffentlichung weder bei Google Play noch bei F-Droid änderbar; ein Wechsel erzwingt einen neuen Store-Eintrag und verwirft Bewertungen, Installationszahlen und die automatische Update-Zustellung an Bestandsnutzende. Der Identifikator der Android-Alt-App (`de.fsrfb4.fb4`) bleibt davon unberührt — beide Einträge bestehen nebeneinander.

#### Scenario: Erzeugung eines Veröffentlichungs-Builds
- **WHEN** ein Build für Android oder iOS erzeugt wird
- **THEN** trägt er den Identifikator `de.fsrfb4.app`

#### Scenario: Abgrenzung zur Android-Alt-App
- **WHEN** der Store-Eintrag der Neuentwicklung angelegt wird
- **THEN** entsteht er als eigener Eintrag unter `de.fsrfb4.app` und lässt den Alt-Eintrag `de.fsrfb4.fb4` unangetastet

### Requirement: Vom Store-Titel getrennter Gerätename

Die App muss auf dem Gerät unter dem Namen „FSR Informatik" erscheinen. Herkunft: NEU (abgeleitet aus der Entscheidung FSR FB4, 2026-09-07). Der Name unter dem App-Symbol ist ein vom Store-Titel getrenntes Feld und unterliegt einer erheblich engeren Längengrenze; beide Plattformen kürzen ihn mit Auslassungspunkten. Der vollständige Store-Titel erschiene dort als Fragment, weshalb der Gerätename bewusst kürzer gehalten ist.

#### Scenario: Darstellung auf dem Startbildschirm
- **WHEN** die App auf dem Startbildschirm eines Geräts erscheint
- **THEN** steht unter ihrem Symbol „FSR Informatik" und nicht der vollständige Store-Titel

#### Scenario: Abweichung von Store-Titel und Gerätename
- **WHEN** der Store-Titel geändert wird
- **THEN** folgt der Gerätename nicht automatisch, sondern wird eigenständig entschieden

## Plattform-Mindestversionen

| Plattform | Wert | Begründung | Status |
|---|---|---|---|
| iOS | 15 | Übliches Support-Fenster aktueller Apple-Geräte, aktueller React-Native-Standardwert | bestätigt, FSR FB4, 2026-08-25 |
| Android | 10 (API 29) | React-Native-Mindestunterstützung und übliche Verbreitung. Die Android-Alt-App setzt API 26 als Untergrenze — die höhere Schwelle schließt ältere Geräte aus, die dort noch bedient wurden; bewusst in Kauf genommen | bestätigt, FSR FB4, 2026-08-25 |

## Leistung

| Kennzahl | Zielwert (vorgeschlagen) | Status |
|---|---|---|
| Startzeit bis zur ersten nutzbaren Ansicht | unter 2 Sekunden | offen, zu bestätigen |
| Reaktionszeit beim Blättern durch Wochentage/Datumsseiten | unter 200 ms wahrgenommene Reaktion je Wechsel | offen, zu bestätigen |
| Schwelle für Ladezustand-Anzeige bei Netzabrufen | ab 300 ms | offen, zu bestätigen |
| Timeout für Netzabrufe | 10 Sekunden, danach Fehlermeldung mit Wiederholen-Option | offen, zu bestätigen |

Die Alt-App lädt Speisepläne je Datumsseite bei Bedarf nach und hält sie in einem Zwischenspeicher (`alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart:9-38`, siehe auch Capability `data-and-storage`). Dieses Muster aus On-Demand-Laden plus Zwischenspeicher pro Seite ist übernehmenswert und gilt sinngemäß für jede Ansicht mit blätterbaren Zeit- oder Datumsseiten.

## Verfügbarkeit und Verhalten bei Ausfall

Grundsatz: Der Ausfall eines Fremdsystems darf nur den davon abhängigen Funktionsbereich beeinträchtigen, nie die gesamte App. Risikoeinschätzung je System: siehe Capability `integrations`.

| System | Risiko lt. Capability `integrations` | Verhalten bei Ausfall |
|---|---|---|
| INT-001/002 FBWS (Studiengänge, Termine) | mittel | zuletzt geladene Daten anzeigen, als möglicherweise veraltet kennzeichnen; nur Stundenplan/Raumsuche betroffen |
| INT-003 News-Feed | hoch | Fehlermeldung mit Wiederholen-Option; übrige App bleibt nutzbar |
| INT-004 Mensa-Speisepläne | hoch | zuletzt geladener Speiseplan bis Tagesende; übrige App bleibt nutzbar |
| INT-005 Push-Benachrichtigungen | mittel | In-App-Hinweise als Rückfalloption ohne Push |
| INT-006 HISinOne | offen | Notenübersicht als nicht verfügbar kennzeichnen; übrige App unbeeinträchtigt |
| INT-007 BookStack | mittel bis hoch | Wiki-Bereich zeigt Fehlerzustand; übrige App unbeeinträchtigt |
| INT-008 Eigenes Backend | eigener Verantwortungsbereich | betrifft RATE, EVENT, HELFER, NEWS, MENSA, RAUM gemeinsam, da zentraler Vermittler — größtes Einzelrisiko für die Bereichsisolation, siehe Abschnitt „Store-Veröffentlichung" bzw. `product/roadmap.md` |

## Energie- und Datenverbrauch

Hintergrundabrufe laufen in festen, sparsamen Intervallen statt fortlaufendem Polling. Ein fester Zeitplan darf dabei an bekannte Nutzungsspitzen angelehnt sein (z. B. Speiseplan-Auffrischung vor der Morgen- und der Mittagszeit, Capability `backend-and-api`) — das bleibt ein fester Plan im Sinne des Requirements „Feste, sparsame Hintergrundabruf-Intervalle", solange die Auslösung nicht von der Anfragemenge abhängt. Bereits gültige Zwischenspeicher (siehe Capability `data-and-storage`) werden nicht vorzeitig erneut abgerufen. Umfangreiche Abrufe (z. B. Wiki-Vorabladen) nehmen Rücksicht auf Mobilfunkverbindungen; genaue Schwellwerte sind offen (siehe „Offene Fragen").

## Sprache

Die App unterstützt Deutsch und Englisch als Oberflächensprachen von Anfang an (Entscheidung FSR FB4, 2026-08-25) — anders als die Alt-App, die ausschließlich `de_DE` initialisiert (`alte apps/fb4_app-main/fb4_app-main/lib/main.dart:37`). Datums-, Zeit- und Währungsformate folgen weiterhin der deutschen Konvention unabhängig von der gewählten Oberflächensprache, sofern nicht bei Umsetzung anders festgelegt (siehe „Offene Fragen").

## Wartbarkeit

Jede Verhaltensänderung zieht eine Spec-Änderung nach sich (spec-anchored Vorgehen, `specs/README.md` Abschnitt 7). Die automatisierbare Prüfung dieser Regel ist Sache der Capability `quality-and-testing`, nicht dieses Dokuments.

## Bildschirmausrichtung

Die Alt-App erzwingt Hochformat (`alte apps/fb4_app-main/fb4_app-main/lib/main.dart:113-115`). Entschieden (FSR FB4, 2026-08-25): Die Neuentwicklung übernimmt das unverändert — durchgehend Hochformat, ohne Ausnahmen für einzelne Ansichten. Breite Inhalte (z. B. Wiki-Tabellen, Raumpläne) werden stattdessen horizontal scrollbar gestaltet, siehe Capability `ux-and-theming`.

## Store-Veröffentlichung

Die App wird über drei Vertriebswege veröffentlicht: Apple App Store, Google Play Store und F-Droid (Entscheidung FSR FB4, 2026-08-25, `specs/decisions/0008-vertrieb-ueber-drei-app-stores.md`). F-Droid existiert ausschließlich für Android und verlangt zusätzlich zu den beiden anderen Wegen einen vollständig quelloffenen, aus dem öffentlichen Quellcode reproduzierbar baubaren Build ohne proprietäre Abhängigkeiten — die technische Auflösung des daraus entstehenden Konflikts mit der ursprünglich vorgesehenen Push-Bibliothek steht in ADR 0008 und Capability `integrations` (INT-005), hier nur die daraus folgenden plattformübergreifenden Anforderungen.

**Name und Identifikator (Entscheidung FSR FB4, 2026-09-07).** Die App erscheint im Store unter dem Titel „FSR Informatik – FH Dortmund" und trägt auf Android wie iOS den Identifikator `de.fsrfb4.app`. Der Identifikator ist die folgenreichere der beiden Festlegungen: Er ist nach der ersten Veröffentlichung unwiderruflich — ein Wechsel erzwingt einen neuen Store-Eintrag und verwirft Bewertungen, Installationszahlen und die automatische Update-Zustellung. Die Android-Alt-App behält daneben ihren eigenen Identifikator `de.fsrfb4.fb4` (`specs/product/legacy-inventory.md` Abschnitt 4); die Neuentwicklung übernimmt deren Store-Eintrag nicht, beide bestehen nebeneinander. Auf dem Gerät selbst erscheint der kürzere Name „FSR Informatik", weil der Startbildschirm längere Namen kürzt — Store-Titel und Gerätename sind getrennte Felder und werden getrennt entschieden.

| Vertriebsweg | Entwicklerkonto | Kosten | Besonderheit |
|---|---|---|---|
| Apple App Store | Apple Developer Program | 99 USD/Jahr | In-App-Kontolöschung ist Store-Voraussetzung (bereits erfüllt durch Capability `settings`, SET-F-090); Build muss mit dem jeweils von Apple aktuell geforderten SDK erstellt werden |
| Google Play Store | Google Play Console (Einzelentwicklerkonto) | 25 USD einmalig | Neu angelegte Konten müssen vor der ersten Produktivfreigabe einen geschlossenen Test mit mindestens 12 durchgängig teilnehmenden Testenden über mindestens 14 zusammenhängende Tage durchlaufen [Recherche: support.google.com/googleplay/android-developer/answer/14151465, 2026-08-25]; die geforderte Ziel-API-Stufe steigt jährlich, ab 31.08.2026 Android 16/API 36 für neue Apps und App-Updates [Recherche: developer.android.com/google/play/requirements/target-sdk, 2026-08-25] |
| F-Droid | kein Konto, Aufnahme über Merge-Request in das `fdroiddata`-Repository | keine | gesamter Quellcode unter OSI-anerkannter Lizenz (MIT, ADR 0008); keine proprietären Build-Abhängigkeiten (insbesondere kein Firebase/Google Play Services, siehe Capability `integrations`, INT-005); reproduzierbarer Build durch F-Droids eigene Build-Server [Recherche: f-droid.org/docs/Reproducible_Builds, 2026-08-25] |

## Begründungen zu entfallenen und geänderten Requirements

**Deutsch als einzige Oberflächensprache / architektonische Offenheit für künftige Mehrsprachigkeit (beide entfallen).** Entscheidung FSR FB4, 2026-08-25: Mehrsprachigkeit (Deutsch + Englisch) von Anfang an statt nur vorsorglich architektonisch offenzuhalten. Ersetzt durch „Wahl zwischen Deutsch und Englisch als Oberflächensprache". „Deutsche Formatkonvention für Datum, Zeit und Währung" bleibt unverändert gültig — deutsche Formatkonvention unabhängig von der Oberflächensprache; ob Englisch eine abweichende Formatierung braucht, ist bei Umsetzung zu bewerten (siehe „Offene Fragen").

**Hochformat als einzige Bildschirmausrichtung.** Verschärft von „sollte" auf „muss" — Entscheidung FSR FB4, 2026-08-25, löst die zuvor an Capability `ux-and-theming` delegierte Frage nach Querformat-Ausnahmen auf: breite Inhalte werden horizontal scrollbar gestaltet statt die Ausrichtung zu ändern. **Ergänzung 2026-08-26:** Die ursprüngliche Formulierung „ohne Ausnahmen" berücksichtigte Tablets und Faltgeräte (z. B. Split View, Stage Manager) nicht gesondert. Auf großen Bildschirmen ab 1024 px Breite — derselbe Schwellwert wie in der Capability `admin` (ADMIN-N-010) — gilt die Ausrichtung nicht als erzwungen; adaptives Layout ist dort zulässig. Für gewöhnliche Smartphones ändert sich nichts.

**Firebase nur als Messaging-Modul auf iOS.** Standard-Firebase-Setups aktivieren Google Analytics for Firebase/Crashlytics standardmäßig mit, sobald das SDK eingebunden wird. Ohne diese ausdrückliche Einschränkung würde die auf Android konsequent verfolgte Datensparsamkeits-Linie auf iOS unbemerkt unterlaufen — das Requirement „Kein Absturzbericht an Dritte" (Capability `security-and-privacy`) gilt für iOS genauso wie für Android.

## Offene Fragen

- Leistungszielwerte (Startzeit, Reaktionszeit beim Blättern, Ladezustand-Schwelle) gelten als Arbeitsziele, zu validieren durch technische Leitung anhand eines frühen Prototyps; Anpassung nach Validierung bleibt möglich.
- Schwellwerte für Datenverbrauch bei Hintergrundabrufen und Prefetching: noch kein Arbeitsziel vorgeschlagen, da abhängig von der Aufrufhäufigkeit einzelner Feature-Capabilities. Klärung im Zuge der Capability `architecture`.
- Konkrete F-Droid-Build-Konfiguration (`subdir`-Direktive, gepinnte Node-Version, Deklaration der JavaScript-Abhängigkeiten als FLOSS-kompatibel, Requirement „Reproduzierbarer F-Droid-Build") — Gegenstand der CI/Build-Pipeline bei Umsetzung, siehe `specs/decisions/0008-vertrieb-ueber-drei-app-stores.md`.

Datums-/Zeit-/Währungsformatierung bleibt unabhängig von der Oberflächensprache bei der deutschen Konvention (Requirement „Deutsche Formatkonvention für Datum, Zeit und Währung") — Entscheidung: kein zusätzlicher Formatierungsaufwand für Englisch, da die Zielgruppe im deutschen Hochschulkontext deutsche Formate gewohnt ist.
