---
nummer: 0001
titel: React Native als Plattform
status: angenommen
datum: 2026-08-24
betrifft:
  - ../platform/architecture.md
  - ../platform/non-functional.md
  - ../platform/quality-and-testing.md
---

# ADR 0001: React Native als Plattform

## Kontext

Die abzulösenden Alt-Apps sind zwei getrennte Codebasen: eine Flutter/iOS-App mit vorliegendem Quellcode (`alte apps/fb4_app-main/fb4_app-main/`) und eine native Java-Android-App, deren Quellcode nicht vorliegt. Getrennte Pflege je Plattform hat sich in einem Fachschaftsrat mit regelmäßig wechselnden Aktiven nicht gehalten: Die Android-App ist inzwischen nicht mehr wartbar, weil niemand mehr Zugriff auf ihren Code hat, und die iOS-App wird seit längerem nicht mehr weiterentwickelt. Die Neuentwicklung muss iOS und Android gleichermaßen bedienen, mit essentiellen Features (Raumsuche, Stundenplan, Mensaplan mit Bewertungsfunktion, FSR-Integration, Wiki-Anbindung) plus Bestandsfunktionen (Semesterticket, Notenübersicht, Einstellungen).

## Entscheidung

Die Neuentwicklung nutzt eine gemeinsame Codebasis mit React Native für iOS und Android.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| Getrennt nativ (Swift/Kotlin, zwei Codebasen) | hoch — doppelte Implementierung, doppelte Pflege | maximale Plattformintegration je System | genau das Modell, das bei den Alt-Apps gescheitert ist; zwei Codebasen sind für ein Team mit wechselnden Aktiven kaum stabil zu besetzen |
| Flutter | mittel — eine Codebasis; bestehende Flutter-App als Ausgangspunkt naheliegend | vorhandene Team-Erfahrung mit Flutter aus der Alt-App | Der bestehende Flutter-Code ist auf Cupertino-Oberflächen (iOS-Look) zugeschnitten und wird wegen des Funktionsumbaus (Schreibpfade, Community-Features) ohnehin nicht übernommen — der naheliegende Vorteil entfällt damit faktisch |
| Plattformübergreifende Web-Technologie (z. B. PWA/WebView-Hybrid) | gering bis mittel — ein Web-Stack, ggf. nativer Wrapper | schnelle Bereitstellung, ein einziger Stack | eingeschränkter Zugriff auf native Fähigkeiten (Push, Kalender, Dateisystem, Helligkeitssteuerung), schwächere Offline- und Performance-Eigenschaften auf Mobilgeräten |
| React Native (gewählt) | mittel — eine Codebasis, etabliertes Ökosystem | eine Codebasis, großes Ökosystem, gemeinsamer Funktionsstand auf beiden Plattformen | plattformspezifische Anteile bleiben für Helligkeitssteuerung, Schnellaktionen, Kalender- und Dateizugriff nötig |

## Konsequenzen

Eine Codebasis für iOS und Android mit gemeinsamem Funktionsstand auf beiden Plattformen. Für Helligkeitssteuerung (Ticketansicht), Betriebssystem-Schnellaktionen, Kalenderzugriff (Events) und Dateizugriff (Semesterticket-Import) sind plattformspezifische native Module bzw. Bridges nötig, da React Native diese Fähigkeiten nicht vollständig plattformneutral abdeckt.

## Offene Punkte

- Ausprägung des Werkzeugkastens (z. B. verwaltete vs. eigenständig konfigurierte React-Native-Umgebung, Navigation, Zustandsverwaltung) ist noch nicht festgelegt; Gegenstand von `platform/architecture.md`.
- Umgang mit nativen Modulen: wie plattformspezifische Bridges strukturiert, dokumentiert und bei React-Native-Versionswechseln gepflegt werden, ist offen.
- Fortbestand des Wissens im FSR über Generationen von Aktiven hinweg: React Native senkt zwar die Zahl der Codebasen, ersetzt aber nicht die Notwendigkeit einer belastbaren Übergabe — siehe `decisions/0002-spec-anchored-arbeitsweise.md`.
