---
id: canteen-photos
titel: Gerichtsfotos
praefix: FOTO
status: draft
prioritaet: ausbau
version: 0.2.0
owner: FSR FB4
last_reviewed: 2026-09-04
derived_from: []
implemented_in: []
related:
  - ../canteen/spec.md
  - ../canteen-ratings/spec.md
  - ../admin/spec.md
  - ../settings/spec.md
  - ../../platform/identity-and-moderation.md
  - ../../platform/backend-and-api.md
  - ../../platform/data-and-storage.md
  - ../../platform/security-and-privacy.md
  - ../../platform/non-functional.md
  - ../../platform/ux-and-theming.md
---

# Gerichtsfotos

## 1. Zweck & Nutzen

Die Bezeichnung eines Mensagerichts sagt wenig darüber, was auf dem Teller landet. Ein Foto beantwortet in einer Sekunde, was drei Zeilen Text und eine Zusatzstoffliste offenlassen — wie groß die Portion ist, wie die Beilage aussieht, ob das Gericht dem entspricht, was die Bezeichnung verspricht.

Die Fotos entstehen von den Studierenden selbst, nicht vom Studierendenwerk: Wer ein Gericht vor sich hat, fotografiert es und stellt es den anderen zur Verfügung. Das macht diese Spec zur zweiten nutzergenerierten Inhaltsart der App nach den Bewertungen (`../canteen-ratings/spec.md`) — mit denselben Fragen nach Konto, Moderation und Löschung, aber einem höheren Risiko je Beitrag: Ein unangemessenes Bild wirkt sofort und ohne Lesen.

Deshalb gilt hier, anders als bei Kommentaren, eine Freigabe **vor** der Veröffentlichung (FOTO-F-060, siehe Erläuterung).

## 2. Scope / Nicht-Scope

### Scope

- Anzeige eines freigegebenen Fotos je Gericht in der Gerichtsliste des Mensaplans.
- Anzeige der Fotos in der Detailansicht des Gerichts (`../canteen-ratings/spec.md` RATE-F-080), mit Blättern durch alle freigegebenen Fotos desselben Gerichts.
- Hochladen eigener Fotos durch angemeldete Nutzerinnen, einschließlich Entfernen der Bildmetadaten vor der Übertragung.
- Freigabe, Ablehnung und Meldung von Fotos, einschließlich der zugehörigen Moderationsansicht.
- Zuordnung eines Fotos zu einem Gericht über den normalisierten Gerichtsschlüssel.

### Nicht-Scope

- Die Gerichtsliste selbst, ihre Zusammenfassung über Mensen und ihre Zustände — `../canteen/spec.md` (MENSA). Diese Spec belegt dort nur eine Bildfläche je Gerichtseintrag.
- Bewertung und Kommentare — `../canteen-ratings/spec.md` (RATE). Foto und Bewertung sind getrennte Beiträge; ein Foto ist keine Bewertung, auch wenn beide dieselbe Detailansicht teilen (siehe Erläuterung zu FOTO-F-030).
- Konto, Rollen und Sperrverfahren — `../../platform/identity-and-moderation.md` (IDENT). Diese Spec nutzt die dort definierte Rolle Moderation, führt aber keine eigene Rollenlogik ein.
- Automatische Bilderkennung oder maschinelle Vorfilterung hochgeladener Fotos — bewusst nicht; die Freigabe erfolgt durch Menschen (siehe Abschnitt 13).
- Fotos zu anderen Inhalten als Mensagerichten (News-Bilder, Event-Bilder) — nicht Gegenstand dieser Spec.

## 3. Nutzergeschichten

- Als Studierende möchte ich sehen, wie ein Gericht aussieht, bevor ich mich in die Schlange stelle.
- Als Studierende möchte ich ein Foto antippen und größer betrachten, weil das Vorschaubild neben der Bezeichnung klein ist.
- Als Studierende möchte ich mehrere Fotos desselben Gerichts durchsehen, weil eine Portion vom Vortag anders aussehen kann als die von heute.
- Als Studierende möchte ich ein eigenes Foto beisteuern, wenn zu einem Gericht noch keines vorliegt.
- Als Mitglied der Moderation möchte ich jedes Foto vor seiner Veröffentlichung sehen, damit unangemessene Bilder gar nicht erst erscheinen.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| FOTO-F-010 | Sofern zu einem Gericht mindestens ein freigegebenes Foto vorliegt, muss das System es in der Gerichtsliste des Mensaplans neben den Kennzeichnungen des Gerichts anzeigen. | NEU |
| FOTO-F-020 | Falls zu einem Gericht kein freigegebenes Foto vorliegt, muss das System den Gerichtseintrag ohne Bildfläche darstellen. | NEU |
| FOTO-F-030 | Wenn die Nutzerin ein Foto antippt, muss das System die Detailansicht des Gerichts (`../canteen-ratings/spec.md` RATE-F-080) mit diesem Foto im Vordergrund öffnen. | NEU |
| FOTO-F-040 | Das System muss in der Detailansicht das Blättern durch alle freigegebenen Fotos desselben Gerichts ermöglichen. | NEU |
| FOTO-F-050 | Das System muss einer angemeldeten Nutzerin aus der Detailansicht heraus das Hochladen eines eigenen Fotos zum betrachteten Gericht ermöglichen. | NEU |
| FOTO-F-060 | Das System muss ein hochgeladenes Foto erst nach ausdrücklicher Freigabe durch die Rolle Moderation für andere Nutzerinnen sichtbar machen. | NEU |
| FOTO-F-070 | Solange ein eigenes Foto nicht freigegeben ist, muss das System es ausschließlich der hochladenden Person und der Moderation anzeigen, versehen mit dem Hinweis auf die ausstehende Freigabe. | NEU |
| FOTO-F-080 | Das System muss der Rolle Moderation eine Liste der zur Freigabe anstehenden Fotos mit den Handlungsmöglichkeiten Freigeben und Ablehnen bereitstellen. | NEU |
| FOTO-F-090 | Wenn die Moderation ein Foto ablehnt, muss das System die hochladende Person über die Ablehnung und deren Grund benachrichtigen. | NEU |
| FOTO-F-100 | Das System muss der hochladenden Person das Löschen ihres eigenen Fotos ermöglichen, unabhängig vom Freigabestand. | NEU |
| FOTO-F-110 | Das System muss der Nutzerin das Melden eines freigegebenen Fotos ermöglichen. | NEU |
| FOTO-F-120 | Wenn ein freigegebenes Foto gemeldet wird, muss das System es bis zur Entscheidung der Moderation ausblenden. | NEU |
| FOTO-F-130 | Das System muss ein Foto anhand der normalisierten Gerichtsbezeichnung (RATE-F-050) einem Gericht zuordnen. | NEU |
| FOTO-F-140 | Das System muss vor der Übertragung eines Fotos dessen eingebettete Metadaten entfernen, insbesondere Aufnahmeort und Aufnahmezeitpunkt. | NEU |
| FOTO-F-150 | Das System muss der hochladenden Person vor der Übertragung anzeigen, dass ihr Foto öffentlich sichtbar wird und der Freigabe unterliegt. | NEU |
| FOTO-F-160 | Wenn ein Konto gelöscht wird, muss das System die von ihm hochgeladenen Fotos ebenfalls löschen. | NEU |
| FOTO-F-170 | Das System muss beim Hochladen ausschließlich die Bildformate JPEG und PNG annehmen und andere Dateien mit begründeter Meldung ablehnen. | NEU |

### Erläuterungen

**`FOTO-F-030` — geteilte Detailansicht statt eigener Bildschirm (geändert am 2026-09-04).** Vor dieser Änderung war offen, ob das Antippen eines Fotos einen eigenen Bildschirm öffnet oder denselben, den RATE-F-080 beim Antippen des Gerichts öffnet. Entschieden zugunsten einer einzigen Detailansicht je Gericht: Sie zeigt die Fotos im Vollbild mit Blättern (FOTO-F-040), die eigene und die Community-Bewertung (`../canteen-ratings/spec.md` RATE-F-030/F-080) sowie die Eingabe der eigenen Bewertung (RATE-F-085) — dort und ausschließlich dort, weil drei Antworttasten mehr Fläche brauchen als die knappe Symbolanzeige in der Gerichtsliste verträgt (Erläuterung zu RATE-F-085). Ein eigener, von RATE-F-080 unabhängiger Bildschirm würde dieselbe Fläche zweimal beanspruchen und Nutzerinnen zwischen zwei fast identischen Ansichten hin- und herführen. Foto und Bewertung bleiben trotz gemeinsamer Ansicht getrennte Beiträge (Abschnitt 2 Nicht-Scope): Ein Foto lässt sich ohne Bewertung hochladen und eine Bewertung ohne Foto abgeben.

**`FOTO-F-060` — Freigabe vor Veröffentlichung, abweichend von IDENT-F-080.** Bewertungskommentare erscheinen ohne Vorprüfung und werden erst auf Meldung hin geprüft (IDENT-F-080, IDENT-F-090). Für Fotos gilt das Gegenteil, aus drei Gründen: Ein Bild wirkt ohne Lesen und damit sofort; ein unangemessenes Bild ist als Rechtsverstoß schwerer zu heilen als ein Satz Text; und die zu erwartende Menge ist klein genug, dass eine Vorabprüfung die Moderation nicht überlastet — anders als bei Kommentaren, wo eine Vorprüfung die Funktion praktisch anhalten würde. Die Prüffrist aus IDENT-N-010 (fünf Werktage) gilt sinngemäß auch hier, wirkt aber vor der Veröffentlichung: Ein Foto kann bis zu fünf Werktage unsichtbar bleiben. Die hochladende Person sieht ihr eigenes Bild währenddessen (FOTO-F-070), damit der Vorgang nicht als Fehler wirkt.

**`FOTO-F-120` — Melden blendet aus, anders als bei Kommentaren.** IDENT-F-090 hält ausdrücklich fest, dass ein gemeldeter Kommentar nicht automatisch ausgeblendet wird, um Missbrauch der Meldefunktion als Zensurwerkzeug zu verhindern. Bei Fotos überwiegt die Gegenrichtung: Ein bereits freigegebenes Bild, das sich als Verstoß herausstellt, richtet in der Zeit bis zur Prüfung mehr Schaden an als ein zu Unrecht kurzzeitig verborgenes Bild — zumal das Gericht ohne Foto weiterhin vollständig nutzbar bleibt (FOTO-F-020).

**`FOTO-F-140` — Metadaten entfernen.** Kamerabilder tragen regelmäßig GPS-Koordinaten, Aufnahmezeit und Geräteangaben im EXIF-Block. Ein Foto vom Mensatisch verrät damit ohne Zutun der hochladenden Person, wo und wann sie war. Die Entfernung erfolgt **auf dem Gerät vor der Übertragung**, nicht erst serverseitig, damit die Daten das Gerät gar nicht erst verlassen (`../../platform/security-and-privacy.md`, Grundsatz der Datenminimierung). Serverseitig wird die Entfernung zusätzlich geprüft, weil ein manipulierter Client sie umgehen könnte.

**`FOTO-F-130` — Zuordnung über den normalisierten Schlüssel.** Dieselbe Grundlage wie bei Bewertungen (RATE-F-050) und Lieblingsgerichten (MENSA-F-090): Ein Foto gehört zum Gericht, nicht zum Zubereitungstag und nicht zur Mensa. Damit erscheint dasselbe Foto an jedem Tag, an dem das Gericht angeboten wird, und in jeder Mensa, die es führt — passend zur zusammengefassten Gerichtsliste (MENSA-F-012). Ob eine standortbezogene Zuordnung nötig wird, ist offen (Abschnitt 13); sie entspräche der für Bewertungen bewusst zurückgestellten Standortfrage.

**Verhältnis zum Mensaplan.** Die Bildfläche liegt im Gerichtseintrag der Ansicht aus `../canteen/spec.md`; MENSA führt sie im Nicht-Scope, damit die Anforderung nur an einer Stelle steht. Ohne freigegebenes Foto verhält sich die Gerichtsliste unverändert zur heutigen Fassung (FOTO-F-020) — die Fotofunktion ist damit vollständig additiv und blockiert keinen MENSA-Schnitt.

## 5. Datenmodell

Foto: Kennung, Gericht-Referenz (normalisierter Titel, RATE-F-050), Konto-Referenz der hochladenden Person, Bilddatei, Zeitpunkt des Hochladens, Freigabestand (`ausstehend` | `freigegeben` | `abgelehnt` | `gemeldet` | `entfernt`), Grund bei Ablehnung oder Entfernung, moderierendes Konto und Zeitpunkt der Entscheidung.

Die Bilddateien selbst liegen nicht in der Datenbank, sondern als Dateien im Ablagebereich des Backends (Ablageort und Sicherung: `../../platform/data-and-storage.md`, `../../decisions/0017-zugriff-und-datensicherung-vps.md`). Je Foto wird zusätzlich eine verkleinerte Fassung für die Listendarstellung (FOTO-F-010) vorgehalten, damit die Gerichtsliste nicht die Vollbilder lädt.

Geräteseitig wird nichts über die eigenen Fotos hinaus gespeichert; die Anzeige arbeitet auf dem Bildzwischenspeicher der App (`../../platform/data-and-storage.md` Abschnitt 4).

## 6. Externe Schnittstellen

Ausschließlich das eigene Backend (INT-008). Das Hochladen, die Freigabe und der Abruf der Fotos sind neue Endpunkte des eigenen Vertrags und vor der Umsetzung in `../../platform/api-contract.yaml` zu beschreiben (API-N-035). Keine Fremdschnittstelle beteiligt; insbesondere wird kein externer Bild- oder CDN-Dienst genutzt, weil damit Nutzungsdaten der Betrachtenden an Dritte abflössen.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Gerichtsliste, Foto vorhanden | Verkleinerte Fassung neben den Kennzeichnungen, antippbar (FOTO-F-010/F-030) |
| Gerichtsliste, kein Foto | Keine Bildfläche, keine Platzhaltergrafik (FOTO-F-020) |
| Gerichtsliste, Foto lädt | Fläche in Endgröße reserviert, damit kein Layoutsprung entsteht; Bild erscheint nach dem Laden |
| Detailansicht geöffnet | Angetipptes Foto im Vollbild mit Blättern durch die übrigen Fotos des Gerichts (FOTO-F-040), zusätzlich Gesamt- und Tagesbewertung sowie die Eingabe der eigenen Bewertung (`../canteen-ratings/spec.md` RATE-F-030/F-080/F-085); Handlungen „Foto hinzufügen" (FOTO-F-050), „Melden" (FOTO-F-110) und beim eigenen Foto „Löschen" (FOTO-F-100) |
| Hochladen ohne Konto | Anmeldeaufforderung wie im Bewertungspfad (RATE-F-090); die Betrachtung bleibt kontofrei |
| Eigenes Foto, Freigabe ausstehend | Für die hochladende Person sichtbar mit Hinweis „wird geprüft" (FOTO-F-070) |
| Eigenes Foto, abgelehnt | Hinweis mit Grund (FOTO-F-090); das Bild wird nicht weiter angezeigt |
| Fehler beim Hochladen | Fehlermeldung mit Wiederholen-Option; das gewählte Bild bleibt erhalten, damit die Auswahl nicht wiederholt werden muss |
| Offline | Bereits geladene Fotos bleiben sichtbar; Hochladen ist nicht möglich und wird als solches benannt, siehe Abschnitt 8 |

## 8. Offline-Verhalten

Betrachten: Bereits geladene Fotos stehen aus dem Bildzwischenspeicher zur Verfügung; nicht geladene fehlen, ohne dass der Gerichtseintrag dadurch unvollständig wirkt (FOTO-F-020 greift als Anzeigeform).

Hochladen: bewusst **nicht** in die Offline-Warteschlange aufgenommen (`../../platform/data-and-storage.md` Abschnitt 5). Ein Bild ist um Größenordnungen größer als die dort geführten Vorgänge, und eine verzögerte Übertragung zu einem Gericht, das die Person längst gegessen hat, bringt keinen Vorteil gegenüber einem erneuten Versuch bei bestehender Verbindung. Ohne Verbindung wird die Handlung als nicht verfügbar dargestellt, statt einen Erfolg vorzutäuschen.

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| Datei ist kein JPEG oder PNG | Ablehnung mit Nennung der zulässigen Formate (FOTO-F-170) |
| Bild überschreitet die Grenzen aus FOTO-N-010 | Vor der Übertragung auf dem Gerät verkleinern; gelingt das nicht, mit Begründung ablehnen |
| Metadaten lassen sich nicht entfernen | Übertragung unterbleiben lassen und den Grund nennen; ein Foto wird nie mit Metadaten übertragen (FOTO-F-140) |
| Übertragung bricht ab | Fehlermeldung mit Wiederholen-Option; kein halb übertragenes Foto in der Freigabeliste |
| Foto zu einem Gericht, das nicht mehr im Speiseplan steht | Zulässig — die Zuordnung ist gerichtsbezogen, nicht tagesbezogen (FOTO-F-130); das Foto erscheint, sobald das Gericht wieder angeboten wird |
| Freigabeliste enthält ein Foto, dessen Konto zwischenzeitlich gelöscht wurde | Foto ist bereits gelöscht (FOTO-F-160); der Eintrag verschwindet aus der Liste ohne Moderationsentscheidung |
| Meldung eines bereits gemeldeten Fotos | Erneute Meldung annehmen, aber keinen zweiten Vorgang erzeugen |

## 10. Nicht-funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| FOTO-N-010 | Das System muss ein Foto vor der Übertragung auf höchstens 2048 Pixel Kantenlänge und 2 MB Dateigröße verkleinern. | NEU |
| FOTO-N-020 | Das System muss Fotos ausschließlich über eine TLS-gesicherte Verbindung übertragen und ausliefern. | NEU |
| FOTO-N-030 | Das System muss die Gerichtsliste unabhängig vom Ladezustand der Fotos vollständig bedienbar halten. | NEU |
| FOTO-N-040 | Das System muss die verkleinerte Listenfassung eines Fotos in höchstens 100 KB ausliefern. | NEU |

### Erläuterungen

**`FOTO-N-010` und `FOTO-N-040`.** Beide Werte zielen auf Mobilfunknutzung in einem Gebäude mit bekannt schwacher Abdeckung. 2048 Pixel genügen für die Vollbildansicht auf den unterstützten Geräten (`../../platform/non-functional.md`); 100 KB je Vorschaubild halten eine Liste mit zwanzig Gerichten unter zwei Megabyte. Die Verkleinerung erfolgt auf dem Gerät, damit die Grenze schon den Upload betrifft, nicht erst die Auslieferung.

## 11. Akzeptanzkriterien

- Ein Gericht ohne freigegebenes Foto wird exakt wie vor Einführung dieser Spec dargestellt (FOTO-F-020).
- Ein hochgeladenes Foto ist für andere Konten unsichtbar, solange es nicht freigegeben ist, und für das eigene Konto mit Hinweis sichtbar (FOTO-F-060/F-070).
- Ein Foto mit GPS-Metadaten verlässt das Gerät ohne diese Metadaten; die serverseitige Prüfung findet keine (FOTO-F-140).
- Nach Löschung eines Kontos ist keines seiner Fotos mehr abrufbar (FOTO-F-160).
- Eine Meldung blendet ein freigegebenes Foto sofort aus, ohne es zu löschen (FOTO-F-120).
- Die Gerichtsliste bleibt bedienbar, während Fotos noch laden, und springt beim Nachladen nicht um (FOTO-N-030).
- Das Antippen eines Gerichts (RATE-F-080) und das Antippen eines seiner Fotos (FOTO-F-030) öffnen dieselbe Detailansicht, nicht zwei verschiedene Bildschirme.

## 12. Bewusst nicht übernommenes Altverhalten

Keines — beide Alt-Apps kennen keine Gerichtsfotos. Diese Spec ist vollständige Neuentwicklung.

## 13. Offene Fragen

- Rechtliche Grundlage der Veröffentlichung: unter welcher Einräumung von Nutzungsrechten eine hochladende Person ihr Foto beisteuert und wie das beim Hochladen (FOTO-F-150) formuliert wird — zu klären mit dem FSR FB4 vor der Umsetzung, gemeinsam mit der Datenschutzerklärung (`../../platform/security-and-privacy.md` Abschnitt 4).
- Ablagebedarf und Kosten: Wie viele Fotos je Semester zu erwarten sind und ob der VPS-Speicher dafür ausreicht (`../../decisions/0017-zugriff-und-datensicherung-vps.md`) — vor der Umsetzung abzuschätzen, weil davon die Aufbewahrungsdauer abhängt.
- Aufbewahrung: ob Fotos dauerhaft bleiben oder nach einer Frist entfallen. Für Gerichte, die es weiterhin gibt, spricht nichts gegen Dauer; für einmalig angebotene Gerichte wäre eine Frist sinnvoll — offen, FSR FB4.
- Moderationsaufwand: ob die Vorabfreigabe (FOTO-F-060) bei der zu erwartenden Menge tragbar bleibt oder ab einer Schwelle auf nachgelagerte Prüfung umgestellt werden muss. Erst nach Betriebserfahrung entscheidbar.
- Standortbezug: ob ein Foto der Mensa zugeordnet werden soll, in der es aufgenommen wurde — dieselbe Frage, die bei Bewertungen bewusst zurückgestellt wurde (`../canteen-ratings/spec.md` Abschnitt 13).
- Ob abgelehnte Fotos zur Nachvollziehbarkeit der Moderationsentscheidung aufbewahrt werden oder sofort zu löschen sind — berührt IDENT-F-110 (Widerspruch) und ist mit der Moderationsoberfläche zu entscheiden.
