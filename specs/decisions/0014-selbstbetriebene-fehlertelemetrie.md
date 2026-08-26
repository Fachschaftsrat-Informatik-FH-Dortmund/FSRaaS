---
nummer: 0014
titel: Selbstbetriebene Fehlertelemetrie statt Firebase
status: angenommen
datum: 2026-08-26
betrifft:
  - ../platform/security-and-privacy.md
  - ../platform/backend-and-api.md
  - ../platform/integrations.md
  - 0003-eigenes-backend-fuer-community-funktionen.md
---

# ADR 0014: Selbstbetriebene Fehlertelemetrie statt Firebase

## Kontext

Die Android-Alt-App sendet Absturzberichte und Nutzungsereignisse an Firebase Crashlytics/Analytics (dokumentiert als AND-034 in `product/legacy-inventory.md`) — für die Neuentwicklung bereits ausgeschlossen (SEC-F-125) und zusätzlich unvereinbar mit NFR-N-170 (keine proprietären Abhängigkeiten im Android-Build wegen F-Droid). Damit gibt es aktuell **keine** Lösung, wie das jährlich wechselnde FSR-Team von Fehlern in Produktion erfährt, ohne auf zufällige Nutzermeldungen angewiesen zu sein — dasselbe Muster, an dem `app.fsrfb4.de` bereits gescheitert ist (`CLAUDE.md`: seit Wintersemester 2023/24 unbemerkt veraltete Daten). `platform/backend-and-api.md` API-N-090 fordert bereits „Betriebszustand überwachen und bei Ausfall benachrichtigen", ohne dafür einen Mechanismus zu benennen.

## Entscheidung

Selbstbetriebenes GlitchTip (MIT-lizenziert, zum Sentry-Protokoll kompatibel) auf dem bestehenden Hetzner-VPS. App und Backend nutzen die offiziellen Sentry-SDKs dagegen: `@sentry/react-native` einheitlich für Android und iOS, ein `Sentry`-NuGet-Paket mit Serilog im Backend. Ergänzt um ASP.NET Core Health Checks (`/health`), die den bisher mechanismuslosen API-N-090 konkretisieren.

Ausschlaggebend ist, dass ein selbstbetriebener Dienst kein „Dritter" im Sinne von SEC-F-125 ist — ein Sentry-SaaS-Konto wäre einer. Übermittlung nur nach Opt-in.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| **Selbstbetriebenes GlitchTip + Sentry-SDKs, beide Plattformen einheitlich (gewählt)** | mittel — ein zusätzlicher Dienst auf dem VPS | einzige mit SEC-F-125 vereinbare Telemetrielösung; ein Dashboard für App und Backend; Opt-in reduziert Datenanfall zusätzlich | ein weiterer selbstbetriebener Dienst mit Update-/Sicherungspflicht (wie Authentik, INT-012) |
| Firebase Crashlytics (Alt-App-Zustand) | keiner | am wenigsten Einrichtungsaufwand | bereits als Sicherheitsmangel AND-034 ausgeschlossen; verletzt NFR-N-170 und SEC-F-125 direkt |
| Sentry SaaS (gehostet) | gering | schnellster Start, keine eigene Betriebslast | Drittanbieter im Sinne von SEC-F-125; neuer externer Datenverarbeiter im Verarbeitungsverzeichnis, den ein selbstbetriebener Dienst vermeidet |
| Kein Crash-Reporting, nur Nutzermeldungen (Status quo) | keiner | kein Aufwand | wiederholt das Muster, an dem `app.fsrfb4.de` bereits gescheitert ist |
| Eigenbau (eigener Fehler-Endpunkt + Logging) | hoch | keine Fremdabhängigkeit | Gruppierung, Deduplizierung, Alarmierung und Source-Map-Auflösung müssten selbst gebaut und dauerhaft gepflegt werden |

## Konsequenzen

- `security-and-privacy.md` Abschnitt 3 (Verarbeitungsverzeichnis) erhält eine neue Zeile für Fehlerberichte; neue Anforderung SEC-F-130 (Übermittlung nur nach Opt-in).
- `backend-and-api.md` Abschnitt 6 erhält API-N-100 (strukturierte Protokollierung ab „Error", Weiterleitung an die Telemetrie-Instanz) und konkretisiert API-N-090 über den Health-Check-Endpunkt.
- `integrations.md` erhält einen neuen Registereintrag INT-018 für die GlitchTip-Instanz als internes Betriebssystem.

## Offene Punkte

- Aufbewahrungsfrist für Fehlerereignisse in GlitchTip — anzugleichen an die 30-Tage-Frist für technische Backend-Protokolle (`security-and-privacy.md` Abschnitt 9), bei Einrichtung zu konfigurieren.
- Alarmierungsweg (E-Mail an technische Leitung vs. zusätzlicher Messenger-Kanal) — organisatorische Festlegung bei Einrichtung.
