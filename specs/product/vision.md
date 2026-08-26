---
status: accepted
version: 0.2.0
owner: FSR FB4
last_reviewed: 2026-08-25
---

# Produktvision

## 1. Auftraggeber und Zielgruppe

Auftraggeber ist der Fachschaftsrat Informatik (FSR FB4) der FH Dortmund — die gewählte studentische Vertretung des Fachbereichs 4, aktuell rund 17 Mitglieder in Rollen wie Vorsitz, Kassenverwaltung, IT-Support und Event-Organisation. Der FSR verwaltet einen Teil des studentischen Semesterbeitrags, um daraus regelmäßige und besondere Events zu finanzieren, und ist Ansprechpartner der Studierenden gegenüber der Hochschule.

Primäre Zielgruppe der App sind die Studierenden aller Studiengänge des Fachbereichs Informatik (Bachelor und Master, Voll- und Duale Studiengänge, siehe INT-001), mit besonderem Gewicht auf Erstsemestern — laut FSR-Website (`fsrfb4.de`, Menüpunkt „ERSTIS") und der Erstsemester-Linksammlung (`linkstapel.de/@fsrfb4`: Orientierungsphasen-Zeitplan, Anmeldung, Erstiheft) eine eigens adressierte Nutzergruppe mit erhöhtem Informationsbedarf zu Studienstart, Orientierung und Erstkontakt zum FSR.

## 2. Warum ein Neuaufbau

Zwei Alt-Apps bedienen die Zielgruppe heute unzureichend: eine Flutter/iOS-App mit vorliegendem Quellcode (`alte apps/fb4_app-main/`, Funktionsumfang laut eigenem README u. a. „noch in Arbeit") und eine separate Android-App (`de.fsrfb4.fb4`, `alte apps/android-fb4/`). Für beide liegt inzwischen der Quellcode vor. Beide sind reine Lese-Clients ohne Community-Funktionen und ohne Event-/Helfer-Verwaltung; eine Raumsuche enthält die Android-App entgegen der ursprünglichen Annahme sehr wohl — sie ist dort die fachlich bedeutendste Zusatzfunktion und gilt als der zu übertreffende Stand. Details zu beiden: `product/legacy-inventory.md`.

Der Neuaufbau als einzelne React-Native-App (`decisions/0001-react-native-als-plattform.md`) löst diese Fragmentierung auf und erweitert den Funktionsumfang um Community- und Redaktionsfunktionen, die ein eigenes Backend erfordern (`decisions/0003-eigenes-backend-fuer-community-funktionen.md`). Die Entwicklung folgt einer spec-anchored Arbeitsweise (`decisions/0002-spec-anchored-arbeitsweise.md`), damit fachliches Wissen den jährlichen Wechsel der FSR-Besetzung übersteht — ein Problem, das bei der quellcodelosen Android-Alt-App bereits eingetreten ist.

## 3. Leitziele

| Ziel | Bedeutung |
|---|---|
| Eine App statt zwei | Ablösung von Flutter/iOS- und Android-Alt-App durch eine einzige, plattformübergreifende App |
| Vom Lese-Client zur Plattform | Ergänzung um Community-Funktionen (Mensa-Bewertungen, Helfer-Anmeldung) und FSR-Redaktion (News, Events), die die Alt-Apps nicht boten |
| Bestehende Kernnutzung erhalten | Stundenplan, Mensaplan, News, Semesterticket, Notenübersicht bleiben zentrale, mindestens gleichwertige Funktionen (siehe `product/legacy-inventory.md` für den Umfang je Alt-App) |
| Fremdabhängigkeiten abbauen | Ablösung risikobehafteter privater Infrastruktur (`hemacode.de`, siehe INT-003/INT-004) und unsicherer Verfahren (ODS-Passwort-Replay, siehe INT-006, SEC) |
| Wissen dauerhaft sichern | Spec-anchored Arbeitsweise, damit fachliches und technisches Wissen nicht an einzelne, wechselnde FSR-Mitglieder gebunden bleibt |

## 4. Institutioneller Kontext

Der Fachbereich Informatik der FH Dortmund positioniert sich als einer der größten und breitesten Informatik-Fachbereiche in NRW (`fh-dortmund.de/hochschule/informatik`), mit mehreren Bachelor-/Master-Studiengängen, dualen Studienvarianten und eigenen Laboren. Die App bewegt sich damit in einem Umfeld mit mehreren tausend potenziellen Nutzerinnen und Nutzern (die Android-Alt-App verzeichnet laut Play Store bereits 5.000+ Installationen), institutionell getragenen Systemen (FBWS, HISinOne) und einer aktiven Fachbereichs-Kommunikation (`aktuelles-ni`-Seite), die als Kontext für die App-Inhalte relevant ist, ohne selbst Teil des FSR zu sein.

## 5. Abgrenzung zu externen Diensten

Nicht jeder in `linkstapel.de/@fsrfb4` gelistete Dienst wird App-Feature. Externe, bereits gut funktionierende Dienste (ILIAS, Discord, Hochschulsport, AStA, BAföG-Infoseiten, Wohnungsangebote des Studierendenwerks) bleiben externe Links, sofern eine Feature-Spec nichts anderes festlegt. Die Entscheidung, welcher Dienst als Link vs. als eigenes Feature abgebildet wird, trifft jede betroffene Feature-Spec einzeln in ihrem Abschnitt „Scope / Nicht-Scope"; projektweite Abgrenzungsfragen dazu stehen in `specs/open-questions.md`.

## 6. Nicht-Ziele

- Kein Ersatz für offizielle Hochschulsysteme (ILIAS, HISinOne, QIS/HIS) — die App verlinkt oder liest lesend, ersetzt sie aber nicht.
- Keine fachbereichsweite oder hochschulweite App — Zielgruppe bleibt FB4.
- Keine Monetarisierung oder Werbung.
