---
id: security-and-privacy
titel: Sicherheit und Datenschutz
praefix: SEC
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-08-24
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib/main_view_model.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/repositories/ods_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/services/ods_authentication_service.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/viewmodels/canteen_overview_viewmodel.dart
  - alte apps/fb4_app-main/fb4_app-main/assets/privacy
implemented_in: []
related:
  - data-and-storage.md
  - identity-and-moderation.md
  - backend-and-api.md
  - integrations.md
  - ../features/canteen-ratings/spec.md
  - ../features/event-volunteers/spec.md
  - ../features/settings/spec.md
---

# Sicherheit und Datenschutz

## 1. Zweck und Schutzziele

Die Neuentwicklung wandelt einen reinen Lese-Client in eine Anwendung mit nutzergenerierten Inhalten, personenbezogenen Daten und Schreibpfaden. Dieses Dokument legt fest, was dabei geschützt wird und welche Befunde aus der Alt-App nicht wiederholt werden dürfen.

| Schutzziel | Konkret zu schützen |
|---|---|
| Vertraulichkeit | Zugangsdaten/Sitzungsmerkmale, Semesterticket-Bild, Klarnamen und Kontaktwege aus Helfer-Anmeldungen |
| Integrität | Bewertungen, Stundenplandaten, Helferbedarf-Zusagen — keine unbemerkte Verfälschung oder doppelte Übertragung |
| Verfügbarkeit je Bereich | Ausfall eines Fremdsystems (siehe `integrations.md`) darf nur den betroffenen Bereich beeinträchtigen, nie die ganze App — siehe `non-functional.md` |
| Nachvollziehbarkeit ohne Personenbezug | Protokolle erlauben Fehleranalyse, ohne personenbezogene Inhalte offenzulegen |

## 2. Befunde aus der Alt-App, die nicht wiederholt werden dürfen

| Befund | Quelle | Konsequenz für die Neuentwicklung |
|---|---|---|
| Datenschutz-Gate wirkungslos: `shouldShowPrivacyPolicy` wird korrekt aus Einstellung und Versionsvergleich ermittelt und unmittelbar danach fest auf `false` überschrieben | `alte apps/fb4_app-main/fb4_app-main/lib/main_view_model.dart:8-22` (Überschreibung in Zeile 22) | Wirksames, versioniertes Zustimmungs-Gate erforderlich, siehe SEC-F-010 |
| Unverschlüsselter Abruf des Mensa-Endpunkts über `http://` | INT-004 in `integrations.md` | TLS ausnahmslos erzwingen, siehe SEC-N-030 |
| Zugangsdaten zum Notenportal im Klartext im Secure Storage, bei jedem Tokenablauf erneut gesendet | `alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/repositories/ods_repository.dart:14-19` | Für die Neuentwicklung ausgeschlossen; SSO oder offizielle Schnittstelle statt Passwort-Replay, siehe SEC-F-040, INT-006 |
| Fest verdrahtete interne IP-Adresse `10.11.15.121` im Anmeldeformular | `alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/services/ods_authentication_service.dart:11` | Zielsysteme über Konfiguration ansprechen, keine internen Adressen im Quellcode, siehe SEC-F-050 |
| Semesterticket unverschlüsselt im Dateisystem der App | `alte apps/fb4_app-main/fb4_app-main/lib/areas/ticket/viewmodels/ticket_overview_viewmodel.dart:82-89` | Verschlüsselte Ablage bereits als DATA-F-040 gefordert; hier nur als Sicherheitsbefund geführt |
| Stillschweigend verschluckte Fehler: `try`-Block mit leerem `finally`, ohne `catch` | `alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/viewmodels/canteen_overview_viewmodel.dart:60-66` | Fehler müssen behandelt oder protokolliert werden, dürfen nie stillschweigend verschwinden, siehe SEC-F-060 |

## 3. Verarbeitungsverzeichnis (personenbezogene Daten)

Nutzergenerierte Inhalte und personenbezogene Daten sind gegenüber dem Bestand neu; die Alt-App sammelte laut ihrer Datenschutzerklärung keine personenbezogenen Daten (siehe Abschnitt 4).

| Datenart | Zweck | Rechtsgrundlage | Empfänger | Speicherdauer | Betroffene Feature-Spec |
|---|---|---|---|---|---|
| Helfer-Anmeldung (Name, Kontaktweg) | Koordination von Helferbedarf bei FSR-Events | Einwilligung | Eigenes Backend (INT-008), FSR-Eventorganisation | bis Zweckerfüllung des Events, danach Löschung/Anonymisierung — Frist offen, siehe Abschnitt 9 | `features/event-volunteers/spec.md` |
| Bewertung (Pseudonym, Sternebewertung, optionaler Kommentar) | Community-Bewertung von Mensa-Gerichten | Einwilligung | Eigenes Backend (INT-008), andere Nutzerinnen (Anzeige) | dauerhaft bis Löschung durch Nutzerin, siehe `identity-and-moderation.md` | `features/canteen-ratings/spec.md` |
| Push-Kennung (Firebase-Geräte-ID) | Zustellung von Push-Benachrichtigungen | Einwilligung (Opt-in) | Google/Firebase (INT-005) | bis Abmeldung vom Thema bzw. Firebase-Standardfristen | `features/news/spec.md`, `features/settings/spec.md` |
| Technische Protokolle des Backends (z. B. IP-Adresse, Zeitstempel, aufgerufener Endpunkt) | Betrieb, Fehleranalyse, Missbrauchserkennung | Berechtigtes Interesse | Eigener Backend-Betrieb (INT-008) | kurz, Vorschlag 30 Tage, zu bestätigen | `backend-and-api.md` |

## 4. Datenschutzerklärung

Die Erklärung der Alt-App liegt unter `alte apps/fb4_app-main/fb4_app-main/assets/privacy`. Sie beschreibt fünf Themen: keine Sammlung persönlicher Daten, Übermittlung der Stundenplan-Formulardaten an die FBWS-API ohne Identifizierbarkeit, lokale und nie übertragene Gruppenkennung, ODS-Zugangsdaten nur lokal in der iOS Keychain, sowie OpenMensa- und Firebase-Cloud-Messaging-Hinweise.

| Abschnitt der Alt-Erklärung | Status für die Neuentwicklung |
|---|---|
| Keine Sammlung persönlicher Daten (allgemeine Aussage) | entfällt als Gesamtaussage — die neue App sammelt personenbezogene Daten, siehe Abschnitt 3 |
| Übermittlung an FBWS-API für Stundenplan | inhaltlich übernehmbar, Formulierung an neuen Backend-Vermittler (INT-002/INT-008) anzupassen |
| Gruppenkennung nie übertragen, nur lokal | inhaltlich übernehmbar unverändert |
| ODS-Zugangsdaten | entfällt vollständig zugunsten von HISinOne (INT-006, `decisions/0006-abloesung-ods-durch-hisinone.md`) |
| Mensa/OpenMensa | neu zu formulieren: Abruf läuft über das eigene Backend (INT-008), nicht mehr direkt vom Gerät |
| Firebase Cloud Messaging | inhaltlich übernehmbar, sofern INT-005 unverändert fortgeführt wird |
| Bewertungen, Events, Helfer-Anmeldungen, eigenes Backend allgemein | vollständig neu zu schreiben, kein Vorbild in der Alt-Erklärung |

## 5. Berechtigungen auf dem Gerät

Die Alt-App forderte Zugriff auf Dateiauswahl (Semesterticket-Import aus PDF, `alte apps/fb4_app-main/fb4_app-main/lib/areas/ticket/viewmodels/ticket_overview_viewmodel.dart:59`) und Benachrichtigungen (INT-005). Neu hinzu kommen möglicherweise Kalenderzugriff (Events) und Standort (Raumsuche, nur falls tatsächlich benötigt) — beide als offener Bedarf zu bestätigen in den jeweiligen Feature-Specs.

## 6. Transportsicherheit, Geheimnisse, Protokollierung

Alle Netzaufrufe laufen über TLS mit ungeprüfter Zertifikatsvalidierung im Produktivbuild; eine Deaktivierung der Prüfung ist ausgeschlossen. Hinweis zur Prüfung: `alte apps/fb4_app-main/fb4_app-main/lib/areas/news/repositories/news_repository.dart:7` enthält einen Codekommentar, der eine Ignorierung von Zertifikatsvertrauen nahelegt; im Code selbst wurde keine tatsächliche Zertifikatsumgehung gefunden (kein `badCertificateCallback`, kein `HttpOverrides` im gesamten `lib`-Verzeichnis). Der Kommentar ist damit kein bestätigter Befund, aber ein Hinweis, die Zertifikatsprüfung in der Neuentwicklung ausdrücklich zu testen. Geheimnisse (API-Token, Schlüssel) dürfen nicht im Klartext im Quellcode oder Repository liegen, sondern werden über einen gesicherten Build- oder Laufzeitmechanismus bereitgestellt. Protokolle enthalten keine personenbezogenen Inhalte wie Klartext-Zugangsdaten oder vollständige Nutzerbeiträge.

## 7. Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| SEC-F-010 | Das System muss vor der Nutzung von Funktionen mit personenbezogenen oder nutzergenerierten Daten eine wirksame, versionierte Einwilligung zur Datenschutzerklärung einholen. | Alt: bewusst verworfen |
| SEC-F-020 | Wenn sich der Inhalt der Datenschutzerklärung inhaltlich ändert, muss das System die Einwilligung erneut einholen, bevor betroffene Funktionen weiter genutzt werden können. | NEU |
| SEC-N-030 | Das System muss alle Netzwerkabrufe ausschließlich über TLS (https://) durchführen, ausnahmslos. | Alt: bewusst verworfen |
| SEC-F-040 | Das System muss für die Anbindung an Notenportale SSO oder eine offizielle Schnittstellen-Authentifizierung verwenden, statt Zugangsdaten der Nutzerin zwischenzuspeichern und bei Tokenablauf erneut zu senden. | Alt: bewusst verworfen |
| SEC-F-050 | Das System muss Zielsysteme ausschließlich über Konfiguration ansprechen, nicht über fest im Quellcode verdrahtete interne Adressen. | Alt: bewusst verworfen |
| SEC-F-060 | Falls ein Fehler beim Lesen oder Schreiben lokaler oder entfernter Daten auftritt, muss das System ihn behandeln oder protokollieren; er darf nicht stillschweigend verschwinden. | Alt: bewusst verworfen |
| SEC-F-070 | Das System muss für jede Verarbeitung personenbezogener Daten aus dem Verarbeitungsverzeichnis (Abschnitt 3) Zweck, Rechtsgrundlage und Speicherdauer in der Datenschutzerklärung ausweisen. | NEU |
| SEC-F-080 | Das System muss jede Systemberechtigung erst im Moment ihres tatsächlichen Bedarfs mit einer für die Nutzerin verständlichen Begründung anfragen. | NEU |
| SEC-F-090 | Falls eine optionale Systemberechtigung nicht erteilt wird, muss das System ohne diese Berechtigung nutzbar bleiben, mit eingeschränkter Funktionalität nur im betroffenen Bereich. | NEU |
| SEC-N-100 | Das System muss TLS-Zertifikate der aufgerufenen Server ohne Ausnahme validieren; eine Deaktivierung der Zertifikatsprüfung ist im Produktivbuild ausgeschlossen. | NEU |
| SEC-N-110 | Das System muss Geheimnisse (API-Token, Schlüssel) über einen gesicherten Build- oder Laufzeitmechanismus bereitstellen, niemals im Klartext im Quellcode. | NEU |
| SEC-N-120 | Das System muss Protokolle so gestalten, dass sie keine personenbezogenen Inhalte enthalten. | NEU |

## 8. Bewusst nicht übernommenes Altverhalten

- Wirkungsloses, fest deaktiviertes Datenschutz-Gate — Grund: verstößt gegen die Einwilligungspflicht, siehe SEC-F-010.
- Unverschlüsselter Mensa-Abruf über `http://` — Grund: überträgt Anfragedaten im Klartext, siehe SEC-N-030.
- Passwort-Replay am Notenportal — Grund: unsicheres Verfahren, durch SSO/offizielle Schnittstelle ersetzt, siehe SEC-F-040.
- Fest verdrahtete interne IP-Adresse — Grund: Betriebsdetail gehört nicht in den Quellcode, siehe SEC-F-050.
- Stillschweigend verschluckte Fehler beim Lesen von Einstellungen — Grund: verdeckt Fehlerzustände, siehe SEC-F-060.

## 9. Offene Fragen

- Speicherdauer und Löschfrist von Helfer-Anmeldungen nach Zweckerfüllung des Events: ungeklärt. Klärung durch FSR FB4 im Zuge von `features/event-volunteers/spec.md`.
- Aufbewahrungsdauer technischer Backend-Protokolle: vorgeschlagen 30 Tage, ungeprüft. Klärung im Zuge von `backend-and-api.md`.
- Tatsächlicher Bedarf für Kalender- und Standortzugriff: noch nicht bestätigt. Klärung in `features/events/spec.md` bzw. `features/room-finder/spec.md`.
