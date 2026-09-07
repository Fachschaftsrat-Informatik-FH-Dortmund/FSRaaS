# App-Name und Paket-Identifikator festlegen

## Warum

Der Abschnitt „Store-Veröffentlichung" der Capability `non-functional` regelt Lizenz, Ziel-API-Stufe, Testauflage, Datenschutzerklärung und Versionsnummer — aber nicht, unter welchem Namen und unter welchem Identifikator die App überhaupt erscheint. Beides stand bisher allein im Code: `"name": "FB4"` in `app/app.json`, `de.fsrfb4.app` in `app/app.json` und `app/android/app/build.gradle`. Ohne Anforderung dahinter ist beides beliebig änderbar — und genau das darf es nicht sein.

**Der Paket-Identifikator ist nach der ersten Veröffentlichung unwiderruflich.** Weder Google Play noch F-Droid lassen ihn danach je wieder ändern. Ein späterer Wechsel bedeutet einen neuen Store-Eintrag: Bewertungen, Installationszahlen und die automatische Update-Zustellung an Bestandsnutzende gehen verloren. Der Store-Titel ist zwar änderbar, aber nur unter Verlust der Wiedererkennung.

**Der bisherige Name trägt nicht.** „FB4" bezeichnet den Fachbereich und ist innerhalb der Hochschule etabliert, außerhalb aber bedeutungslos. Der Titel ist im Play Store zugleich das stärkste Auffindbarkeitsmerkmal bei nur 30 zulässigen Zeichen; die Zielgruppe sucht nach „FH Dortmund", „Informatik" und „FSR", nicht nach „FB4".

Entschieden 2026-09-07: Store-Titel „FSR Informatik – FH Dortmund", Identifikator `de.fsrfb4.app`.

## Was sich ändert

**Der Store-Titel wird als Anforderung geführt.** „FSR Informatik – FH Dortmund", 28 Zeichen, damit innerhalb der Play-Store-Grenze von 30. Er nennt Träger (FSR), Fachgebiet (Informatik) und Hochschule (FH Dortmund) — die drei Begriffe, unter denen gesucht wird.

**Der Identifikator wird festgeschrieben.** `de.fsrfb4.app` folgt der Reverse-DNS-Konvention aus `fsrfb4.de`, einer Domain im Verfügungsbereich des FSR — unter `app.fsrfb4.de` läuft dort bereits das Altbackend (Capability `integrations`, INT-008). Am Code ändert sich dadurch nichts; er steht bereits so in `app/app.json` und `app/android/app/build.gradle`. Neu ist, dass er nicht mehr stillschweigend geändert werden kann.

**Der Gerätename wird vom Store-Titel getrennt.** Der Name unter dem App-Symbol auf dem Startbildschirm ist ein eigenes Feld und unterliegt einer weit engeren Längengrenze als der Store-Titel — beide Plattformen kürzen dort mit Auslassungspunkten. Ein Store-Titel von 28 Zeichen erschiene auf dem Gerät als Fragment. Der Gerätename lautet deshalb „FSR Informatik"; der vollständige Titel bleibt dem Store-Eintrag vorbehalten.

## Abgrenzung zur Android-Alt-App

Die Alt-App behält ihren eigenen Identifikator `de.fsrfb4.fb4` (Fundstelle: `specs/product/legacy-inventory.md` Abschnitt 4). Beide Einträge koexistieren im Store, ohne einander zu berühren; die Neuentwicklung übernimmt den Alt-Eintrag ausdrücklich nicht. Ob und wie die Alt-App darüber hinaus weitergeführt wird, ist eine davon unabhängige Frage und bleibt offen (siehe unten).

## Was offen bleibt

**Der Gerätename ist eine Ableitung, keine ausdrückliche Entscheidung.** Festgelegt wurde am 2026-09-07 der App-Name; dass Store-Titel und Gerätename technisch zwei getrennte Felder sind, war dabei nicht Gegenstand. „FSR Informatik" ist die naheliegende Kürzung und in dieser Fassung so gesetzt. Sie liegt mit 14 Zeichen weiterhin im Bereich, in dem iOS kürzen kann — soll der Name auf dem Startbildschirm sicher vollständig stehen, ist eine kürzere Fassung (etwa „FSR FB4") die verlässliche Wahl. Das ist eine Änderung an einer Stelle in `app/app.json` und berührt weder Store-Titel noch Identifikator.

**Die Ziel-API-Stufe des Android-Builds erfüllt die Play-Auflage derzeit nicht.** `app/android/build.gradle:8` setzt `targetSdkVersion` auf 34. Der Abschnitt „Store-Veröffentlichung" hält fest, dass Google Play seit dem 31.08.2026 Android 16 / API 36 für neue Apps und für Updates verlangt; dieses Datum liegt zurück. Das Requirement „Einhaltung der Google-Play-Ziel-API-Stufe" ist damit heute verletzt. Für den Namen ist das ohne Belang, für die Veröffentlichung ist es blockierend — eigener Change, weil es einen Prebuild und eine Prüfung der Verhaltensänderungen von API 35 und 36 nach sich zieht.

**Die Weiterführung der Alt-App bleibt ungeklärt.** `specs/open-questions.md` führt die Frage weiterhin offen („Wird die Android-Alt-App bis zur Auslieferung der ersten Ausbaustufe weitergepflegt, oder bleibt sie unverändert im Store?"). Diese Änderung beantwortet sie nicht und greift ihr nicht vor.
