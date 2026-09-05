## Purpose

Ermöglicht Studierenden, Fotos von Mensagerichten selbst beizusteuern und einzusehen, weil die Bezeichnung eines Gerichts wenig darüber sagt, was auf dem Teller landet — mit Freigabe vor Veröffentlichung wegen des höheren Risikos je Beitrag gegenüber Textkommentaren. Vormals `specs/features/canteen-photos/spec.md` (Präfix `FOTO`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Anzeige eines freigegebenen Fotos in der Gerichtsliste

Sofern zu einem Gericht mindestens ein freigegebenes Foto vorliegt, muss das System es in der Gerichtsliste des Mensaplans neben den Kennzeichnungen des Gerichts anzeigen. Herkunft: NEU (vormals FOTO-F-010).

#### Scenario: Gericht mit freigegebenem Foto
- **WHEN** zu einem Gericht mindestens ein freigegebenes Foto vorliegt
- **THEN** zeigt die Gerichtsliste eine verkleinerte Fassung neben den Kennzeichnungen des Gerichts

### Requirement: Gerichtseintrag ohne Bildfläche bei fehlendem Foto

Falls zu einem Gericht kein freigegebenes Foto vorliegt, muss das System den Gerichtseintrag ohne Bildfläche darstellen. Herkunft: NEU (vormals FOTO-F-020). Ohne freigegebenes Foto verhält sich die Gerichtsliste unverändert zur heutigen Fassung — die Fotofunktion ist damit vollständig additiv und blockiert keinen Schnitt der Capability `canteen`.

#### Scenario: Gericht ohne Foto
- **WHEN** zu einem Gericht kein freigegebenes Foto vorliegt
- **THEN** zeigt der Gerichtseintrag keine Bildfläche und keine Platzhaltergrafik

### Requirement: Öffnen der Detailansicht beim Antippen eines Fotos

Wenn die Nutzerin ein Foto antippt, muss das System die Detailansicht des Gerichts (Capability `canteen-ratings`, RATE-F-080) mit diesem Foto im Vordergrund öffnen. Herkunft: NEU (vormals FOTO-F-030). Entschieden zugunsten einer einzigen Detailansicht je Gericht (geändert am 2026-09-04): Sie zeigt die Fotos im Vollbild mit Blättern, die eigene und die Community-Bewertung (Capability `canteen-ratings`, RATE-F-030/F-080) sowie die Eingabe der eigenen Bewertung (RATE-F-085) — dort und ausschließlich dort, weil drei Antworttasten mehr Fläche brauchen als die knappe Symbolanzeige in der Gerichtsliste verträgt. Ein eigener, von RATE-F-080 unabhängiger Bildschirm würde dieselbe Fläche zweimal beanspruchen und Nutzerinnen zwischen zwei fast identischen Ansichten hin- und herführen. Foto und Bewertung bleiben trotz gemeinsamer Ansicht getrennte Beiträge: Ein Foto lässt sich ohne Bewertung hochladen und eine Bewertung ohne Foto abgeben.

#### Scenario: Foto in der Gerichtsliste antippen
- **WHEN** eine Nutzerin ein Foto in der Gerichtsliste antippt
- **THEN** öffnet das System dieselbe Detailansicht, die auch beim Antippen des Gerichts selbst öffnet, mit dem angetippten Foto im Vordergrund

### Requirement: Blättern durch alle Fotos eines Gerichts

Das System muss in der Detailansicht das Blättern durch alle freigegebenen Fotos desselben Gerichts ermöglichen. Herkunft: NEU (vormals FOTO-F-040).

#### Scenario: Mehrere freigegebene Fotos
- **WHEN** zu einem Gericht mehrere freigegebene Fotos vorliegen und die Detailansicht geöffnet ist
- **THEN** kann die Nutzerin zwischen allen freigegebenen Fotos blättern

### Requirement: Hochladen eines eigenen Fotos aus der Detailansicht

Das System muss einer angemeldeten Nutzerin aus der Detailansicht heraus das Hochladen eines eigenen Fotos zum betrachteten Gericht ermöglichen. Herkunft: NEU (vormals FOTO-F-050).

#### Scenario: Foto zu einem Gericht hochladen
- **WHEN** eine angemeldete Nutzerin in der Detailansicht eines Gerichts „Foto hinzufügen" wählt
- **THEN** startet das System den Upload-Vorgang für dieses Gericht

### Requirement: Freigabe durch Moderation vor Sichtbarkeit

Das System muss ein hochgeladenes Foto erst nach ausdrücklicher Freigabe durch die Rolle Moderation für andere Nutzerinnen sichtbar machen. Herkunft: NEU (vormals FOTO-F-060). Abweichend von der Capability `identity-and-moderation` (IDENT-F-080), wonach Bewertungskommentare ohne Vorprüfung erscheinen und erst auf Meldung hin geprüft werden: Für Fotos gilt das Gegenteil, aus drei Gründen — ein Bild wirkt ohne Lesen und damit sofort; ein unangemessenes Bild ist als Rechtsverstoß schwerer zu heilen als ein Satz Text; und die zu erwartende Menge ist klein genug, dass eine Vorabprüfung die Moderation nicht überlastet. Die Prüffrist aus IDENT-N-010 (fünf Werktage) gilt sinngemäß auch hier, wirkt aber vor der Veröffentlichung: Ein Foto kann bis zu fünf Werktage unsichtbar bleiben.

#### Scenario: Hochgeladenes Foto vor Freigabe
- **WHEN** ein Foto hochgeladen, aber noch nicht von der Moderation freigegeben wurde
- **THEN** ist es für andere Nutzerinnen nicht sichtbar

### Requirement: Sichtbarkeit ausstehender Fotos nur für Urheberin und Moderation

Solange ein eigenes Foto nicht freigegeben ist, muss das System es ausschließlich der hochladenden Person und der Moderation anzeigen, versehen mit dem Hinweis auf die ausstehende Freigabe. Herkunft: NEU (vormals FOTO-F-070). Die hochladende Person sieht ihr eigenes Bild während der Prüfung, damit der Vorgang nicht als Fehler wirkt.

#### Scenario: Eigenes Foto während der Prüfung
- **WHEN** eine hochladende Person ihr eigenes, noch nicht freigegebenes Foto ansieht
- **THEN** zeigt das System es ihr mit dem Hinweis „wird geprüft"

### Requirement: Liste zur Freigabe anstehender Fotos für die Moderation

Das System muss der Rolle Moderation eine Liste der zur Freigabe anstehenden Fotos mit den Handlungsmöglichkeiten Freigeben und Ablehnen bereitstellen. Herkunft: NEU (vormals FOTO-F-080).

#### Scenario: Foto freigeben
- **WHEN** die Moderation ein ausstehendes Foto als angemessen einstuft
- **THEN** kann sie es aus der Liste heraus freigeben

### Requirement: Benachrichtigung bei Ablehnung eines Fotos

Wenn die Moderation ein Foto ablehnt, muss das System die hochladende Person über die Ablehnung und deren Grund benachrichtigen. Herkunft: NEU (vormals FOTO-F-090).

#### Scenario: Foto abgelehnt
- **WHEN** die Moderation ein Foto mit Begründung ablehnt
- **THEN** benachrichtigt das System die hochladende Person über die Ablehnung samt Grund

### Requirement: Löschen des eigenen Fotos unabhängig vom Freigabestand

Das System muss der hochladenden Person das Löschen ihres eigenen Fotos ermöglichen, unabhängig vom Freigabestand. Herkunft: NEU (vormals FOTO-F-100).

#### Scenario: Freigegebenes eigenes Foto löschen
- **WHEN** die hochladende Person ihr bereits freigegebenes Foto löschen will
- **THEN** entfernt das System es unabhängig vom Freigabestand

### Requirement: Melden eines freigegebenen Fotos

Das System muss der Nutzerin das Melden eines freigegebenen Fotos ermöglichen. Herkunft: NEU (vormals FOTO-F-110).

#### Scenario: Unangemessenes freigegebenes Foto melden
- **WHEN** eine Nutzerin ein bereits freigegebenes Foto als unangemessen meldet
- **THEN** nimmt das System die Meldung entgegen

### Requirement: Ausblenden eines gemeldeten Fotos bis zur Entscheidung

Wenn ein freigegebenes Foto gemeldet wird, muss das System es bis zur Entscheidung der Moderation ausblenden. Herkunft: NEU (vormals FOTO-F-120). Anders als bei Kommentaren (Capability `identity-and-moderation`, IDENT-F-090, wo automatisches Ausblenden ausdrücklich vermieden wird, um Missbrauch der Meldefunktion als Zensurwerkzeug zu verhindern) überwiegt bei Fotos die Gegenrichtung: Ein bereits freigegebenes Bild, das sich als Verstoß herausstellt, richtet in der Zeit bis zur Prüfung mehr Schaden an als ein zu Unrecht kurzzeitig verborgenes Bild — zumal das Gericht ohne Foto weiterhin vollständig nutzbar bleibt.

#### Scenario: Gemeldetes Foto während der Prüfung
- **WHEN** ein freigegebenes Foto gemeldet wird
- **THEN** blendet das System es aus, bis die Moderation entschieden hat

### Requirement: Zuordnung eines Fotos über den normalisierten Gerichtsschlüssel

Das System muss ein Foto anhand der normalisierten Gerichtsbezeichnung (Capability `canteen-ratings`, RATE-F-050) einem Gericht zuordnen. Herkunft: NEU (vormals FOTO-F-130). Dieselbe Grundlage wie bei Bewertungen und Lieblingsgerichten: Ein Foto gehört zum Gericht, nicht zum Zubereitungstag und nicht zur Mensa. Damit erscheint dasselbe Foto an jedem Tag, an dem das Gericht angeboten wird, und in jeder Mensa, die es führt.

#### Scenario: Gericht an mehreren Tagen
- **WHEN** ein Gericht mit demselben normalisierten Titel an zwei verschiedenen Tagen angeboten wird
- **THEN** zeigt das System an beiden Tagen dasselbe zugeordnete Foto

### Requirement: Entfernen der Bildmetadaten vor der Übertragung

Das System muss vor der Übertragung eines Fotos dessen eingebettete Metadaten entfernen, insbesondere Aufnahmeort und Aufnahmezeitpunkt. Herkunft: NEU (vormals FOTO-F-140). Die Entfernung erfolgt auf dem Gerät vor der Übertragung, nicht erst serverseitig, damit die Daten das Gerät gar nicht erst verlassen (Grundsatz der Datenminimierung, Capability `security-and-privacy`). Serverseitig wird die Entfernung zusätzlich geprüft, weil ein manipulierter Client sie umgehen könnte.

#### Scenario: Foto mit GPS-Koordinaten
- **WHEN** ein Kamerabild mit GPS-Koordinaten und Aufnahmezeit hochgeladen wird
- **THEN** entfernt das System diese Metadaten auf dem Gerät vor der Übertragung, und die serverseitige Prüfung findet keine mehr

### Requirement: Hinweis auf Öffentlichkeit und Freigabepflicht vor Übertragung

Das System muss der hochladenden Person vor der Übertragung anzeigen, dass ihr Foto öffentlich sichtbar wird und der Freigabe unterliegt. Herkunft: NEU (vormals FOTO-F-150).

#### Scenario: Hinweis vor dem Hochladen
- **WHEN** eine Nutzerin den Upload-Vorgang startet
- **THEN** zeigt das System vor der Übertragung den Hinweis auf Öffentlichkeit und Freigabepflicht

### Requirement: Löschen der Fotos bei Kontolöschung

Wenn ein Konto gelöscht wird, muss das System die von ihm hochgeladenen Fotos ebenfalls löschen. Herkunft: NEU (vormals FOTO-F-160).

#### Scenario: Konto mit hochgeladenen Fotos gelöscht
- **WHEN** ein Konto mit mehreren hochgeladenen Fotos gelöscht wird
- **THEN** löscht das System auch alle Fotos dieses Kontos

### Requirement: Zulässige Bildformate beim Hochladen

Das System muss beim Hochladen ausschließlich die Bildformate JPEG und PNG annehmen und andere Dateien mit begründeter Meldung ablehnen. Herkunft: NEU (vormals FOTO-F-170).

#### Scenario: Nicht unterstütztes Dateiformat
- **WHEN** eine Datei hochgeladen wird, die weder JPEG noch PNG ist
- **THEN** lehnt das System sie ab und nennt die zulässigen Formate

### Requirement: Verkleinerung eines Fotos vor der Übertragung

Das System muss ein Foto vor der Übertragung auf höchstens 2048 Pixel Kantenlänge und 2 MB Dateigröße verkleinern. Herkunft: NEU (vormals FOTO-N-010). Zielt auf Mobilfunknutzung in einem Gebäude mit bekannt schwacher Abdeckung; 2048 Pixel genügen für die Vollbildansicht auf den unterstützten Geräten (Capability `non-functional`). Die Verkleinerung erfolgt auf dem Gerät, damit die Grenze schon den Upload betrifft, nicht erst die Auslieferung.

#### Scenario: Großes Kamerabild
- **WHEN** ein Kamerabild mit mehr als 2048 Pixel Kantenlänge hochgeladen wird
- **THEN** verkleinert das System es vor der Übertragung auf höchstens 2048 Pixel und 2 MB

### Requirement: TLS-gesicherte Übertragung und Auslieferung

Das System muss Fotos ausschließlich über eine TLS-gesicherte Verbindung übertragen und ausliefern. Herkunft: NEU (vormals FOTO-N-020).

#### Scenario: Abruf eines Fotos
- **WHEN** die App ein Foto abruft
- **THEN** erfolgt die Übertragung ausschließlich über TLS

### Requirement: Bedienbarkeit der Gerichtsliste unabhängig vom Fotoladezustand

Das System muss die Gerichtsliste unabhängig vom Ladezustand der Fotos vollständig bedienbar halten. Herkunft: NEU (vormals FOTO-N-030).

#### Scenario: Fotos laden noch
- **WHEN** die Fotos einer Gerichtsliste noch laden
- **THEN** bleibt die Liste vollständig bedienbar und springt beim Nachladen der Fotos nicht um

### Requirement: Höchstgröße der verkleinerten Listenfassung

Das System muss die verkleinerte Listenfassung eines Fotos in höchstens 100 KB ausliefern. Herkunft: NEU (vormals FOTO-N-040). 100 KB je Vorschaubild halten eine Liste mit zwanzig Gerichten unter zwei Megabyte.

#### Scenario: Vorschaubild in der Gerichtsliste
- **WHEN** die Gerichtsliste die Vorschaufassung eines Fotos lädt
- **THEN** ist diese Fassung höchstens 100 KB groß

## Scope / Nicht-Scope

### Scope

- Anzeige eines freigegebenen Fotos je Gericht in der Gerichtsliste des Mensaplans.
- Anzeige der Fotos in der Detailansicht des Gerichts (Capability `canteen-ratings`, RATE-F-080), mit Blättern durch alle freigegebenen Fotos desselben Gerichts.
- Hochladen eigener Fotos durch angemeldete Nutzerinnen, einschließlich Entfernen der Bildmetadaten vor der Übertragung.
- Freigabe, Ablehnung und Meldung von Fotos, einschließlich der zugehörigen Moderationsansicht.
- Zuordnung eines Fotos zu einem Gericht über den normalisierten Gerichtsschlüssel.

### Nicht-Scope

- Die Gerichtsliste selbst, ihre Zusammenfassung über Mensen und ihre Zustände — Capability `canteen`. Diese Capability belegt dort nur eine Bildfläche je Gerichtseintrag.
- Bewertung und Kommentare — Capability `canteen-ratings`. Foto und Bewertung sind getrennte Beiträge; ein Foto ist keine Bewertung, auch wenn beide dieselbe Detailansicht teilen.
- Konto, Rollen und Sperrverfahren — Capability `identity-and-moderation`. Diese Capability nutzt die dort definierte Rolle Moderation, führt aber keine eigene Rollenlogik ein.
- Automatische Bilderkennung oder maschinelle Vorfilterung hochgeladener Fotos — bewusst nicht; die Freigabe erfolgt durch Menschen.
- Fotos zu anderen Inhalten als Mensagerichten (News-Bilder, Event-Bilder) — nicht Gegenstand dieser Capability.

## Nutzergeschichten

- Als Studierende möchte ich sehen, wie ein Gericht aussieht, bevor ich mich in die Schlange stelle.
- Als Studierende möchte ich ein Foto antippen und größer betrachten, weil das Vorschaubild neben der Bezeichnung klein ist.
- Als Studierende möchte ich mehrere Fotos desselben Gerichts durchsehen, weil eine Portion vom Vortag anders aussehen kann als die von heute.
- Als Studierende möchte ich ein eigenes Foto beisteuern, wenn zu einem Gericht noch keines vorliegt.
- Als Mitglied der Moderation möchte ich jedes Foto vor seiner Veröffentlichung sehen, damit unangemessene Bilder gar nicht erst erscheinen.

## Datenmodell

Foto: Kennung, Gericht-Referenz (normalisierter Titel, RATE-F-050), Konto-Referenz der hochladenden Person, Bilddatei, Zeitpunkt des Hochladens, Freigabestand (`ausstehend` | `freigegeben` | `abgelehnt` | `gemeldet` | `entfernt`), Grund bei Ablehnung oder Entfernung, moderierendes Konto und Zeitpunkt der Entscheidung.

Die Bilddateien selbst liegen nicht in der Datenbank, sondern als Dateien im Ablagebereich des Backends (Ablageort und Sicherung: Capability `data-and-storage`, `specs/decisions/0017-zugriff-und-datensicherung-vps.md`). Je Foto wird zusätzlich eine verkleinerte Fassung für die Listendarstellung vorgehalten, damit die Gerichtsliste nicht die Vollbilder lädt.

Geräteseitig wird nichts über die eigenen Fotos hinaus gespeichert; die Anzeige arbeitet auf dem Bildzwischenspeicher der App (Capability `data-and-storage`, Abschnitt 4).

## Externe Schnittstellen

Ausschließlich das eigene Backend (INT-008). Das Hochladen, die Freigabe und der Abruf der Fotos sind neue Endpunkte des eigenen Vertrags und vor der Umsetzung in `openspec/specs/api-contract.yaml` zu beschreiben (Capability `backend-and-api`, API-N-035). Keine Fremdschnittstelle beteiligt; insbesondere wird kein externer Bild- oder CDN-Dienst genutzt, weil damit Nutzungsdaten der Betrachtenden an Dritte abflössen.

## UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Gerichtsliste, Foto vorhanden | Verkleinerte Fassung neben den Kennzeichnungen, antippbar |
| Gerichtsliste, kein Foto | Keine Bildfläche, keine Platzhaltergrafik |
| Gerichtsliste, Foto lädt | Fläche in Endgröße reserviert, damit kein Layoutsprung entsteht; Bild erscheint nach dem Laden |
| Detailansicht geöffnet | Angetipptes Foto im Vollbild mit Blättern durch die übrigen Fotos des Gerichts, zusätzlich Gesamt- und Tagesbewertung sowie die Eingabe der eigenen Bewertung (Capability `canteen-ratings`, RATE-F-030/F-080/F-085); Handlungen „Foto hinzufügen", „Melden" und beim eigenen Foto „Löschen" |
| Hochladen ohne Konto | Anmeldeaufforderung wie im Bewertungspfad (RATE-F-090); die Betrachtung bleibt kontofrei |
| Eigenes Foto, Freigabe ausstehend | Für die hochladende Person sichtbar mit Hinweis „wird geprüft" |
| Eigenes Foto, abgelehnt | Hinweis mit Grund; das Bild wird nicht weiter angezeigt |
| Fehler beim Hochladen | Fehlermeldung mit Wiederholen-Option; das gewählte Bild bleibt erhalten, damit die Auswahl nicht wiederholt werden muss |
| Offline | Bereits geladene Fotos bleiben sichtbar; Hochladen ist nicht möglich und wird als solches benannt, siehe Abschnitt „Offline-Verhalten" |

## Offline-Verhalten

Betrachten: Bereits geladene Fotos stehen aus dem Bildzwischenspeicher zur Verfügung; nicht geladene fehlen, ohne dass der Gerichtseintrag dadurch unvollständig wirkt.

Hochladen: bewusst **nicht** in die Offline-Warteschlange aufgenommen (Capability `data-and-storage`, Abschnitt 5). Ein Bild ist um Größenordnungen größer als die dort geführten Vorgänge, und eine verzögerte Übertragung zu einem Gericht, das die Person längst gegessen hat, bringt keinen Vorteil gegenüber einem erneuten Versuch bei bestehender Verbindung. Ohne Verbindung wird die Handlung als nicht verfügbar dargestellt, statt einen Erfolg vorzutäuschen.

## Fehlerfälle

| Fall | Reaktion |
|---|---|
| Datei ist kein JPEG oder PNG | Ablehnung mit Nennung der zulässigen Formate |
| Bild überschreitet die Grenzen der Verkleinerungs-Anforderung | Vor der Übertragung auf dem Gerät verkleinern; gelingt das nicht, mit Begründung ablehnen |
| Metadaten lassen sich nicht entfernen | Übertragung unterbleiben lassen und den Grund nennen; ein Foto wird nie mit Metadaten übertragen |
| Übertragung bricht ab | Fehlermeldung mit Wiederholen-Option; kein halb übertragenes Foto in der Freigabeliste |
| Foto zu einem Gericht, das nicht mehr im Speiseplan steht | Zulässig — die Zuordnung ist gerichtsbezogen, nicht tagesbezogen; das Foto erscheint, sobald das Gericht wieder angeboten wird |
| Freigabeliste enthält ein Foto, dessen Konto zwischenzeitlich gelöscht wurde | Foto ist bereits gelöscht; der Eintrag verschwindet aus der Liste ohne Moderationsentscheidung |
| Meldung eines bereits gemeldeten Fotos | Erneute Meldung annehmen, aber keinen zweiten Vorgang erzeugen |

## Akzeptanzkriterien

- Ein Gericht ohne freigegebenes Foto wird exakt wie vor Einführung dieser Capability dargestellt.
- Ein hochgeladenes Foto ist für andere Konten unsichtbar, solange es nicht freigegeben ist, und für das eigene Konto mit Hinweis sichtbar.
- Ein Foto mit GPS-Metadaten verlässt das Gerät ohne diese Metadaten; die serverseitige Prüfung findet keine.
- Nach Löschung eines Kontos ist keines seiner Fotos mehr abrufbar.
- Eine Meldung blendet ein freigegebenes Foto sofort aus, ohne es zu löschen.
- Die Gerichtsliste bleibt bedienbar, während Fotos noch laden, und springt beim Nachladen nicht um.
- Das Antippen eines Gerichts (RATE-F-080) und das Antippen eines seiner Fotos öffnen dieselbe Detailansicht, nicht zwei verschiedene Bildschirme.

## Bewusst nicht übernommenes Altverhalten

Keines — beide Alt-Apps kennen keine Gerichtsfotos. Diese Capability ist vollständige Neuentwicklung.

## Offene Fragen

- Rechtliche Grundlage der Veröffentlichung: unter welcher Einräumung von Nutzungsrechten eine hochladende Person ihr Foto beisteuert und wie das beim Hochladen formuliert wird — zu klären mit dem FSR FB4 vor der Umsetzung, gemeinsam mit der Datenschutzerklärung (Capability `security-and-privacy`, Abschnitt 4).
- Ablagebedarf und Kosten: Wie viele Fotos je Semester zu erwarten sind und ob der VPS-Speicher dafür ausreicht (`specs/decisions/0017-zugriff-und-datensicherung-vps.md`) — vor der Umsetzung abzuschätzen, weil davon die Aufbewahrungsdauer abhängt.
- Aufbewahrung: ob Fotos dauerhaft bleiben oder nach einer Frist entfallen. Für Gerichte, die es weiterhin gibt, spricht nichts gegen Dauer; für einmalig angebotene Gerichte wäre eine Frist sinnvoll — offen, FSR FB4.
- Moderationsaufwand: ob die Vorabfreigabe bei der zu erwartenden Menge tragbar bleibt oder ab einer Schwelle auf nachgelagerte Prüfung umgestellt werden muss. Erst nach Betriebserfahrung entscheidbar.
- Standortbezug: ob ein Foto der Mensa zugeordnet werden soll, in der es aufgenommen wurde — dieselbe Frage, die bei Bewertungen bewusst zurückgestellt wurde (Capability `canteen-ratings`, Abschnitt „Offene Fragen").
- Ob abgelehnte Fotos zur Nachvollziehbarkeit der Moderationsentscheidung aufbewahrt werden oder sofort zu löschen sind — berührt IDENT-F-110 (Widerspruch) und ist mit der Moderationsoberfläche zu entscheiden.
