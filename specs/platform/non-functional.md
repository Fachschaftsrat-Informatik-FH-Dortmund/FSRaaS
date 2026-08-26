---
id: non-functional
titel: Nicht-funktionale Anforderungen
praefix: NFR
status: accepted
version: 1.3.0
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib/main.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart
implemented_in: []
related:
  - integrations.md
  - architecture.md
  - ux-and-theming.md
  - quality-and-testing.md
  - ../features/canteen/spec.md
  - ../decisions/0008-vertrieb-ueber-drei-app-stores.md
---

# Nicht-funktionale Anforderungen

## 1. Zweck

Projektweite Qualitätsanforderungen: Leistung, Verfügbarkeit, Ressourcenverbrauch, Sprache, Wartbarkeit, Bildschirmausrichtung. Feature-spezifische Verschärfungen gehören in die jeweilige Feature-Spec und verweisen hierher. Zahlenwerte in diesem Dokument sind, sofern nicht ausdrücklich als bestätigt gekennzeichnet, Vorschläge zur Bestätigung.

## 2. Plattform-Mindestversionen

| Plattform | Wert | Begründung | Status |
|---|---|---|---|
| iOS | 15 | Übliches Support-Fenster aktueller Apple-Geräte, aktueller React-Native-Standardwert | bestätigt, FSR FB4, 2026-08-25 |
| Android | 10 (API 29) | React-Native-Mindestunterstützung und übliche Verbreitung. Die Android-Alt-App setzt API 26 als Untergrenze — die höhere Schwelle schließt ältere Geräte aus, die dort noch bedient wurden; bewusst in Kauf genommen | bestätigt, FSR FB4, 2026-08-25 |

## 3. Leistung

| Kennzahl | Zielwert (vorgeschlagen) | Status |
|---|---|---|
| Startzeit bis zur ersten nutzbaren Ansicht | unter 2 Sekunden | offen, zu bestätigen |
| Reaktionszeit beim Blättern durch Wochentage/Datumsseiten | unter 200 ms wahrgenommene Reaktion je Wechsel | offen, zu bestätigen |
| Schwelle für Ladezustand-Anzeige bei Netzabrufen | ab 300 ms | offen, zu bestätigen |
| Timeout für Netzabrufe | 10 Sekunden, danach Fehlermeldung mit Wiederholen-Option | offen, zu bestätigen |

Die Alt-App lädt Speisepläne je Datumsseite bei Bedarf nach und hält sie in einem Zwischenspeicher (`alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart:9-38`, siehe auch `data-and-storage.md` Abschnitt 4). Dieses Muster aus On-Demand-Laden plus Zwischenspeicher pro Seite ist übernehmenswert und gilt sinngemäß für jede Ansicht mit blätterbaren Zeit- oder Datumsseiten.

## 4. Verfügbarkeit und Verhalten bei Ausfall

Grundsatz: Der Ausfall eines Fremdsystems darf nur den davon abhängigen Funktionsbereich beeinträchtigen, nie die gesamte App. Risikoeinschätzung je System: siehe `integrations.md`.

| System | Risiko lt. integrations.md | Verhalten bei Ausfall |
|---|---|---|
| INT-001/002 FBWS (Studiengänge, Termine) | mittel | zuletzt geladene Daten anzeigen, als möglicherweise veraltet kennzeichnen; nur Stundenplan/Raumsuche betroffen |
| INT-003 News-Feed | hoch | Fehlermeldung mit Wiederholen-Option; übrige App bleibt nutzbar |
| INT-004 Mensa-Speisepläne | hoch | zuletzt geladener Speiseplan bis Tagesende; übrige App bleibt nutzbar |
| INT-005 Push-Benachrichtigungen | mittel | In-App-Hinweise als Rückfalloption ohne Push |
| INT-006 HISinOne | offen | Notenübersicht als nicht verfügbar kennzeichnen; übrige App unbeeinträchtigt |
| INT-007 BookStack | mittel bis hoch | Wiki-Bereich zeigt Fehlerzustand; übrige App unbeeinträchtigt |
| INT-008 Eigenes Backend | eigener Verantwortungsbereich | betrifft RATE, EVENT, HELFER, NEWS, MENSA, RAUM gemeinsam, da zentraler Vermittler — größtes Einzelrisiko für die Bereichsisolation, siehe Abschnitt 8 |

## 5. Energie- und Datenverbrauch

Hintergrundabrufe laufen in festen, sparsamen Intervallen statt fortlaufendem Polling. Bereits gültige Zwischenspeicher (siehe `data-and-storage.md` Abschnitt 4) werden nicht vorzeitig erneut abgerufen. Umfangreiche Abrufe (z. B. Wiki-Vorabladen) nehmen Rücksicht auf Mobilfunkverbindungen; genaue Schwellwerte sind offen (Abschnitt 8).

## 6. Sprache

Die App unterstützt Deutsch und Englisch als Oberflächensprachen von Anfang an (Entscheidung FSR FB4, 2026-08-25) — anders als die Alt-App, die ausschließlich `de_DE` initialisiert (`alte apps/fb4_app-main/fb4_app-main/lib/main.dart:37`). Datums-, Zeit- und Währungsformate folgen weiterhin der deutschen Konvention unabhängig von der gewählten Oberflächensprache, sofern nicht bei Umsetzung anders festgelegt (siehe Abschnitt 11).

## 7. Wartbarkeit

Jede Verhaltensänderung zieht eine Spec-Änderung nach sich (spec-anchored Vorgehen, `README.md` Abschnitt 7). Die automatisierbare Prüfung dieser Regel ist Sache von `quality-and-testing.md` (QA), nicht dieses Dokuments.

## 8. Bildschirmausrichtung

Die Alt-App erzwingt Hochformat (`alte apps/fb4_app-main/fb4_app-main/lib/main.dart:113-115`). Entschieden (FSR FB4, 2026-08-25): Die Neuentwicklung übernimmt das unverändert — durchgehend Hochformat, ohne Ausnahmen für einzelne Ansichten. Breite Inhalte (z. B. Wiki-Tabellen, Raumpläne) werden stattdessen horizontal scrollbar gestaltet, siehe `ux-and-theming.md`.

## 9. Store-Veröffentlichung

Die App wird über drei Vertriebswege veröffentlicht: Apple App Store, Google Play Store und F-Droid (Entscheidung FSR FB4, 2026-08-25, `../decisions/0008-vertrieb-ueber-drei-app-stores.md`). F-Droid existiert ausschließlich für Android und verlangt zusätzlich zu den beiden anderen Wegen einen vollständig quelloffenen, aus dem öffentlichen Quellcode reproduzierbar baubaren Build ohne proprietäre Abhängigkeiten — die technische Auflösung des daraus entstehenden Konflikts mit der ursprünglich vorgesehenen Push-Bibliothek steht in ADR 0008 und `integrations.md` INT-005, hier nur die daraus folgenden plattformübergreifenden Anforderungen.

| Vertriebsweg | Entwicklerkonto | Kosten | Besonderheit |
|---|---|---|---|
| Apple App Store | Apple Developer Program | 99 USD/Jahr | In-App-Kontolöschung ist Store-Voraussetzung (bereits erfüllt durch SET-F-090); Build muss mit dem jeweils von Apple aktuell geforderten SDK erstellt werden |
| Google Play Store | Google Play Console (Einzelentwicklerkonto) | 25 USD einmalig | Neu angelegte Konten müssen vor der ersten Produktivfreigabe einen geschlossenen Test mit mindestens 12 durchgängig teilnehmenden Testenden über mindestens 14 zusammenhängende Tage durchlaufen [Recherche: support.google.com/googleplay/android-developer/answer/14151465, 2026-08-25]; die geforderte Ziel-API-Stufe steigt jährlich, ab 31.08.2026 Android 16/API 36 für neue Apps und App-Updates [Recherche: developer.android.com/google/play/requirements/target-sdk, 2026-08-25] |
| F-Droid | kein Konto, Aufnahme über Merge-Request in das `fdroiddata`-Repository | keine | gesamter Quellcode unter OSI-anerkannter Lizenz (MIT, ADR 0008); keine proprietären Build-Abhängigkeiten (insbesondere kein Firebase/Google Play Services, siehe INT-005); reproduzierbarer Build durch F-Droids eigene Build-Server [Recherche: f-droid.org/docs/Reproducible_Builds, 2026-08-25] |

## 10. Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| NFR-N-010 | Die Mindestversion für iOS muss 15 betragen. | NEU |
| NFR-N-020 | Die Mindestversion für Android muss API 29 (Android 10) betragen. | NEU |
| NFR-N-030 | Die Startzeit bis zur ersten nutzbaren Ansicht sollte unter 2 Sekunden liegen (vorgeschlagen, zu bestätigen). | NEU |
| NFR-N-040 | Die Reaktionszeit beim Blättern durch Wochentage oder Datumsseiten sollte unter 200 ms liegen (vorgeschlagen, zu bestätigen). | NEU |
| NFR-F-050 | Das System muss Inhalte blätterbarer Zeit- oder Datumsseiten bei Bedarf je Seite nachladen und im Zwischenspeicher vorhalten. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart:9 |
| NFR-N-060 | Das System sollte bei Netzabrufen ab 300 ms einen Ladezustand anzeigen (vorgeschlagen, zu bestätigen). | NEU |
| NFR-F-070 | Falls ein Netzabruf eine vorgegebene Zeitspanne überschreitet, muss das System den Abruf abbrechen und eine Fehlermeldung mit Wiederholen-Option anzeigen. | NEU |
| NFR-N-080 | Falls ein Fremdsystem ausfällt, darf nur der davon abhängige Funktionsbereich beeinträchtigt sein, nicht die gesamte App. | NEU |
| NFR-N-090 | Das System muss Hintergrundabrufe in festen, sparsamen Intervallen ausführen und darf gültige Zwischenspeicher nicht vorzeitig erneut abrufen. | NEU |
| NFR-N-100 | Umfangreiche Abrufe (z. B. Wiki-Vorabladen) sollten Rücksicht auf Mobilfunkverbindungen nehmen und deren Datenverbrauch begrenzen. | NEU |
| ~~NFR-F-110~~ | ~~Das System muss Deutsch als einzige Oberflächensprache verwenden.~~ — entfallen | Alt: alte apps/fb4_app-main/fb4_app-main/lib/main.dart:37 |
| NFR-F-115 | Das System muss der Nutzerin die Wahl zwischen Deutsch und Englisch als Oberflächensprache ermöglichen. | NEU |
| NFR-F-120 | Das System muss Datums-, Zeit- und Währungsangaben nach deutscher Konvention formatieren. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/main.dart:37 |
| ~~NFR-N-130~~ | ~~Die Architektur sollte künftige Mehrsprachigkeit nicht grundsätzlich ausschließen, auch wenn sie aktuell nicht umgesetzt wird.~~ — entfallen | NEU |
| NFR-N-140 | Das System muss so betrieben werden, dass jede Verhaltensänderung mit einer Änderung der zugehörigen Spec einhergeht — durch eine automatisierte CI-Pipeline durchgesetzt, nicht durch eine benannte Kontrollperson (Entscheidung FSR FB4, 2026-08-25, siehe `quality-and-testing.md`). | NEU |
| NFR-N-150 | Die App muss Hochformat als einzige Bildschirmausrichtung verwenden, ohne Ausnahmen für einzelne Ansichten. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/main.dart:113 |
| NFR-N-160 | Der App-Quellcode muss vollständig unter der MIT-Lizenz veröffentlicht werden. | NEU |
| NFR-N-170 | Der Android-Build darf keine proprietären Abhängigkeiten enthalten, die eine Aufnahme in den F-Droid-Hauptindex verhindern, insbesondere keine Firebase- oder Google-Play-Services-Bibliotheken. | Recherche: f-droid.org/en/docs/Inclusion_Policy, 2026-08-25 |
| NFR-F-180 | Das System muss auf allen drei Vertriebswegen denselben fachlichen Funktionsumfang bereitstellen, mit Ausnahme rein technischer, plattformbedingter Unterschiede (z. B. gewählter UnifiedPush-Distributor gemäß INT-005). | NEU |
| NFR-N-190 | Der Android-Build muss die von Google Play jeweils zum Veröffentlichungszeitpunkt geforderte Mindest-Ziel-API-Stufe einhalten. | Recherche: developer.android.com/google/play/requirements/target-sdk, 2026-08-25 |
| NFR-N-200 | Das System muss vor der ersten Google-Play-Produktivfreigabe einen geschlossenen Test mit mindestens 12 durchgängig teilnehmenden Testenden über mindestens 14 zusammenhängende Tage durchlaufen, sofern das verwendete Google-Play-Entwicklerkonto dieser Auflage unterliegt. | Recherche: support.google.com/googleplay/android-developer/answer/14151465, 2026-08-25 |
| NFR-N-210 | Der Android-Build muss so gestaltet sein, dass F-Droids Build-Server ihn ohne Zugriff auf projektinterne Signaturschlüssel oder Geheimnisse reproduzierbar aus dem öffentlichen Quellcode erzeugen können. | Recherche: f-droid.org/docs/Reproducible_Builds, 2026-08-25 |
| NFR-N-220 | Das System muss für jeden Vertriebsweg eine öffentlich erreichbare, versionsunabhängige URL zur Datenschutzerklärung bereitstellen. | NEU |
| NFR-N-230 | Anzeigeversion und fortlaufende Build-Nummer müssen über alle drei Vertriebswege hinweg eindeutig und konsistent vergeben werden, sodass ein Fehlerbericht eindeutig einer Quellcode-Version zuordenbar ist. | NEU |

**`NFR-F-110`/`NFR-N-130` (entfallen).** Entscheidung FSR FB4, 2026-08-25: Mehrsprachigkeit (Deutsch + Englisch) von Anfang an statt nur vorsorglich architektonisch offenzuhalten. Ersetzt durch NFR-F-115. `NFR-F-120` bleibt unverändert gültig — deutsche Formatkonvention unabhängig von der Oberflächensprache; ob Englisch eine abweichende Formatierung braucht, ist bei Umsetzung zu bewerten (Abschnitt 11).

**`NFR-N-150`.** Verschärft von „sollte" auf „muss" und um „ohne Ausnahmen" ergänzt — Entscheidung FSR FB4, 2026-08-25, löst die zuvor an `ux-and-theming.md` delegierte Frage nach Querformat-Ausnahmen auf: keine Ausnahmen, breite Inhalte werden horizontal scrollbar gestaltet statt die Ausrichtung zu ändern.

## 11. Offene Fragen

- Leistungszielwerte (NFR-N-030, NFR-N-040, NFR-N-060) gelten als Arbeitsziele, zu validieren durch technische Leitung anhand eines frühen Prototyps; Anpassung nach Validierung bleibt möglich.
- Schwellwerte für Datenverbrauch bei Hintergrundabrufen und Prefetching (Abschnitt 5): noch kein Arbeitsziel vorgeschlagen, da abhängig von der Aufrufhäufigkeit einzelner Feature-Specs. Klärung im Zuge von `architecture.md`.
- Konkrete F-Droid-Build-Konfiguration (`subdir`-Direktive, gepinnte Node-Version, Deklaration der JavaScript-Abhängigkeiten als FLOSS-kompatibel, NFR-N-210) — Gegenstand der CI/Build-Pipeline bei Umsetzung, siehe `../decisions/0008-vertrieb-ueber-drei-app-stores.md`.

Datums-/Zeit-/Währungsformatierung bleibt unabhängig von der Oberflächensprache bei der deutschen Konvention (NFR-F-120) — Entscheidung: kein zusätzlicher Formatierungsaufwand für Englisch, da die Zielgruppe im deutschen Hochschulkontext deutsche Formate gewohnt ist.
