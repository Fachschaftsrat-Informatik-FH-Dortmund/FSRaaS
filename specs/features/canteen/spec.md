---
id: canteen
titel: Mensaplan
praefix: MENSA
status: accepted
prioritaet: kern
version: 2.6.0
owner: FSR FB4
last_reviewed: 2026-09-04
derived_from:
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/MenuApi.java
  - alte apps/android-fb4/FB4/fB4/src/main/assets/canteens.json
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/activities/MenuSortActivity.java
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/canteens_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/models/meal.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/viewmodels/canteen_overview_viewmodel.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/select_canteens_page.dart
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/fragments/menu/MenuDayFragment.java
implemented_in:
  - backend/src/Fb4.Backend/Endpoints              # MENSA-F-010/030/035/040/045/047/048/050/060/075, API-F-070/F-075
  - backend/src/Fb4.Backend/Infrastructure/Mensa   # INT-015-Zwischenspeicher (MENSA-F-160), Gerichtsnormalisierung (RATE-F-050), Aktualisierungs-Job mit Ortszeit-Zeitplan (MENSA-N-020, API-F-076)
  - app/src/areas/canteen                          # Zusammengefasste Gerichtsliste (MENSA-F-012 bis F-018), Datumsgrenzen/Wischen (F-042/F-044/F-046), Geschlossen-Hinweis (F-049), Alle-Mensen-Ansicht (F-120 bis F-150), Unverträglichkeiten-Filter (F-170 bis F-215), Preisgruppe (F-220/F-230), Herunterziehen (F-240), Mensaauswahl, lokale Benachrichtigung + Stern-Merker (MENSA-F-080 entfallen, bewusst bis Schritt 9 im Code — siehe „Umsetzungsstand")
  - app/src/areas/settings                         # SET-F-180/F-190 (Preisgruppe), wirksam über MENSA-F-220
related:
  - ../../platform/integrations.md
  - ../../platform/backend-and-api.md
  - ../../platform/data-and-storage.md
  - ../../platform/security-and-privacy.md
  - ../../platform/non-functional.md
  - ../canteen-ratings/spec.md
  - ../canteen-photos/spec.md
  - ../settings/spec.md
---

# Mensaplan

## 1. Zweck & Nutzen

Zeigt Studierenden den Speiseplan der von ihnen gewählten Mensen des Studierendenwerks Dortmund. Übernimmt die Kernfunktion beider Alt-Apps, löst dabei aber die unverschlüsselte, an eine private Vermittler-Infrastruktur gebundene Altimplementierung ab.

Die Ansicht ist auf die tatsächliche Frage vor dem Essen zugeschnitten: „Was gibt es heute?“ — nicht „Was gibt es in welcher Mensa?“. Die Gerichte der gewählten Mensen stehen deshalb in **einer** Liste, je Gericht einmal, mit der Angabe, wo es zu haben ist (MENSA-F-012 bis F-018). Wer an einem anderen Campus ist, erreicht über eine Handlung am Seitenende die nach Mensa getrennte Ansicht aller Mensen (MENSA-F-120/F-130), wie sie die Android-Alt-App als Hauptansicht führte.

Ergänzend werden Studierende vormittags benachrichtigt, wenn ein Lieblingsgericht am aktuellen Tag angeboten wird, statt den Speiseplan selbst danach durchsuchen zu müssen. Lieblingsgericht ist seit dem 2026-09-04 kein eigener Merker mehr, sondern die Folge der eigenen Höchstbewertung (MENSA-F-085).

## 2. Scope / Nicht-Scope

### Scope

- Anzeige des Tagesangebots der gewählten Mensen als eine über die Mensen zusammengefasste Gerichtsliste, mit Angabe der anbietenden Mensen je Gericht.
- Blättern über die Datumsauswahl und Wischen zwischen benachbarten Tagen, beschränkt auf den aktuellen und folgende Tage.
- Nach Mensa getrennte Ansicht aller vom Backend gelieferten Mensen für den angezeigten Tag, erreichbar am Ende der Gerichtsliste.
- Auswahl der angezeigten Mensen aus der vom Backend gelieferten Liste, einschließlich eigener Reihenfolge.
- Anzeige der Öffnungszeiten je Mensa und Wochentag sowie Hinweis auf geschlossene Mensen am Seitenende.
- Anzeige von Preisen (Studierende/Mitarbeitende/Gäste) und Zusatzstoff-/Allergenhinweisen.
- Führen von Lieblingsgerichten als Folge der eigenen Höchstbewertung und lokale Benachrichtigung, wenn eines davon am aktuellen Tag im Speiseplan einer gewählten Mensa auftaucht.
- Filterung der Gerichtsliste nach selbst festgelegten Unverträglichkeiten (Zusatzstoff-/Allergenkennzeichnungen).
- Beschränkung der angezeigten Preise in der Hauptansicht auf die in den Einstellungen gewählte Preisgruppe.

### Nicht-Scope

- Bewertung einzelner Gerichte — eigene Spec, aber als Handlung je Gericht innerhalb dieser Ansicht erreichbar, kein eigener Navigationspunkt, siehe `features/canteen-ratings/spec.md`. Die Höchstbewertung wirkt von dort auf MENSA-F-085 zurück.
- Fotos zu Gerichten (Anzeige, Vergrößern, Hochladen, Freigabe) — eigene Spec `features/canteen-photos/spec.md`, zweite Ausbaustufe; die Anzeigefläche liegt in dieser Ansicht, die Anforderungen nicht.
- Bestellung, Bezahlung oder Guthabenabfrage — die Schnittstelle ist rein lesend.
- Ein eigener, unabhängig vom Bewertungspfad setzbarer Lieblingsgericht-Merker — entfallen am 2026-09-04, siehe Erläuterung zu MENSA-F-080.
- Versand der Lieblingsgerichte-Benachrichtigung über INT-005 (UnifiedPush/FCM) — die Benachrichtigung entsteht ausschließlich lokal auf dem Gerät, siehe Erläuterung zu MENSA-F-100.

## 3. Nutzergeschichten

- Als Studierende möchte ich sehen, was heute angeboten wird, ohne die Mensa-Website zu besuchen.
- Als Studierende möchte ich jedes Gericht nur einmal in der Liste sehen und daneben ablesen, in welcher Mensa es zu haben ist, statt dieselbe Liste je Mensa erneut zu durchsuchen.
- Als Studierende möchte ich mit einer Wischgeste durch die kommenden Tage blättern, ohne die Datumsauswahl zu treffen.
- Als Studierende möchte ich vergangene Tage gar nicht erst angeboten bekommen, weil ich sie nie brauche.
- Als Studierende, die heute spontan an einem anderen Campus ist, möchte ich mit einer Handlung das Angebot aller Mensen sehen, ohne meine dauerhafte Mensaauswahl zu ändern.
- Als Studierende mit Unverträglichkeit möchte ich Zusatzstoff-/Allergenhinweise je Gericht sehen.
- Als Studierende mit einer Unverträglichkeit möchte ich Gerichte, die den betreffenden Zusatzstoff enthalten, gar nicht erst in meiner Liste sehen, statt sie bei jedem Gericht einzeln prüfen zu müssen.
- Als Mitarbeitende möchte ich bei jedem Gericht sofort meinen Preis sehen, statt ihn zwischen drei angezeigten Werten herauszusuchen.
- Als Studierende möchte ich morgens benachrichtigt werden, wenn ein von mir mit der besten Bewertungsstufe bewertetes Gericht heute angeboten wird, damit ich es nicht verpasse, ohne täglich selbst nachzusehen.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| MENSA-F-010 | Das System muss den Speiseplan des aktuellen Tages für die gewählten Mensen anzeigen. | Alt: lib/areas/canteen/repositories/meals_repository.dart |
| MENSA-F-012 | Das System muss die Gerichte aller gewählten Mensen eines Tages zu genau einem Eintrag je Gericht zusammenfassen. | NEU |
| MENSA-F-014 | Das System muss zu jedem zusammengefassten Gericht ausweisen, an welchen der gewählten Mensen es am angezeigten Tag angeboten wird. | NEU |
| MENSA-F-016 | Das System muss ein Gericht, das an der aktiven Mensa angeboten wird, von den übrigen Gerichten unterscheidbar darstellen. | NEU |
| MENSA-F-018 | Das System muss zu einem zusammengefassten Gericht die Preis-, Kennzeichnungs- und Zusatzstoffangaben der maßgeblichen Mensa anzeigen. | NEU |
| MENSA-F-020 | Das System muss der Nutzerin die Auswahl einer oder mehrerer Mensen aus der vom Backend gelieferten Mensa-Liste ermöglichen. | Alt: lib/areas/more/screens/select_canteens_page.dart |
| MENSA-F-025 | Das System muss der Nutzerin das Festlegen der Reihenfolge ermöglichen, in der die gewählten Mensen angezeigt werden. | Recherche: alte apps/android-fb4, activities/MenuSortActivity.java, 2026-08-25 |
| MENSA-F-030 | Das System muss zu jedem Gericht Kategorie, Bezeichnung, Preis für Studierende, Mitarbeitende und Gäste sowie Zusatzstoff-/Allergenhinweise anzeigen. | Alt: lib/areas/canteen/models/meal.dart |
| MENSA-F-035 | Sofern die Quelle (INT-015) zu einem Gericht Kennzeichnungen liefert (z. B. vegan, vegetarisch, Klimateller), muss das System sie am Gericht anzeigen. | Recherche: INT-015, 2026-09-03 |
| MENSA-F-040 | Das System muss `Beilagen` als eigene Kategorie von den Hauptspeisen getrennt darstellen. | Alt: lib/areas/canteen/models/meal.dart |
| MENSA-F-042 | Das System muss die Tagesauswahl auf den aktuellen Tag und darauf folgende Tage begrenzen. | NEU |
| MENSA-F-044 | Falls an einem Samstag oder Sonntag keine der gewählten Mensen ein Angebot führt, muss das System diesen Tag beim Blättern und Wischen überspringen. | NEU |
| MENSA-F-045 | Das System muss der Nutzerin das Blättern zu benachbarten Tagen des Speiseplans ermöglichen. | Alt: lib/areas/canteen/screens/canteen_overview_page.dart:39 |
| MENSA-F-046 | Wenn die Nutzerin waagerecht über die Gerichtsliste wischt, muss das System zum benachbarten Tag wechseln. | NEU |
| MENSA-F-047 | Das System muss zu jeder gewählten Mensa deren Öffnungszeiten für den angezeigten Wochentag ausweisen. | Recherche: alte apps/android-fb4, model/OpeningsDto.java, 2026-08-25 |
| MENSA-F-048 | Das System muss Gerichtskategorien und Zusatzstoffhinweise in der gewählten Oberflächensprache anzeigen, sofern die Quelle sie in dieser Sprache liefert. | Recherche: alte apps/android-fb4, model/MenuInformationDto.java, 2026-08-25 |
| MENSA-F-049 | Falls eine gewählte Mensa am angezeigten Tag kein Angebot führt, muss das System sie am Ende der Gerichtsliste mit dem Hinweis ausweisen, dass sie an diesem Tag geschlossen ist. | NEU |
| MENSA-F-050 | Solange keine Netzwerkverbindung besteht, muss das System den zuletzt geladenen Speiseplan anzeigen. | Alt: lib/areas/canteen/repositories/meals_repository.dart |
| MENSA-F-060 | Falls beim Laden des Speiseplans ein Fehler auftritt, muss das System ihn der Nutzerin sichtbar machen, statt ihn stillschweigend zu verwerfen. | Alt: bewusst verworfen |
| MENSA-F-070 | Das System muss den Speiseplan ausschließlich über eine TLS-gesicherte Verbindung abrufen. | Alt: bewusst verworfen |
| MENSA-F-075 | Falls die Mensa-Liste nicht vom Backend geladen werden kann, muss das System mit dem im Anwendungspaket mitgelieferten Ausgangsbestand arbeiten. | Recherche: alte apps/android-fb4, assets/canteens.json, 2026-08-25 |
| ~~MENSA-F-080~~ | ~~Das System muss der Nutzerin ermöglichen, ein Gericht im Speiseplan als Lieblingsgericht zu markieren und die Markierung wieder aufzuheben.~~ — entfallen | NEU |
| MENSA-F-085 | Wenn die Nutzerin ein Gericht mit der besten Bewertungsstufe nach RATE-F-010 bewertet, muss das System dieses Gericht als Lieblingsgericht führen. | NEU |
| MENSA-F-087 | Wenn die Nutzerin ihre beste Bewertungsstufe für ein Gericht zurücknimmt oder herabsetzt, muss das System dieses Gericht nicht mehr als Lieblingsgericht führen. | NEU |
| MENSA-F-090 | Das System muss die Zuordnung eines Lieblingsgerichts anhand der normalisierten Gerichtsbezeichnung (RATE-F-050, `features/canteen-ratings/spec.md`) vornehmen, damit dasselbe Gericht unabhängig vom Zubereitungstag wiedererkannt wird. | NEU |
| MENSA-F-100 | Wenn der Tages-Speiseplan einer gewählten Mensa (MENSA-F-020) ein als Lieblingsgericht geführtes Gericht enthält, muss das System die Nutzerin per lokaler Gerätebenachrichtigung darüber informieren. | NEU |
| MENSA-F-105 | Solange die Lieblingsgericht-Benachrichtigung in den Einstellungen (SET-F-170) abgeschaltet ist, darf das System keine Benachrichtigung nach MENSA-F-100 auslösen. | NEU |
| MENSA-F-110 | Das System darf für dasselbe Gericht an derselben Mensa am selben Tag höchstens eine Benachrichtigung auslösen. | NEU |
| MENSA-F-120 | Das System muss am Ende der Gerichtsliste eine Handlung „Alle Mensen anzeigen" bereitstellen. | NEU |
| MENSA-F-130 | Wenn die Nutzerin die Handlung „Alle Mensen anzeigen" auswählt, muss das System die Speisepläne aller vom Backend gelieferten Mensen für den angezeigten Tag nach Mensa getrennt untereinander anzeigen. | Alt: alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/fragments/menu/MenuDayFragment.java:105 |
| MENSA-F-140 | Das System muss in der Ansicht aller Mensen (MENSA-F-130) Mensen ohne Angebot am angezeigten Tag auslassen. | Alt: alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/fragments/menu/MenuDayFragment.java:109 |
| MENSA-F-150 | Das System darf die in MENSA-F-130 gezeigte Ansicht nicht als Änderung der Mensaauswahl nach MENSA-F-020 werten. | NEU |
| MENSA-F-160 | Falls die Quelle (INT-015) zu einem Gericht keine Ausgabestellen-Kategorie liefert (weder `counterNames` noch `counter`), muss das System das Gericht ohne Kategorieüberschrift in einer Sammelgruppe am Ende der Gerichtsliste führen, statt einen Platzhalter oder einen quellinternen Zahlencode als Kategorie anzuzeigen. | Recherche: INT-015 Food Fakultät (Kennung 474), 2026-09-04 |
| MENSA-F-170 | Das System muss der Nutzerin oben rechts in der Hauptansicht einen Zugang zur Festlegung eigener Unverträglichkeiten bereitstellen. | NEU |
| MENSA-F-175 | Das System muss am Zugang zu den Unverträglichkeiten (MENSA-F-170) einen Hinweis anzeigen, dass die festgelegten Unverträglichkeiten ausschließlich auf dem Gerät verarbeitet werden. | NEU |
| MENSA-F-180 | Das System muss der Nutzerin ermöglichen, eine oder mehrere der zu einem Gericht möglichen Zusatzstoff-/Allergenkennzeichnungen (MENSA-F-030) als eigene Unverträglichkeit festzulegen. | NEU |
| MENSA-F-190 | Wenn mindestens eine Unverträglichkeit festgelegt ist, muss das System ein Gericht, das eine dieser Kennzeichnungen trägt, aus der Gerichtsliste der Hauptansicht ausblenden. | NEU |
| MENSA-F-200 | Das System muss am Ende der Gerichtsliste die Anzahl der wegen festgelegter Unverträglichkeiten ausgeblendeten Gerichte anzeigen. | NEU |
| MENSA-F-210 | Das System muss in der Ansicht aller Mensen (MENSA-F-130) ein Gericht, das eine festgelegte Unverträglichkeit-Kennzeichnung trägt, ausgegraut und ohne Interaktionsmöglichkeit darstellen, statt es wie in der Hauptansicht auszublenden. | NEU |
| MENSA-F-215 | Das System darf die festgelegten Unverträglichkeiten unter keinen Umständen an das Backend oder eine andere externe Schnittstelle übertragen. | NEU |
| MENSA-F-220 | Das System muss in der Hauptansicht ausschließlich den Preis der in den Einstellungen gewählten Preisgruppe (`features/settings/spec.md` SET-F-180) je Gericht anzeigen, statt aller drei Preise. | NEU |
| MENSA-F-230 | Das System muss in der Ansicht aller Mensen (MENSA-F-130) unabhängig von der gewählten Preisgruppe alle drei Preise je Gericht anzeigen. | NEU |
| MENSA-F-240 | Wenn die Nutzerin die Gerichtsliste der Hauptansicht nach unten zieht, muss das System die Tagespläne aller gewählten Mensen für den angezeigten Tag neu vom Backend laden und den Altershinweis (Abschnitt 8) entsprechend aktualisieren. | NEU |

### Erläuterungen

**`MENSA-F-010` (geändert) und `MENSA-F-012` bis `MENSA-F-018` — eine Liste statt einer Liste je Mensa.** Entscheidung FSR FB4, 2026-09-04. Die bisherige Ansicht zeigte je Bildschirm den Plan einer Mensa; wer zwei Mensen gewählt hatte, las dieselben Gerichte zweimal und musste selbst vergleichen. Fachlich interessiert zuerst das Gericht, erst danach der Ort. Die Ansicht fasst deshalb über die gewählten Mensen zusammen (MENSA-F-012) und trägt den Ort als Angabe am Gericht nach (MENSA-F-014). Zwei Begriffe, die die Anforderungen voraussetzen:

| Begriff | Bedeutung |
|---|---|
| Aktive Mensa | Die im Mensa-Wechsler der Ansicht gerade gewählte Mensa. Sie bestimmt die Hervorhebung nach MENSA-F-016 und die maßgebliche Mensa nach MENSA-F-018. Sie ersetzt die frühere „zuletzt gewählte Mensa" aus MENSA-F-010 und wird wie bisher gerätelokal gemerkt. |
| Maßgebliche Mensa | Diejenige das Gericht anbietende Mensa, deren Preis- und Zusatzstoffangaben angezeigt werden: die aktive Mensa, sofern sie das Gericht an diesem Tag führt, sonst die in der Reihenfolge nach MENSA-F-025 erste anbietende Mensa. |

Die Zusammenfassung nach MENSA-F-012 erfolgt über den normalisierten Gerichtsschlüssel (RATE-F-050) — denselben Schlüssel, der bereits Bewertungen und Lieblingsgerichte trägt. Gerichte mit gleichem Schlüssel, aber abweichenden Preisen an verschiedenen Mensen bleiben ein Eintrag; die Abweichung wird über die maßgebliche Mensa aufgelöst (MENSA-F-018), nicht durch Aufspalten des Eintrags — sonst wäre die Zusammenfassung wirkungslos. Der Mensa-Wechsler bleibt erhalten, wechselt aber nicht mehr den Inhalt der Liste, sondern nur den Bezugspunkt für MENSA-F-016 und MENSA-F-018.

**`MENSA-F-042` — keine Vergangenheit.** Ein vergangener Speiseplan hat keinen Nutzen: Das Essen ist weg, und die Mensa-Quelle (INT-015) hält Vergangenes ohnehin nicht zuverlässig vor. Der aktuelle Tag ist damit die untere Grenze der Datumsauswahl; „Tag zurück" ist am heutigen Tag nicht auslösbar, statt zu einem leeren Tag zu führen. Die obere Grenze ergibt sich aus dem Datenbestand von INT-015 und wird nicht zusätzlich festgelegt.

**`MENSA-F-044` — Wochenenden nur mit Angebot.** Die Mensen des Studierendenwerks sind an Wochenenden in der Regel geschlossen; ein leerer Samstag zwischen Freitag und Montag ist beim Blättern reine Reibung. Ausnahmen (Sonderöffnungen, Veranstaltungswochenenden) sollen aber nicht verschwinden — deshalb ist die Bedingung das tatsächliche Angebot, nicht der Wochentag. Grundlage der Entscheidung ist der geladene Bestand aus dem Backend-Zwischenspeicher; liegt zu einem Wochenendtag kein Bestand vor (offline, Ladefehler), gilt er als ohne Angebot und wird übersprungen, siehe Abschnitt 9. Werktage werden nie übersprungen, auch wenn sie leer sind — dort greift der Leerzustand mit dem Hinweis nach MENSA-F-049.

**`MENSA-F-046` — Wischen zusätzlich zur Datumsauswahl.** Die Pfeile der Datumsauswahl bleiben unverändert (MENSA-F-045); das Wischen tritt daneben, es ersetzt sie nicht. Beide Wege unterliegen denselben Grenzen aus MENSA-F-042 und MENSA-F-044. Barrierefreiheit: Die Wischgeste ist damit nicht der einzige Weg zum Tageswechsel und bleibt für Bedienung per Schalter oder Screenreader entbehrlich (`platform/ux-and-theming.md`).

**`MENSA-F-049` — geschlossene Mensa am Seitenende.** Die Information „Mensa X hat heute zu" gehört zur Vollständigkeit des Bildes, verdrängt aber nichts vom tatsächlichen Angebot; sie steht deshalb unter der Gerichtsliste, gemeinsam mit den Öffnungszeiten (MENSA-F-047), nicht als Fehlermeldung und nicht als Karte in der Liste. Die Quelle unterscheidet nicht zwischen „geschlossen" und „keine Daten geliefert"; beides führt zum selben Hinweis, dessen Formulierung das offenlässt.

**`MENSA-F-080` (entfallen) / `MENSA-F-085` / `MENSA-F-087` — Höchstbewertung statt eigener Markierung.** Entscheidung FSR FB4, 2026-09-04. Der Stern zum Markieren und die Bewertung (RATE-F-010) standen nebeneinander und fragten dasselbe zweimal: „Magst du das?". Ein Gericht, das jemand mit der besten Stufe bewertet, **ist** das Lieblingsgericht; ein zweiter Merker trägt keine zusätzliche Aussage. MENSA-F-080 entfällt deshalb ersatzlos, die Lieblingsliste ergibt sich aus den eigenen Höchstbewertungen. (Die Bewertungsskala selbst wechselte ebenfalls am 2026-09-04 von Sternen auf ein dreistufiges Daumen-System — schlecht/gut/sehr gut, siehe `../canteen-ratings/spec.md` RATE-F-010; das Prinzip „Höchstbewertung = Lieblingsgericht" bleibt davon unberührt, nur die Bezeichnung „Stern" entfällt in den folgenden Anforderungen.) Drei Folgen, die bei der Umsetzung zu tragen sind:

| Folge | Auswirkung |
|---|---|
| Kontopflicht | Bewerten setzt ein Konto voraus (RATE-F-090). Ohne Anmeldung gibt es damit keine Lieblingsgerichte und keine Benachrichtigung mehr — bisher war beides kontofrei möglich. |
| Zeitpunkt | Bewertungen entstehen erst in Roadmap-Schritt 9. Zwischen dieser Spec-Änderung und Schritt 9 gibt es keinen Weg, ein Lieblingsgericht zu setzen; MENSA-F-085/F-087/F-100/F-105/F-110 sind bis dahin nicht erfüllbar. |
| Datenschutz | Die Lieblingseigenschaft ist nicht mehr rein gerätelokal, siehe die geänderte Erläuterung zu MENSA-F-090. |

**`MENSA-F-090` — Zuordnung lokal, Ursprung serverseitig (geändert am 2026-09-04).** Die vorige Fassung hielt fest, die Lieblingsliste bleibe ausschließlich gerätelokal und das Backend erfahre nichts über individuelle Vorlieben. Das gilt mit MENSA-F-085 nicht mehr uneingeschränkt: Die Höchstbewertung, aus der die Lieblingseigenschaft folgt, ist eine kontogebundene, serverseitig gespeicherte Bewertung (`features/canteen-ratings/spec.md` Abschnitt 5). Das Backend kann daraus ableiten, welche Gerichte eine Person besonders mag — eine Aussage über Ernährungsvorlieben, die zuvor bewusst auf dem Gerät blieb. Bewusst in Kauf genommen, weil dieselbe Aussage bereits in der Bewertung selbst steckt und ein zusätzlicher lokaler Merker sie nicht verborgen hätte, sobald beide Wege nebeneinander bestehen. Unverändert gilt: Der Abgleich gegen den Tagesplan (MENSA-F-100) läuft rein auf dem Gerät gegen eine lokale Spiegelung der eigenen Bewertungen (RATE-F-100); es wird keine Lieblingsliste als eigene Ressource an das Backend übertragen und keine von dort abgerufen. Der Eintrag in `platform/data-and-storage.md` Abschnitt 2 ist entsprechend fortgeschrieben.

**`MENSA-F-120` bis `MENSA-F-150` — alle Mensen ohne Auswahländerung.** Wer heute an einem anderen Campus ist, will einmal dorthin sehen, nicht seine dauerhafte Mensaauswahl umstellen und später zurückstellen. Die Handlung am Seitenende führt deshalb in eine reine Leseansicht über alle vom Backend gelieferten Mensen (API-F-230), nach Mensa getrennt untereinander — die Darstellung, die die Android-Alt-App als Hauptansicht führte (`MenuDayFragment.java:105`). Das dortige Verhalten, Mensen ohne Angebot des Tages wegzulassen (`MenuDayFragment.java:109`), wird übernommen (MENSA-F-140); der Hinweis auf geschlossene Mensen nach MENSA-F-049 bleibt auf die **gewählten** Mensen der Hauptansicht beschränkt, sonst bestünde die Ansicht an einem Wochenende fast nur aus Geschlossen-Hinweisen. MENSA-F-150 hält fest, dass diese Ansicht nichts speichert: Sie ändert weder Auswahl (MENSA-F-020) noch Reihenfolge (MENSA-F-025) noch die aktive Mensa. Der angezeigte Tag wird aus der Hauptansicht übernommen, damit der Wechsel den Zusammenhang nicht verliert.

**Umsetzungsstand nach der Überarbeitung vom 2026-09-04, nachgeführt am 2026-09-04.** Die Spec war nach der Überarbeitung von `implemented` auf `accepted` zurückgesetzt. Mit dem Abschluss von Roadmap-Schritt 4 am 2026-09-04 sind umgesetzt und durch ID-tragende Tests belegt: die zusammengefasste Gerichtsliste (MENSA-F-012 bis F-018), die Datumsgrenzen und das Wischen (F-042/F-044/F-046), der Geschlossen-Hinweis (F-049), die Ansicht aller Mensen (F-120 bis F-150), der Unverträglichkeiten-Filter (F-170 bis F-215), die Preisgruppe (F-220/F-230 mit SET-F-180/F-190) und das Herunterziehen zum Aktualisieren (F-240) — alles in der App, ohne Vertragsänderung. Serverseitig ist der Speiseplan-Job auf einen Ortszeit-Zeitplan vor den Nutzungsspitzen und nach Mensaschluss umgestellt (MENSA-N-020 über API-F-076).

Der `status` bleibt **`accepted`**, weil die bewertungsgekoppelten Anforderungen noch offen sind: MENSA-F-085/F-087 (Lieblingsgericht aus der Höchstbewertung), MENSA-F-090 in der Neufassung, MENSA-F-100/F-105/F-110 in der Neufassung und der Abschalter SET-F-170 folgen gemeinsam mit den Bewertungen in Roadmap-Schritt 9 und sind bis dahin nicht erfüllbar (Erläuterung zu MENSA-F-080, Tabellenzeile „Zeitpunkt"). Bis dahin liegt der in Schritt 4 gelieferte Stern-Merker nach dem entfallenen MENSA-F-080 weiter im Code (`app/src/areas/canteen/favorites.ts`, `backgroundCheck.ts`, `notifications.ts`, `registerBackgroundTask.ts`); zwei Tests tragen die entfallene ID MENSA-F-080 im Namen — ein bewusst in Kauf genommener und hier dokumentierter Rückstand, kein unbemerktes Auseinanderlaufen (`platform/quality-and-testing.md` Abschnitt 7). Die Geräte- und Gestaltungsprüfungen der neuen Ansicht sind im Prüfprotokoll `pruefprotokolle/2026-09-04-schritt-4-mensa-teil-a.md` festgehalten (Geräteprüfungen „ausstehend Gerät").

**`MENSA-F-060`** — `canteen_overview_viewmodel.dart:60-66` enthält einen `try`-Block mit leerem `finally` ohne `catch`; ein Fehler beim Laden des Speiseplans verschwindet dadurch kommentarlos (dokumentiert in `platform/security-and-privacy.md` SEC-F-060). Für die Neuentwicklung ist sichtbare Fehlerbehandlung verbindlich.

**`MENSA-F-070`** — Der Altaufruf erfolgt unverschlüsselt über `http://fb4app.hemacode.de/...` (`meals_repository.dart:21`, dokumentiert als INT-004 in `platform/integrations.md`, Risiko „hoch"). Für die Neuentwicklung ist TLS ausnahmslos verbindlich (siehe auch `platform/security-and-privacy.md` SEC-N-030).

**`MENSA-F-090` — lokal statt serverseitig (Architekturentscheidung).** Die Lieblingsgerichte-Liste verrät Ernährungsgewohnheiten und -vorlieben und ist damit sensibler als eine reine Mensaauswahl. Analog zur bereits für SCHED getroffenen Entscheidung (kein serverseitiges Speichern persönlicher Auswahl, siehe `features/schedule/spec.md` Erläuterung zu SCHED-F-220, `platform/backend-and-api.md` API-F-100) bleibt die Liste ausschließlich gerätelokal (`platform/data-and-storage.md` DATA-F-010). Das Backend (INT-008) erfährt nichts über individuelle Vorlieben.

**`MENSA-F-100` — lokale Benachrichtigung statt INT-005 (UnifiedPush/FCM).** INT-005 ist ein Themen-/Endpunkt-Abonnement für alle Nutzerinnen gleichermaßen und für Inhalte gedacht, die der FSR selbst veröffentlicht (News); es eignet sich nicht für eine pro Nutzerin unterschiedliche, personenbezogene Auswahl wie Lieblingsgerichte, ohne diese Auswahl an das Backend zu übertragen — was MENSA-F-090 gerade ausschließt. Der Abgleich (MENSA-F-100) erfolgt daher rein clientseitig gegen den ohnehin abgerufenen Tages-Speiseplan (MENSA-F-010), die Benachrichtigung wird über die geräteeigene lokale Benachrichtigungs-API ausgelöst, ohne Netzwerkbeteiligung. Dafür ist wie bei INT-005 die vom Betriebssystem erteilte allgemeine Benachrichtigungsberechtigung erforderlich (siehe Abschnitt 9 „Fehlerfälle"), aber kein Push-Abonnement.

**`MENSA-F-100` — Zeitpunkt „vormittags" und Plattformgrenzen.** Damit die Benachrichtigung für die Tagesplanung nutzbar ist, muss der Abgleich vor der Mittagszeit erfolgen (Zielwert siehe MENSA-N-010). Ein zu einer festen Uhrzeit garantiert ausgeführter Hintergrundabruf ist auf mobilen Betriebssystemen (insbesondere iOS) nicht zugesichert (vgl. bereits dokumentierte Zurückhaltung zu Hintergrundabrufen in `platform/non-functional.md` NFR-N-090). Trifft der Hintergrundabruf nicht rechtzeitig ein, holt das System den Abgleich beim nächsten Öffnen der App nach, sofern es noch vormittags ist (siehe Abschnitt 9 „Fehlerfälle") — es gibt keine rückwirkende Benachrichtigung am Nachmittag.

**`MENSA-F-100` — Umsetzungsmechanismus (Roadmap-Schritt 4).** Der Weckruf erfolgt über die betriebssystemeigene Hintergrundaufgabe (Android WorkManager, iOS BGTaskScheduler), nicht über Push. Beim Weckruf lädt die App selbst den Tagesplan der gewählten Mensen aus dem Backend-Zwischenspeicher (INT-008), gleicht ihn lokal gegen die gerätegespeicherte Lieblingsliste ab und löst die Benachrichtigung über die lokale Benachrichtigungs-API des Geräts aus. Die Lieblingsliste verlässt das Gerät nicht (MENSA-F-090); INT-005/UnifiedPush ist nicht beteiligt. Da die Ausführungszeit des Weckrufs vom Betriebssystem bestimmt wird, bleibt MENSA-N-010 ein Zielwert mit Vordergrund-Nachholung.

**`MENSA-F-035`.** INT-015 liefert je Gericht ein `type`-Feld mit Kennzeichnungen (Kürzel wie `N` = vegan, `B` = Klimateller), aufgelöst über das `/types`-Verzeichnis. Die Kennzeichnungen werden über denselben Zwischenspeicher- und Sprachweg wie Kategorien und Zusatzstoffe ausgeliefert (`platform/integrations.md` INT-015, MENSA-F-048). Fehlt das Feld oder ist es leer, entfällt die Anzeige ersatzlos.

**`MENSA-F-160` — Verbrauchsorte ohne Ausgabestellen-Gliederung.** Die Food Fakultät (INT-015-Kennung 474) liefert zu jedem Gericht `counter` und `counterNames` leer und nur einen numerischen `category`-Code, der im `/categories`-Verzeichnis der Quelle nicht enthalten ist (Prüfung 2026-09-04, `platform/integrations.md` INT-015) — eine anzeigbare Kategorie ist damit nicht zu gewinnen. Die Android-Alt-App setzt in diesem Fall den rohen Zahlencode als Überschrift (`MenuService.java:122-125`); für die Neuentwicklung entfällt die Überschrift stattdessen, die Gerichte erscheinen vollständig in einer Sammelgruppe. MENSA-F-030 („muss … Kategorie … anzeigen") bezieht sich auf den Regelfall mit gelieferter Kategorie; MENSA-F-160 ist die ausdrückliche Ausnahme. Die getrennte Beilagen-Darstellung (MENSA-F-040) bleibt unberührt — sie hängt an `counterNames`, das hier ohnehin fehlt; die kategorielose Sammelgruppe steht wie die Beilagen am Listenende. Das Backend gibt für solche Gerichte `Gericht.kategorie` als leeren String aus (`platform/api-contract.yaml`); die Sammelgruppe bildet die App.

**`MENSA-F-170` bis `MENSA-F-210` — Unverträglichkeiten-Filter.** Ergänzt am 2026-09-04 auf Wunsch des FSR FB4. Der Filter arbeitet auf denselben Zusatzstoff-/Allergen-Codes, die MENSA-F-030 ohnehin am Gericht anzeigt (`/additives`-Verzeichnis, INT-015) — es entsteht keine eigene Taxonomie und kein zusätzlicher Endpunkt. Die Hauptansicht (MENSA-F-190) und die Ansicht aller Mensen (MENSA-F-210) reagieren dabei bewusst unterschiedlich, weil sie unterschiedliche Fragen beantworten:

| Ansicht | Frage, die sie beantwortet | Reaktion auf einen Treffer |
|---|---|---|
| Hauptansicht | Was kann ich heute essen? | Ausblenden (MENSA-F-190), gezählt statt verschwiegen (MENSA-F-200) |
| Alle Mensen (MENSA-F-130) | Was bieten alle Mensen insgesamt an? | Ausgegraut, aber sichtbar (MENSA-F-210) — Ausblenden würde die Vollständigkeit dieser Vergleichsansicht gerade dort brechen, wo sie ihren Zweck ausmacht |

Ein festgelegter Filter ohne Treffer im Tagesangebot verändert nichts an der Liste — MENSA-F-190 greift nur, wenn tatsächlich ein Gericht betroffen ist; MENSA-F-200 zeigt dann die Anzahl `0` nicht gesondert an (siehe Abschnitt 7).

**Datenklasse.** Eine festgelegte Unverträglichkeit ist eine Gesundheitsangabe und fällt damit unter die besonderen Kategorien personenbezogener Daten (Art. 9 DSGVO) — sensibler als die bereits als personenbezogen geführten Lieblingsgerichte (bloße Ernährungsvorlieben). Der Filter bleibt deshalb ausnahmslos gerätelokal, wird nie an das Backend übertragen (MENSA-F-215) und liegt hinter demselben Zustimmungs-Gate wie Lieblingsgerichte (`platform/security-and-privacy.md` SEC-F-010); anders als dort ist dafür **kein** Konto nötig — Filtern ist reines Lesen, INT-008 erfährt nichts davon. Siehe `platform/data-and-storage.md` Abschnitt 2.

**`MENSA-F-175`/`MENSA-F-215` — Hinweis und Übertragungsverbot, ergänzt am 2026-09-04.** MENSA-F-215 macht aus der bisher nur in dieser Erläuterung beschriebenen Absicht eine eigene, prüfbare Anforderung: Kein Aufruf gegen INT-008 (`platform/api-contract.yaml`) und keine andere externe Schnittstelle darf ein Feld für Unverträglichkeiten führen oder die gewählten Codes im Anfragekörper, in Query-Parametern oder in Protokolldaten enthalten — auch nicht als Teil eines größeren, sonst zulässigen Aufrufs (z. B. eines Fehlerberichts nach `platform/backend-and-api.md`). Die Verifikation läuft über einen Netzwerkmitschnitt bei aktivem Filter, analog zum bereits für Lieblingsgerichte geforderten Nachweis, dass INT-005 nicht beteiligt ist (Erläuterung zu MENSA-F-100). MENSA-F-175 macht diese Zusicherung zusätzlich für die Nutzerin selbst sichtbar, direkt am Zugang (MENSA-F-170) statt nur in der Datenschutzerklärung (`platform/security-and-privacy.md` Abschnitt 4) — die Angabe einer Unverträglichkeit ist ein Vertrauensvorschuss, der eine unmittelbare, unübersehbare Zusicherung verdient, nicht nur eine an anderer Stelle nachlesbare.

**`MENSA-F-220`/`MENSA-F-230` — ein Preis in der Hauptansicht, alle drei in der Vergleichsansicht.** Ergänzt am 2026-09-04 auf Wunsch des FSR FB4. MENSA-F-030 legt fest, dass zu jedem Gericht alle drei Preise im Datenmodell vorliegen — das bleibt unverändert; MENSA-F-220 schränkt nur die **Anzeige** in der Hauptansicht auf die Preisgruppe aus SET-F-180 ein. Grund für dieselbe Aufteilung wie beim Unverträglichkeiten-Filter (Erläuterung zu MENSA-F-170 bis F-210): Die Hauptansicht beantwortet „was koste ich für mich", die Ansicht aller Mensen „was gilt hier allgemein" — eine Mitarbeiterin, die für eine Kollegin nachschaut, was ein Gericht für Studierende kostet, braucht dort weiterhin alle drei Werte, deshalb bleibt MENSA-F-230 von der Preisgruppe unberührt. Die maßgebliche Mensa (MENSA-F-018) bestimmt weiterhin, **von welcher** Mensa der Preis stammt; die Preisgruppe (SET-F-180) bestimmt, **welcher der drei Werte** dieser Mensa angezeigt wird — beide Einschränkungen wirken unabhängig voneinander.

**`MENSA-F-240` und `MENSA-N-020` — Aktualität des Speiseplans.** Ergänzt am 2026-09-04 auf Wunsch des FSR FB4. Der Speiseplan ist die meistgenutzte Ansicht der App, und Studierende sehen typischerweise zu zwei Zeitpunkten nach: morgens vor dem Aufstehen und kurz vor der Essenszeit, bevor sie zur Mensa gehen. Zwei getrennte Maßnahmen:

- **Serverseitig (MENSA-N-020, umgesetzt über `platform/backend-and-api.md` API-F-076):** Der Backend-Zwischenspeicher wird so aufgefrischt, dass eine Aktualisierung aus INT-015 vor jeder dieser beiden Nutzungsspitzen abgeschlossen ist — nicht nur in einem starren, seit Prozessstart laufenden Intervall. Ein weiterer Lauf liegt zeitnah nach dem Ende des Mensabetriebs, damit eine gegen Betriebsschluss in der Quelle hinterlegte Änderung des Folgetagsangebots noch am selben Abend im Zwischenspeicher steht statt erst am nächsten Morgen. Die App ruft INT-015 weiterhin nie selbst ab (`platform/architecture.md` ARCH-F-050); sie liest ausschließlich den Backend-Zwischenspeicher.
- **Clientseitig (MENSA-F-240):** Zusätzlich zur automatischen Aktualität kann die Nutzerin die Liste durch Herunterziehen neu laden — die feature-spezifische Ausprägung der querschnittlichen Aktualisierungsgeste (`platform/ux-and-theming.md` UX-F-160). Das Herunterziehen lädt die Tagespläne der gewählten Mensen neu aus dem Backend-Zwischenspeicher; es stößt keinen synchronen INT-015-Abruf an. Der Altershinweis (Abschnitt 8) spiegelt danach den Stand des Zwischenspeichers.

**Zustimmungs-Gate bei Lieblingsgerichten.** Der Speiseplan selbst, die Mensaauswahl und die Ansicht aller Mensen (MENSA-F-130) sind kontofrei und ungegatet (Lesefunktionen ohne personenbezogene Verarbeitung). Das Führen eines Lieblingsgerichts (MENSA-F-085) verarbeitet dagegen Ernährungsvorlieben (`platform/data-and-storage.md` Abschnitt 2, Datenklasse „Lieblingsgerichte", personenbezogen) und liegt hinter dem Zustimmungs-Gate (`platform/security-and-privacy.md` SEC-F-010) — seit der Kopplung an die Bewertung zusätzlich hinter der Kontopflicht des Schreibpfads (RATE-F-090). Die Systemberechtigung für Benachrichtigungen wird erst bei der ersten Höchstbewertung angefragt (SEC-F-080); wird sie verweigert, bleibt die Bewertung wirksam, nur die Benachrichtigung entfällt (SEC-F-090, siehe Abschnitt 9).

## 5. Datenmodell

Gericht: Kategorie, Bezeichnung, Preise für Studierende/Mitarbeitende/Gäste, Zusatzstoffhinweise — Felder wie in INT-015 (`platform/integrations.md`) dokumentiert. Mensa-Stammdaten: siehe `platform/backend-and-api.md` Abschnitt 5. Mensaauswahl und -reihenfolge der Nutzerin: lokal persistiert, siehe `platform/data-and-storage.md`.

Zusammengefasstes Gericht (nur Anzeige, nicht persistiert): normalisierter Gerichtsschlüssel (RATE-F-050), Bezeichnung, Menge der anbietenden Mensen des Tages (MENSA-F-014), Verweis auf die maßgebliche Mensa (MENSA-F-018), aus der Kategorie, Preise, Kennzeichnungen und Zusatzstoffhinweise übernommen werden. Entsteht bei jedem Aufbau der Ansicht neu aus den je Mensa abgerufenen Tagesplänen; es gibt keinen zusammengefassten Bestand im Zwischenspeicher oder im Backend.

Lieblingsgerichte-Liste (lokal, abgeleitet): Menge normalisierter Gerichtsbezeichnungen (RATE-F-050), gebildet aus den eigenen Höchstbewertungen (MENSA-F-085/F-087) und gerätelokal gespiegelt (RATE-F-100), damit der Abgleich ohne Netzzugriff möglich bleibt. Kein eigenständiger, unabhängig setzbarer Merker mehr (MENSA-F-080 entfallen); die führende Quelle ist die Bewertung. Benachrichtigungsverlauf (lokal): je Kombination aus Gericht, Mensa und Datum ein Merker, ob bereits benachrichtigt wurde (Grundlage für MENSA-F-110).

Unverträglichkeiten-Filter (lokal): Menge von Zusatzstoff-/Allergen-Codes aus dem `/additives`-Verzeichnis der Quelle (INT-015), von der Nutzerin selbst gewählt (MENSA-F-180). Rein gerätegespeichert, kein serverseitiges Pendant (Erläuterung zu MENSA-F-170 bis F-210).

## 6. Externe Schnittstellen

Nutzt INT-015 (Mensa-API des ITMC) über das eigene Backend INT-008 (siehe `platform/architecture.md` ARCH-F-050). Die Mensa-Stammdaten (Kennung, Anzeigename, Öffnungszeiten, Standardauswahl, Reihenfolge) liefert das Backend selbst, siehe `platform/backend-and-api.md` API-F-230; dieselbe Liste trägt die Ansicht aller Mensen (MENSA-F-130). Die Zusammenfassung nach MENSA-F-012 bis F-018 entsteht in der App aus den je Mensa gelieferten Tagesplänen und erfordert keinen zusätzlichen Endpunkt. Der Lieblingsgerichte-Abgleich (MENSA-F-100) nutzt ausschließlich die bereits über INT-015 abgerufenen Daten sowie die geräteeigene lokale Benachrichtigungs-API — ausdrücklich **nicht** INT-005, siehe Erläuterung zu MENSA-F-100. Der Unverträglichkeiten-Filter (MENSA-F-170 bis F-215) ist an keiner externen Schnittstelle beteiligt — weder an INT-015 noch am eigenen Backend INT-008 (MENSA-F-215) — und erzeugt keinen eigenen Aufruf; er filtert ausschließlich die bereits über INT-015 abgerufenen Gerichte lokal. Keine weiteren Endpunktdetails hier — siehe `platform/integrations.md`.

## 7. UI-Flows & Zustände

Die Hauptansicht ist von oben nach unten gegliedert: Datumsauswahl mit Pfeilen (MENSA-F-045) und, oben rechts im selben Kopfbereich, der Zugang zu den Unverträglichkeiten mit Hinweis auf die lokale Verarbeitung (MENSA-F-170/F-175), Mensa-Wechsler für die aktive Mensa, zusammengefasste Gerichtsliste (MENSA-F-012 bis F-018), je Gericht mit dem Preis der eigenen Preisgruppe (MENSA-F-220), ohne die durch den Filter betroffenen Gerichte, darunter der Fußbereich mit Öffnungszeiten (MENSA-F-047), der Anzahl gefilterter Gerichte (MENSA-F-200), Geschlossen-Hinweisen (MENSA-F-049) und der Handlung „Alle Mensen anzeigen" (MENSA-F-120). Waagerechtes Wischen über die Liste wechselt den Tag (MENSA-F-046); Herunterziehen der Liste lädt die Tagespläne der gewählten Mensen neu (MENSA-F-240).

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige während des Abrufs |
| Leer (keine Mensa gewählt) | Hinweis auf die Mensaauswahl als nächsten Schritt; von dort kehrt die Nutzerin ohne separaten Speichern-Schritt zurück und sieht das Angebot der gewählten Mensen (die Auswahl wirkt sofort, MENSA-F-020). Die Handlung „Alle Mensen anzeigen" (MENSA-F-120) ist auch in diesem Zustand erreichbar |
| Leer (alle gewählten Mensen ohne Angebot) | Hinweis „heute kein Angebot", keine Fehlermeldung; die Geschlossen-Hinweise nach MENSA-F-049 stehen darunter |
| Fehler | Fehlermeldung mit Wiederholen-Option (MENSA-F-060) |
| Offline | Zuletzt geladener Speiseplan mit Alters-Hinweis |
| Aktualisieren (Herunterziehen) | Ladeanzeige am oberen Listenrand, während die Tagespläne der gewählten Mensen neu geladen werden (MENSA-F-240); bei Fehlschlag bleibt der bisherige Stand mit Alters-/Fehlerhinweis sichtbar, keine leere Liste |
| Erster/letzter wählbarer Tag | Am aktuellen Tag ist „Tag zurück" nicht auslösbar und das Wischen nach hinten wirkungslos (MENSA-F-042), erkennbar am abgeblendeten Pfeil |
| Lieblingsgericht heute verfügbar | Gericht in der Liste zusätzlich visuell hervorgehoben (unabhängig davon, ob die Benachrichtigung MENSA-F-100 bereits ausgelöst wurde) |
| Gerichte ohne Quell-Kategorie | In einer Sammelgruppe ohne Kategorieüberschrift, am Ende der Gerichtsliste vor etwaigen Beilagen (MENSA-F-160) |
| Zugang zu den Unverträglichkeiten geöffnet | Auswahlliste der Zusatzstoff-/Allergenkennzeichnungen, darüber der Hinweis auf die ausschließlich lokale Verarbeitung (MENSA-F-175) |
| Mindestens ein Gericht durch Unverträglichkeiten-Filter ausgeblendet | Gericht fehlt in der Gerichtsliste; am Seitenende die Anzahl der ausgeblendeten Gerichte (MENSA-F-190/F-200) |
| Kein Filter festgelegt oder Filter ohne Treffer im Tagesangebot | Kein Hinweis auf ausgeblendete Gerichte am Seitenende — die Anzahl 0 wird nicht eigens angezeigt |
| Alle Gerichte des Tages durch den Filter ausgeblendet | Leerzustand statt der Gerichtsliste, mit Anzahl der ausgeblendeten Gerichte und Verweis auf den Zugang zu den Unverträglichkeiten (MENSA-F-170), unterscheidbar vom Leerzustand „heute kein Angebot" |
| Ansicht aller Mensen (MENSA-F-130) | Eigene Ansicht, aus dem Fußbereich geöffnet; je Mensa ein Abschnitt untereinander, Mensen ohne Angebot ausgelassen (MENSA-F-140), je Gericht alle drei Preise unabhängig von der eigenen Preisgruppe (MENSA-F-230). Lade-, Fehler- und Offline-Zustand wie in der Hauptansicht. Ein Gericht mit festgelegter Unverträglichkeit erscheint ausgegraut statt ausgeblendet (MENSA-F-210). Zurück führt in die Hauptansicht mit unverändertem Tag und unveränderter Auswahl (MENSA-F-150) |

## 8. Offline-Verhalten

Speisepläne gelten laut `platform/data-and-storage.md` Abschnitt 4 bis Tagesende als aktuell genug und werden bei fehlendem Netzzugriff aus dem Zwischenspeicher angezeigt (siehe auch `platform/architecture.md` ARCH-F-100). Die Zusammenfassung (MENSA-F-012) arbeitet auf diesem Zwischenspeicher und ist damit ebenso offline verfügbar; fehlt der Tagesplan einer gewählten Mensa, fehlen ihre Gerichte in der Liste und sie erscheint im Geschlossen-Hinweis (MENSA-F-049), was Abschnitt 9 als Sonderfall benennt. Die Ansicht aller Mensen (MENSA-F-130) zeigt offline die Mensen, deren Tagesplan im Zwischenspeicher liegt — für nie geladene Mensen liegt nichts vor, sie fehlen wie unter MENSA-F-140.

Die gespiegelte Lieblingsgerichte-Liste (RATE-F-100) ist wie jede lokale Auswahl unabhängig vom Netzzugriff verfügbar; der Abgleich gegen den Tagesplan (MENSA-F-100) setzt jedoch einen zuvor erfolgreich geladenen Speiseplan voraus.

Das Herunterziehen zum Aktualisieren (MENSA-F-240) ist offline wirkungslos außer einem sofort endenden Ladehinweis — es gibt keine Quelle, aus der neu geladen werden könnte; der zuletzt geladene Stand mit Alters-Hinweis bleibt stehen.

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| Gewählte Mensa liefert an einem Tag keine Daten | Geschlossen-Hinweis am Seitenende (MENSA-F-049); nur wenn keine gewählte Mensa Daten liefert, Leerzustand „heute kein Angebot", in keinem Fall ein Fehlerzustand |
| Dasselbe Gericht trägt an zwei Mensen abweichende Preise oder Kennzeichnungen | Ein Eintrag bleibt bestehen; angezeigt werden die Angaben der maßgeblichen Mensa (MENSA-F-018), nicht der Durchschnitt und keine Aufspaltung |
| Angebot eines Wochenendtags nicht bekannt (offline, Ladefehler) | Tag gilt als ohne Angebot und wird übersprungen (MENSA-F-044); wird er später mit Angebot nachgeladen, erscheint er beim nächsten Blättern wieder |
| INT-015 liefert unerwartetes Antwortformat | Fehler protokollieren, Fehlermeldung mit Wiederholen-Option anzeigen (siehe `platform/quality-and-testing.md` QA-N-070) |
| Ansicht aller Mensen ohne Netzzugriff geöffnet | Zwischengespeicherte Mensen anzeigen, für die übrigen den Alters-/Offline-Hinweis der Ansicht; kein Fehlerzustand, solange wenigstens eine Mensa vorliegt |
| Höchstbewertung ohne erteilte Systemberechtigung für Benachrichtigungen | Bewertung wird dennoch gespeichert und das Gericht als Lieblingsgericht geführt (MENSA-F-085), Hinweis auf die fehlende Systemberechtigung mit Verweis auf die Systemeinstellungen (analog `features/settings/spec.md` Abschnitt 9) |
| Höchstbewertung ohne angemeldetes Konto | Anmeldeaufforderung des Bewertungspfads (RATE-F-090); ohne Konto entsteht kein Lieblingsgericht |
| Hintergrundabruf vor dem Zielzeitpunkt aus MENSA-N-010 nicht ausgeführt (Plattformeinschränkung) | Abgleich und Benachrichtigung erfolgen beim nächsten App-Öffnen nach, sofern es noch vormittags ist; andernfalls entfällt die Benachrichtigung für diesen Tag ersatzlos, das Gericht bleibt im Speiseplan normal sichtbar |

## 10. Nicht-funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| MENSA-N-010 | Der Lieblingsgerichte-Abgleich (MENSA-F-100) sollte spätestens um 11:00 Uhr Ortszeit erfolgt sein, sofern ein Hintergrundabruf bis dahin durch das Betriebssystem zugelassen wurde. | NEU |
| MENSA-N-020 | Der Speiseplan-Zwischenspeicher des Backends (`platform/backend-and-api.md` API-F-076) sollte vor der morgendlichen und vor der mittäglichen studentischen Nutzungsspitze je einmal sowie einmal zeitnah nach dem Ende des Mensabetriebs aus INT-015 aufgefrischt worden sein, damit der in der App angezeigte Plan die tatsächliche Tagesausgabe abbildet, bevor die meisten Studierenden nachsehen, und eine kurzfristige Änderung des Folgetagsangebots noch am selben Abend sichtbar wird. | NEU |

## 11. Akzeptanzkriterien

- Für eine gewählte Mensa mit bekanntem Tagesangebot werden alle Gerichte mit vollständigen Preisangaben angezeigt.
- Bieten zwei gewählte Mensen dasselbe Gericht an, erscheint es genau einmal in der Liste und nennt beide Mensen (MENSA-F-012/F-014).
- Wird die aktive Mensa gewechselt, ändert sich der Umfang der Liste nicht, wohl aber die Hervorhebung nach MENSA-F-016 und die angezeigten Preisangaben, sobald die maßgebliche Mensa wechselt (MENSA-F-018).
- Am aktuellen Tag führt weder der Zurück-Pfeil noch eine Wischgeste nach hinten zu einem früheren Datum (MENSA-F-042).
- Ein Samstag ohne Angebot wird beim Blättern von Freitag aus übersprungen; ein Samstag mit Angebot wird angezeigt (MENSA-F-044).
- Eine gewählte, an diesem Tag nicht anbietende Mensa erscheint als Hinweis unter der Liste, nicht als Fehlermeldung und nicht als leerer Abschnitt in der Liste (MENSA-F-049).
- Die Handlung „Alle Mensen anzeigen" führt zu einer nach Mensa getrennten Ansicht; nach der Rückkehr sind Mensaauswahl, Reihenfolge, aktive Mensa und angezeigter Tag unverändert (MENSA-F-130/F-150).
- Ein simulierter Ladefehler führt zu einer sichtbaren Fehlermeldung, nicht zu einer stillen leeren Ansicht.
- Das Herunterziehen der Gerichtsliste löst einen erneuten Abruf der Tagespläne aller gewählten Mensen aus dem Backend-Zwischenspeicher aus; schlägt er fehl, bleibt der bisherige Speiseplan mit Alters-/Fehlerhinweis sichtbar (MENSA-F-240).
- Ein Speiseplan, dessen Gerichte keine Quell-Kategorie tragen (Food Fakultät), zeigt alle Gerichte in einer Gruppe ohne Kategorieüberschrift — kein Platzhalter, kein Zahlencode, kein Gericht fällt weg (MENSA-F-160).
- Nach dem Festlegen einer Unverträglichkeit fehlt jedes Gericht mit der entsprechenden Kennzeichnung in der Gerichtsliste der Hauptansicht, und deren Anzahl steht am Seitenende (MENSA-F-190/F-200).
- Dasselbe Gericht erscheint in der Ansicht aller Mensen weiterhin, aber ausgegraut und ohne Interaktionsmöglichkeit (MENSA-F-210).
- Der Zugang zu den Unverträglichkeiten zeigt den Hinweis auf die ausschließlich lokale Verarbeitung, bevor eine Auswahl getroffen wird (MENSA-F-175).
- Ein Netzwerkmitschnitt bei aktivem Unverträglichkeiten-Filter enthält in keinem Aufruf gegen INT-008 oder eine andere externe Schnittstelle die gewählten Kennzeichnungen (MENSA-F-215).
- Ohne festgelegte Unverträglichkeit verhält sich die Ansicht unverändert zur Fassung ohne Filter — kein Gericht wird ausgeblendet, kein Hinweis auf ausgeblendete Gerichte erscheint.
- In der Hauptansicht zeigt jedes Gericht genau einen Preis, entsprechend der in den Einstellungen gewählten Preisgruppe (MENSA-F-220); ohne eigene Wahl den Preis für Studierende (SET-F-190).
- In der Ansicht aller Mensen zeigt dasselbe Gericht weiterhin alle drei Preise, unabhängig von der gewählten Preisgruppe (MENSA-F-230).
- Ein mit der besten Bewertungsstufe bewertetes Gericht wird über mehrere Tage hinweg trotz wechselnder roher Gerichtsbezeichnung als Lieblingsgericht wiedererkannt (MENSA-F-085/F-090).
- Wird die Höchstbewertung herabgesetzt, gilt das Gericht nicht mehr als Lieblingsgericht und löst keine Benachrichtigung mehr aus (MENSA-F-087).
- Erscheint ein Lieblingsgericht im Tages-Speiseplan, erfolgt genau eine Benachrichtigung für diese Gericht-Mensa-Tag-Kombination, keine wiederholte (MENSA-F-110).
- Bei abgeschalteter Lieblingsgericht-Benachrichtigung (SET-F-170) erfolgt keine Benachrichtigung, das Gericht bleibt in der Liste hervorgehoben (MENSA-F-105).
- Die gespiegelte Lieblingsgerichte-Liste bleibt nach einem simulierten Offline-Start der App vollständig erhalten (lokale Persistenz, RATE-F-100/Datenmodell).

## 12. Bewusst nicht übernommenes Altverhalten

- Stillschweigend verschluckter Ladefehler (leeres `finally` ohne `catch`) — Grund: verdeckt Fehlerzustände, siehe MENSA-F-060.
- Unverschlüsselter Abruf über `http://` — Grund: überträgt Standort-/Mensawahl im Klartext, siehe MENSA-F-070.
- Roher numerischer `category`-Code als Kategorieüberschrift, wenn die Quelle keinen Ausgabestellennamen liefert (Android-Alt-App, `MenuService.java:122-125`) — Grund: „20"/„21" als Überschrift ist für die Nutzerin bedeutungslos; stattdessen kategorielose Sammelgruppe, siehe MENSA-F-160.
- Trennung der Tagesansicht nach Mensa als **einzige** Darstellung (Android-Alt-App, `MenuDayFragment.java:105`) — Grund: zeigt dasselbe Gericht mehrfach und verlagert den Vergleich auf die Nutzerin, siehe MENSA-F-012. Die Darstellung selbst bleibt als zweite Ansicht erhalten (MENSA-F-130), sie ist nur nicht mehr der Regelfall.
- Ausblenden einer Mensa aus dem Kontextmenü der Tageskarte (Android-Alt-App, `MenuDayFragment.java:64-72`, schreibt die Auswahl beim Blättern still um) — Grund: eine beiläufige Geste ändert dauerhaft die Mensaauswahl; die Auswahl wird ausschließlich in der Mensaauswahl geändert (MENSA-F-020, MENSA-F-150).

## 13. Offene Fragen

- ~~Datenquelle für Mensa-Öffnungszeiten: keine bestätigte Quelle identifiziert.~~ Beantwortet am 2026-08-25: INT-015 liefert Öffnungszeiten je Mensa; zusätzlich enthalten die Mensa-Stammdaten eine gepflegte Angabe je Wochentag. Aufgenommen als MENSA-F-047.
- ~~Welche der beiden Öffnungszeit-Quellen führend ist — die Schnittstelle (INT-015, `openings/all`) oder die gepflegten Stammdaten.~~ Entschieden am 2026-09-03 (Roadmap-Schritt 4): Die gepflegten Stammdaten sind führend; `openings/all` antwortete bei der Verifikation mit HTTP 500 und wird nicht genutzt (`platform/integrations.md` INT-015).
- ~~Zuverlässigkeit zeitgesteuerter Hintergrundabrufe je Plattform für den Zielwert aus MENSA-N-010.~~ In Roadmap-Schritt 4 umgesetzt über die betriebssystemeigene Hintergrundaufgabe mit Vordergrund-Nachholung (siehe Erläuterung zu MENSA-F-100); die tatsächliche Ausführungszeit auf Gerät wird im Prüfprotokoll `pruefprotokolle/2026-09-04-schritt-4-mensa.md` festgehalten, MENSA-N-010 bleibt Zielwert (`platform/non-functional.md` Abschnitt 11).
- ~~Ob ein zusätzlicher, globaler Ein-/Ausschalter für Lieblingsgerichte-Benachrichtigungen in `features/settings/spec.md` sinnvoll ist (unabhängig vom Entfernen einzelner Markierungen, MENSA-F-080).~~ Entschieden am 2026-09-04: Er ist nötig, seit die Lieblingseigenschaft aus der Bewertung folgt (MENSA-F-085) — wer ein Gericht mit der besten Stufe bewertet, will damit nicht zwingend benachrichtigt werden, und das Herabsetzen der eigenen Bewertung wäre ein unangemessener Weg, die Benachrichtigung abzustellen. Aufgenommen als SET-F-170, wirksam über MENSA-F-105.
- Ob die Zusammenfassung (MENSA-F-012) über die gewählten Mensen hinaus auch in der Ansicht aller Mensen (MENSA-F-130) angeboten werden soll. Für den ersten Umfang bewusst nein: Dort ist der Ort die Frage, nicht das Gericht. Zu prüfen, sobald die Ansicht in Gebrauch ist — FSR FB4.
- Ob die Beschränkung auf den aktuellen Tag (MENSA-F-042) auch für den laufenden Tag nach Schließung der Mensen sinnvoll bleibt oder ab einer Uhrzeit auf den Folgetag vorgeblendet werden sollte. Nicht entschieden, betrifft nur den Startwert der Datumsauswahl, nicht die Grenze selbst — FSR FB4.
- Wie sich die Lieblingsgericht-Benachrichtigung verhält, wenn eine Person auf einem zweiten Gerät angemeldet ist: Die Spiegelung (RATE-F-100) entsteht je Gerät beim Abruf der eigenen Bewertungen; ob dabei jedes Gerät benachrichtigt oder eine Zustellung genügt, ist offen und mit Roadmap-Schritt 9 zu entscheiden.
- **Nachfrage-ausgelöste Auffrischung des Zwischenspeichers.** Vorschlag FSR FB4, 2026-09-04: Das Backend könnte den Speiseplan einer Mensa außerplanmäßig aus INT-015 nachladen, wenn viele Leseanfragen (z. B. > 50 in kurzer Zeit) darauf treffen. Bewertung der technischen Leitung: In der reinen Zähl-Form eher nicht sinnvoll — die INT-015-Daten ändern sich untertags praktisch nicht, ein Anfrage-Ansturm findet also meist nichts Neueres, und der Zähler wäre zusätzlicher Zustand, der auf Menge statt auf Bedarf reagiert. Falls sich die feste Auffrischung nach API-F-076 als zu grob erweist, ist die sinnvollere Form eine **bedarfs- statt mengengesteuerte** Variante: Trifft eine Leseanfrage den zwischengespeicherten Tagesplan einer Mensa älter als eine Schwelle an, stößt das Backend **asynchron** (ohne die laufende Antwort zu verzögern) einen einzelnen Auffrischungsabruf für diese Mensa an, begrenzt durch eine Abklingzeit (z. B. höchstens ein INT-015-Abruf je Mensa und 15 Minuten, unabhängig von der Anzahl der Anfragen). Das hält den Lesepfad frei von synchronen Fremdaufrufen (ARCH-F-050) und deckelt die INT-015-Last unabhängig von der Nutzerzahl. Noch nicht als Anforderung aufgenommen — Entscheidung FSR FB4 nach den ersten Betriebswochen von API-F-076.
