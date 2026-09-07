## REMOVED Requirements

### Requirement: Prüfungsplan-Upload mit Importergebnis

**Grund:** Der Prüfungsbestand wird seit dem 2026-09-06 im Backend aus dem ohnehin abgerufenen Raumplan abgeleitet (Capability `backend-and-api`, „Ableitung des Prüfungsbestands aus dem Raumplan"). Es gibt keine Datei mehr, die eine Redaktionsperson hochladen könnte, und damit auch kein Importergebnis anzuzeigen. Entschieden 2026-09-06.

**Ersetzt durch:** nichts in dieser Capability. Vormals ADMIN-F-160; die Kennung bleibt vergeben.

### Requirement: Abschluss des Imports trotz unlesbarer Zeilen

**Grund:** Die Anforderung beschreibt die Fehlertoleranz des entfallenen Excel-Imports. Der entsprechende Fall im abgeleiteten Bestand — ein Prüfungseintrag, dessen Namensmuster keine Modulnummer hergibt — ist in der Capability `backend-and-api` geregelt: Er wird als Prüfung ohne Modulbezug geführt und protokolliert, statt verworfen zu werden. Entschieden 2026-09-06.

**Ersetzt durch:** das Scenario „Nicht auflösbares Namensmuster" der Anforderung „Ableitung des Prüfungsbestands aus dem Raumplan" (Capability `backend-and-api`). Vormals ADMIN-F-170; die Kennung bleibt vergeben.
