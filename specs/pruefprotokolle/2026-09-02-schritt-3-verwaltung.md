---
status: draft
version: 0.1.2
owner: FSR FB4
last_reviewed: 2026-09-03
---

# Prüfprotokoll — Roadmap-Schritt 3 (Stammdaten und Verwaltung)

Datum: 2026-09-02, ergänzt 2026-09-03 (Live-Verifikation gegen `auth.tobtech.de`)
Prüfer: Umsetzung (technische Leitung)
Grundlage: `../features/admin/spec.md` 0.3.0, `../platform/quality-and-testing.md` Abschnitt 3

Dieses Protokoll deckt die Anforderungen des Schnitts ab, für die nach `quality-and-testing.md` Abschnitt 3 ein datiertes Prüfprotokoll statt eines automatisierten Tests zulässig ist (Gestaltung/Barrierefreiheit), sowie den Punkt, dessen Live-Verifikation mangels Fremdsystem noch aussteht.

## 1. ADMIN-N-010 — Weboberfläche ab 1024 px vollständig bedienbar

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Web-Export baut | `npx expo export --platform web` in `app/` | **ausstehend Gerät** — in der CI verdrahtet (`.github/workflows/ci.yml`, Job `admin-web`), lokal noch nicht auf diesem Rechner ausgeführt |
| Schwellwertlogik 1024 px | `layoutForWidth` (`app/src/areas/admin/ui/responsive.ts`), Einheitentest mit `ADMIN-N-010` im Testnamen | **bestanden** |
| Kartenliste auf breiten Bildschirmen bedienbar | statische Prüfung der Screens (Stammdaten/Rollen/Laufwege): scrollbar, ≥ 44 dp Bedienelemente, keine Hochformat-Kopplung | **bestanden** (Logik); visuelle Abnahme am Browser **ausstehend Gerät** |
| Eigenes mehrspaltiges Tabellen-Rendering ab 1024 px | Umsetzung | **offen** — noch nicht gebaut; die Kartenliste deckt den Funktionsumfang ab, das tabellarische Layout ist die spätere Komfortstufe. `admin`-Spec Abschnitt 14 führt ADMIN-N-010 daher als „teilweise". |
| `Pressable` mit `accessibilityRole="button"` (ADR 0018, Spike-Befund) | statische Prüfung der Admin-Primitive | **bestanden** — alle Bedienelemente der Admin-Oberfläche setzen die Rolle explizit |

Bewertung: Schwellwert- und Rollenlogik sind automatisiert abgesichert, die Kartenliste ist der vollständige Funktionsumfang. Offen bleiben das mehrspaltige Tabellen-Rendering ab 1024 px und die rein visuelle Abnahme am Browser; beides wird nachgezogen, sobald der Web-Export auf einem Rechner mit Browser gebaut ist. `admin`-Spec bleibt bis dahin bei `status: accepted`, ADMIN-N-010 bei „teilweise".

## 2. ADMIN-F-070 — Rollenzuweisung, Live-Verifikation

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| App-/Web-Fluss (Rollen anzeigen, umschalten, speichern) | Komponententest (`RollenScreen.test.tsx`) + manuelle Bedienung gegen das Backend | **bestanden** gegen das Backend mit Attrappen-Verzeichnis |
| Aussperrschutz ADMIN-F-080 | Einheitentest `RollenRegelnTests` + Komponententest der App-Rückmeldung | **bestanden** |
| Konto ohne bisherige Rolle über Benutzername benennbar | `AuthentikDirectoryContractTests` (`KontoIdAufloesenAsync`: Benutzername → `pk`, numerische Kennung unverändert, unbekannter Name → 404) | **bestanden** gegen die dokumentierte Struktur |
| Backend-Endpunkt `/verwaltung/rollen` (Rollenprüfung, Protokoll, 503 ohne Instanz) | `RollenEndpointTests` | **bestanden** |
| Vertragstest gegen die Authentik-Verwaltungs-API (INT-012) | `AuthentikDirectoryContractTests` (QA-N-070) | **bestanden** gegen die dokumentierte Struktur |
| Lesepfad gegen echte Instanz | Live-Abfrage `auth.tobtech.de/api/v3/` am 2026-09-03 mit API-Token | **bestanden** — `core/groups/?name=FSR-Redaktion` und `?name=Moderation` liefern je `pk`/`name`; `core/groups/{pk}/` liefert `users_obj` mit `pk`/`username`/`name`; beide Gruppen existieren; Token authentifiziert als Dienstkonto `fb4-backend`. |
| OIDC-Discovery/JWKS gegen echte Instanz | Live-Abfrage am 2026-09-03 | **bestanden** — Issuer, authorize/token/userinfo/jwks/end-session, S256-PKCE, RS256, `offline_access` |
| Schreibpfad (`add_user`/`remove_user`) und Benutzernamen-Auflösung (`core/users/?username=`) gegen echte Instanz | manuelle Prüfung | **ausstehend** — Struktur bekannt, Round-Trip erst beim ersten echten Rollenwechsel bestätigbar |
| Durchgängiger Ablauf: Browser-Login → Backend akzeptiert JWT → Gruppen-Claim → Rolle → Rollenliste sichtbar | manuelle Prüfung | **ausstehend** — braucht einen echten Anmeldevorgang über den Systembrowser |

Bewertung: ADMIN-F-070 gilt als **teilweise umgesetzt** (`admin`-Spec Abschnitt 14). Die Fremdsystem-Struktur ist jetzt live bestätigt, die Kontoauswahl ohne bestehende Rolle über den Benutzernamen strukturell gebaut; offen bleiben die durchgängige Prüfung mit einem echten Anmeldevorgang und der erste schreibende Rollenwechsel.

## 3. DATA-F-120 im Web-Kontext

Der Web-Export läuft im Browser und hat keinen „gesicherten Systemspeicher" im Sinne von DATA-F-120. Das Sitzungsmerkmal wird dort im `localStorage` gehalten. Das ist die dem Browser-Kontext inhärente Grenze, die `../platform/security-and-privacy.md` (SEC-F-180) bereits für die ADMIN-Oberfläche benennt; auf den nativen App-Plattformen greift `expo-secure-store` unverändert. Nachvollzogen, kein Mangel gegenüber dem für Schritt 3 Machbaren.
