## ADDED Requirements

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
