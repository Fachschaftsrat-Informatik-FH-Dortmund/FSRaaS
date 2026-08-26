---
nummer: 0012
titel: Zuschnitt der ersten Ausbaustufe
status: angenommen
datum: 2026-08-25
betrifft:
  - ../product/roadmap.md
  - ../features/canteen-ratings/spec.md
  - ../features/news/spec.md
  - ../features/schedule/spec.md
  - ../features/room-finder/spec.md
  - ../features/settings/spec.md
  - ../features/admin/spec.md
  - ../platform/identity-and-moderation.md
  - ../platform/integrations.md
---

# ADR 0012: Zuschnitt der ersten Ausbaustufe

## Kontext

Der Spec-Bestand umfasst 14 Feature-Specs mit über 250 Anforderungen. Sechs davon hängen an Fremdsystemen, deren Zugang ungeklärt ist: NOTEN an INT-006 (HISinOne, Spike ausstehend), WIKI an INT-007 (BookStack-API, unverifiziert), NEWS in der Klassifizierung „FB-Aktuelles" an INT-010 (`aktuelles-ni`, Feed oder Scraping unklar), EVENT an INT-011 (Freigabe-URL des Kalenders offen), SCHED in der Prüfungsplan-Funktion an INT-013 (Format erst grob erfasst) und EKEY an INT-014 (Integrationsart mit dem bestehenden Verwaltungstool offen). Jede dieser Klärungen liegt ganz oder teilweise außerhalb des Projekts.

Gleichzeitig erfolgt die Umsetzung nebenher durch eine einzelne Person. Ein Zuschnitt, der die Auslieferung an sechs externe Klärungen bindet, führt absehbar dazu, dass gar nichts ausgeliefert wird.

Zwei weitere Punkte wirken auf den Schnitt. Die Push-Zustellung (INT-005) verlangt seit `0008-vertrieb-ueber-drei-app-stores.md` zwei getrennte Wege — UnifiedPush für Android, Firebase Cloud Messaging für iOS — samt Fan-out im Backend; INT-005 nennt selbst die In-App-Benachrichtigung als Rückfalloption. Und nutzergenerierte Freitext-Kommentare (RATE-F-020) lösen die Moderationspflichten aus `platform/identity-and-moderation.md` aus (IDENT-F-090 bis F-110, IDENT-N-010: Prüfung binnen fünf Werktagen), die ohne Moderationsoberfläche nicht erfüllbar sind.

## Entscheidung

Die Umsetzung erfolgt in zwei Ausbaustufen. Die erste enthält ausschließlich, was ohne offene Fremdsystem-Klärung baubar ist; alles Übrige folgt in der zweiten. Der Spec-Bestand bleibt davon inhaltlich unberührt — keine Anforderung entfällt, keine wird geändert; verschoben wird allein der Zeitpunkt der Umsetzung. Die Zuordnung führt `product/roadmap.md`.

Erste Ausbaustufe: SHELL, SCHED (ohne die Prüfungsplan-Anforderungen SCHED-F-190 bis F-220), MENSA, NEWS (nur Klassifizierung „FSR-News", ohne Push), RAUM (vollständig), TICKET, SET, RATE (ohne Freitext und Meldeweg) sowie ADMIN in dem Umfang, den diese Features voraussetzen.

Drei Funktionen werden dabei gezielt aus ansonsten enthaltenen Features herausgelöst: die Fernzustellung von Push-Benachrichtigungen (NEWS-F-060/070, SET-F-010) rückt in die zweite Stufe, ersetzt durch In-App-Hinweise; Freitext-Kommentare und Meldeweg bei Bewertungen (RATE-F-020, RATE-F-060) rücken in die zweite Stufe, gemeinsam mit der Moderationsoberfläche; die Prüfungsplan-Funktion des Stundenplans rückt in die zweite Stufe, gemeinsam mit der Klärung von INT-013.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| **Zwei Stufen, erste Stufe ohne offene Fremdsystem-Abhängigkeit (gewählt)** | mittel | Auslieferung hängt an keiner externen Freigabe; die Alt-Apps werden in ihren meistgenutzten Funktionen abgelöst; die Spikes laufen parallel, ohne den Fortschritt zu blockieren | zwei Auslieferungen statt einer; NOTEN und Push fehlen zunächst, obwohl beide in der Alt-App vorhanden waren |
| Alle Kern-Features in einer Stufe | hoch | vollständiger Funktionsumfang zum Launch, ein einziger Auslieferungsvorgang | Auslieferung hängt an vier externen Klärungen gleichzeitig; bei einer einzigen Verzögerung verzögert sich alles |
| Alle 14 Feature-Specs in einer Stufe | sehr hoch | nichts bleibt offen | der kritische Pfad läuft über Hochschul-IT und ein fremdes Verwaltungstool; für eine Person nebenher nicht planbar |
| Nur ein Durchstich (Rahmen, Stundenplan, Mensaplan) | gering | validiert Architektur und Arbeitsweise am schnellsten | zu wenig, um die Alt-Apps abzulösen; die Bestandsnutzung von News und Semesterticket bliebe ohne Ersatz |

### Erläuterungen

**Zum Herauslösen der Push-Zustellung.** Die Trennung verläuft entlang einer bereits im Spec-Bestand angelegten Linie: Lokale Benachrichtigungen (MENSA-F-100) kommen ausdrücklich ohne INT-005 aus und bleiben deshalb in der ersten Stufe, während jede netzgestützte Zustellung den doppelten Zustellweg und den Fan-out im Backend voraussetzt.

**Zum Herauslösen der Freitext-Kommentare.** Ohne Freitext entfällt der Moderationsbedarf nahezu vollständig — eine Sternebewertung ist weder beleidigend noch rechtswidrig. Die Anforderungen IDENT-F-080 bis F-110 bleiben unverändert gültig und werden mit RATE-F-020 gemeinsam umgesetzt. Der Missbrauchsschutz für die Sternebewertung selbst (IDENT-F-050, IDENT-F-060, RATE-F-040) bleibt in der ersten Stufe enthalten.

## Konsequenzen

- Die Specs der ersten Stufe wechseln auf `status: accepted`, die übrigen bleiben `draft` (`README.md` Abschnitt 3).
- `product/roadmap.md` führt die Zuordnung je Anforderung und ist bei jeder Verschiebung mitzuführen.
- Die zweite Stufe ist keine Wunschliste, sondern gebunden an konkrete Klärungen; die Spikes zu INT-006, INT-007, INT-010, INT-012 (Federation), INT-013 und INT-014 laufen parallel zur ersten Stufe.
- Für NOTEN bleibt die in `0006-abloesung-ods-durch-hisinone.md` benannte Rückfalloption bestehen: Verweis auf die Weboberfläche der Hochschule, solange kein Zugang bestätigt ist.
- Die Store-Auflagen gelten ab der ersten Auslieferung, insbesondere die Testauflage bei Google Play (NFR-N-200: zwölf Testende über vierzehn Tage) — sie ist frühzeitig anzustoßen, da sie allein zwei Wochen Vorlauf erzeugt.

## Offene Punkte

- Zeitpunkt der ersten Auslieferung; sinnvoll wäre eine Kopplung an den Semesterbeginn, da Erstsemester laut `product/vision.md` die Zielgruppe mit dem höchsten Informationsbedarf sind.
- Ob die zweite Stufe als eine Auslieferung erfolgt oder je Feature ausgeliefert wird, sobald dessen Klärung vorliegt.
