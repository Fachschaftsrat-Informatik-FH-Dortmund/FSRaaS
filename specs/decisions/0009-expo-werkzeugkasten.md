---
nummer: 0009
titel: Expo als Werkzeugkasten, ohne Cloud-Dienste
status: angenommen
datum: 2026-08-25
betrifft:
  - ../platform/architecture.md
  - ../platform/non-functional.md
  - ../features/semester-ticket/spec.md
  - ../features/canteen/spec.md
  - ../features/app-shell/spec.md
  - 0001-react-native-als-plattform.md
  - 0008-vertrieb-ueber-drei-app-stores.md
---

# ADR 0009: Expo als Werkzeugkasten, ohne Cloud-Dienste

## Kontext

`0001-react-native-als-plattform.md` legt React Native fest, lässt die Ausprägung des Werkzeugkastens aber ausdrücklich offen („verwaltete vs. eigenständig konfigurierte React-Native-Umgebung"). Zwei Randbedingungen wirken gegeneinander.

Auf der einen Seite braucht das Projekt an mindestens sieben Stellen native Gerätefähigkeiten: Bildschirmhelligkeit (TICKET-F-040), Dateiauswahl für den Ticket-Import (TICKET-F-010), gesicherter Systemspeicher (DATA-F-120), lokale Benachrichtigungen (MENSA-F-100), OIDC-Anmeldung im Systembrowser (`0010-authentik-als-identitaetsanbieter.md`), Oberflächensprache aus den Systemeinstellungen (NFR-F-115) und Betriebssystem-Schnellzugriffe (SHELL-F-040). Expo liefert für sechs davon gepflegte Module; bei einer eigenständig konfigurierten Umgebung wären es einzeln ausgewählte Community-Pakete mit eigener Verdrahtung.

Auf der anderen Seite verlangt `0008-vertrieb-ueber-drei-app-stores.md`, dass F-Droid den Android-Build reproduzierbar aus dem öffentlichen Quellcode erzeugt (NFR-N-210), ohne proprietäre Abhängigkeiten (NFR-N-170). Zwei Expo-Bestandteile stehen dem entgegen: `expo-updates` liefert Programmcode nachträglich über einen Server aus, was F-Droid als Anti-Feature führt, und EAS Build erzeugt Builds in Expo-Infrastruktur statt auf F-Droids eigenen Build-Servern.

Eine dritte, für die tägliche Arbeit wesentliche Randbedingung: Die Entwicklung erfolgt nebenher durch eine einzelne Person. Ein schneller Weg, einen Stand auf dem eigenen Gerät auszuprobieren, ist deshalb kein Komfortmerkmal, sondern bestimmt, wie oft überhaupt getestet wird.

## Entscheidung

Expo wird als Werkzeugkasten genutzt, nicht als Cloud-Plattform. Konkret: Expo SDK mit `expo-dev-client`, die nativen Ordner `android/` und `ios/` werden per `npx expo prebuild` erzeugt und im Repository geführt, Builds laufen lokal beziehungsweise in der projekteigenen CI. `expo-updates` wird nicht eingesetzt, EAS Build nicht verwendet.

Der Entwicklungsablauf bleibt damit derselbe, den Expo Go bietet — einmal einen Development-Build auf das Gerät bringen, danach Metro starten, Code scannen, Hot Reload —, funktioniert aber auch mit eigenen nativen Modulen, die Expo Go nicht laden kann. Das ist hier zwingend, weil UnifiedPush (INT-005) kein Expo-Modul hat und als Config-Plugin mit eigenem nativem Android-Anteil entsteht.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| **Expo mit Prebuild und Dev-Client, ohne EAS und ohne `expo-updates` (gewählt)** | mittel — Config-Plugins für die nicht abgedeckten nativen Anteile, eigene Build-Pipeline | gepflegte Module für sechs der sieben benötigten Gerätefähigkeiten; Dev-Client erhält den QR-Code-Ablauf trotz eigener nativer Module; F-Droid-Aufnahme bleibt über die `subdir`-Direktive erreichbar | Expo-SDK-Wechsel erzwingen periodisch Nacharbeit an den Config-Plugins; die nativen Ordner im Repository müssen bei jedem Prebuild bewusst nachgeführt werden |
| Eigenständig konfigurierte React-Native-Umgebung (CLI) | mittel bis hoch — jede Gerätefähigkeit einzeln ausgewählt und verdrahtet | vollständige Kontrolle über die Gradle-Konfiguration, keinerlei Expo-Bestandteile im Build; der direkteste Weg zu NFR-N-210 | sechs bis sieben Community-Pakete unterschiedlicher Pflegequalität statt einer Modulfamilie; Development-Build und Hot-Reload-Ablauf müssen selbst eingerichtet werden |
| Expo einschließlich EAS Build und `expo-updates` | gering — schnellster Start, einfachste Store-Auslieferung | geringster Einrichtungsaufwand, komfortabelste Auslieferung an App Store und Play Store | F-Droid entfällt praktisch als Vertriebsweg; NFR-N-170/210 und `0008-vertrieb-ueber-drei-app-stores.md` müssten zurückgenommen werden |
| Entscheidung auf einen Spike vertagen | gering, aber verzögernd | Wahl auf gemessener Grundlage statt auf Einschätzung | verzögert den Beginn jedes vertikalen Schnitts, obwohl die entscheidenden Randbedingungen (F-Droid-Auflagen, benötigte Gerätefähigkeiten) bereits dokumentiert vorliegen |

### Erläuterungen

**Zur gewählten Option.** Die beiden F-Droid-kritischen Bestandteile sind abschaltbar, ohne den Rest von Expo aufzugeben — sie sind keine Voraussetzung für das SDK, sondern zusätzliche Dienste. Ein React-Native-Projekt mit im Repository geführten nativen Ordnern unterscheidet sich aus Sicht von F-Droids Build-Server nicht wesentlich von einem CLI-Projekt; die in `0008-vertrieb-ueber-drei-app-stores.md` recherchierte Aufnahmeanleitung für React-Native-Apps beschreibt genau diesen Fall.

## Konsequenzen

- Der Android-Build enthält kein `expo-updates` und keine Firebase-Bibliothek; die Push-Zustellung läuft dort wie in `0008-vertrieb-ueber-drei-app-stores.md` festgelegt über UnifiedPush. `expo-notifications` wird ausschließlich für **lokale** Benachrichtigungen ohne Netzbeteiligung verwendet (MENSA-F-100), nicht für Fernzustellung auf Android.
- `android/` und `ios/` liegen im Repository und sind Teil des Review-Umfangs. Ein Prebuild, der sie verändert, gehört in denselben Merge wie die auslösende Änderung.
- Die Node-Version wird gepinnt (Voraussetzung der F-Droid-Aufnahme, siehe NFR-N-210).
- Für UnifiedPush entsteht ein eigenes Config-Plugin mit nativem Android-Anteil. Dieser Aufwand fällt unabhängig vom gewählten Werkzeugkasten an.
- Ein neuer Registereintrag ist nicht nötig: Expo ist Bau- und Laufzeitwerkzeug, kein von der App aufgerufenes Fremdsystem.

## Offene Punkte

- Ob die iOS-Anbindung an Firebase Cloud Messaging (INT-005, iOS-Zweig) über ein Config-Plugin oder über direkte Anpassung des `ios/`-Ordners erfolgt — bei Umsetzung der Push-Zustellung zu entscheiden, laut `product/roadmap.md` in der zweiten Ausbaustufe.
- Rhythmus für Expo-SDK-Wechsel und wer sie durchführt, wenn die Besetzung wechselt — organisatorische Frage, berührt `0002-spec-anchored-arbeitsweise.md`.
