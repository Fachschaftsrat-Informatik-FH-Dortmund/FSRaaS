## Context

Anlass und Geltungsbereich stehen in `proposal.md`, die Anforderung in
`specs/ux-and-theming/spec.md` (Requirement „Bestätigungsdialoge als Pop-up").

Bestandsaufnahme (Grep nach `Alert.alert`, `<Modal`, `…Bestaetig…`, `…Frage`
in `app/src` und `app/app`, Stand 2026-11-26). Rückfragen, die eine
Entscheidung verlangen, stehen heute an drei Arten von Orten:

| Fundstelle | Rückfrage | Heutige Gestalt |
|---|---|---|
| `TerminDetailScreen.tsx` | Geltungsbereich einer Farbwahl beim Verlassen (auslösender Fund, Issue #68) | Kasten am Seitenende |
| `TerminDetailScreen.tsx` | Löschen eines eigenen Termins | Kasten anstelle des Löschknopfs im Inhalt |
| `PlanungScreen.tsx` | Verwerfen der Planung (Kopfzeile) | Kasten am Seitenende (`VerwerfenBestaetigung`) |
| `PlanungScreen.tsx` | Verlassen mit ungesicherten Änderungen | Kasten am Seitenende (`VerlassenBestaetigung`) |
| `CourseSelectionScreen.tsx` | Abwahl eines Moduls mit Planeinträgen | Kasten unter der Modulzeile in der Liste |
| `CourseSelectionScreen.tsx` | Verwerfen der Modulauswahl, danach ggf. Planeinträge mitentfernen | schwebender Kasten am unteren Rand, zweistufig |
| `SortierGruppierScreen.tsx` (Mensa) | Löschen einer gespeicherten Kombination | `Alert.alert` |
| `CanteenScreen.tsx` (Mensa) | Zustimmung fehlt vor dem Markieren eines Favoriten | `Alert.alert` |

Bereits konform und unverändert: `VerwaltungsblattZugang.tsx` (Leeren/Zurücksetzen
des Plans) zeigt seine Rückfrage im selben `Modal` wie das Verwaltungsblatt
und damit schon über der Ansicht; ebenso die Rückfrage „anstelle oder
zusätzlich" bei der Übernahme einer Alternative in `ScheduleScreen.tsx`
(eigenes `Modal` als Blatt). Kein Fund im Sinne der Anforderung sind
reine Meldungen ohne Entscheidung (`Alert.alert` mit nur einer Mitteilung im
Verwaltungsbereich, z. B. „Gespeichert"), die Übernahme eines ermittelten
Gruppenkennungs-Vorschlags in `GruppenkennungScreen.tsx` (ein Ergebnis mit
Bedienweg, keine Rückfrage vor einer ausgelösten Aktion) sowie Lade-, Leer-,
Fehler- und Offline-Zustände (proposal.md, „Bewusst nicht in diesem Schnitt").

Einschränkung: Die Verwaltungsoberfläche ist ein Web-Export derselben App
(ADR 0018). `Alert.alert` ist in `react-native-web` ohne Wirkung — eine dort
geführte Rückfrage erscheint im Browser gar nicht, die Aktion bleibt
unerreichbar bzw. unbestätigt. `Modal` dagegen rendert in `react-native-web`
als Dialog mit Fokusführung.

## Goals / Non-Goals

**Goals:**
- Eine einzige Bestätigungs-Primitive in `app/src/ui/`, über die jede
  Rückfrage der App läuft — die Anforderung wird an einer Stelle erfüllt.
- Alle Fundstellen der Tabelle auf diese Primitive umstellen.
- Barrierefrei: Vorlesbarkeit der Frage, Fokus im Dialog, Bedienelemente
  ≥ 44 dp, „Bewegung reduzieren" beachtet.

**Non-Goals:**
- Kein Wechsel der fachlichen Abläufe: Wann gefragt wird, welche Antworten es
  gibt und was sie bewirken, bleibt wie in den bestehenden Requirements
  (`schedule`, `canteen`). Nur die Gestalt ändert sich.
- Keine Umgestaltung von `VerwaltungsblattZugang.tsx` (bereits ein Pop-up mit
  zusätzlichem Schalter im Dialog).
- Keine Ablösung von `Alert.alert` für reine Mitteilungen ohne Entscheidung.

## Decisions

**1. `ConfirmDialog` auf Basis von `Modal`, nicht `Alert.alert`.**
Neue Datei `app/src/ui/ConfirmDialog.tsx`. Sie rendert ein transparentes
`Modal` mit abgedunkeltem Hintergrund und einer Karte (Titel optional, Frage,
Aktionen als `AppButton`). Verworfen: `Alert.alert` — wirkt im Web-Export
nicht (siehe Context), lässt keine eigenen Varianten (`destructive` ohne
Akzentfläche, UX „Keine zerstörende Aktion als Primäraktion") und keine
eigene Gestaltung zu und ist in Jest nur über Spies prüfbar. Verworfen auch:
eine Drittbibliothek — `Modal` aus React Native reicht und hält den
F-Droid-Build frei von zusätzlichen Abhängigkeiten.

**2. Schnittstelle: Frage + Liste von Aktionen + Abbruchweg.**
`{ visible, title?, message, actions: { label, onPress, variant? }[], onDismiss }`.
Die Aktionen werden in der angegebenen Reihenfolge untereinander gezeigt
(drei Aktionen wie „Sichern / Verwerfen / Zurück" passen nebeneinander nicht
lesbar auf ein Telefon, bei großer Systemschrift erst recht). Die Texte
übergibt die aufrufende Ansicht aus ihren i18n-Schlüsseln; die Primitive
selbst enthält keine Zeichenkette. Bestehende Schlüssel (`…Frage`,
`…Bestaetigen`, `common.cancel`) werden weiterverwendet, neue sind nicht
nötig.

**3. Schließen ohne Antwort = Abbruch, Hintergrund schließt nicht.**
Die Zurück-Taste (Android) bzw. Escape (Web) ruft `onDismiss` auf, das die
Ansicht als „nichts tun" behandelt. Ein Tipp auf den abgedunkelten
Hintergrund schließt den Dialog bewusst *nicht*: Er nimmt Berührungen nur
auf, damit der auslösende Bedienweg nicht erneut auslösbar ist (Szenario
„Auslösender Bedienweg während der Rückfrage"); ein versehentlicher Tipp
daneben soll eine Entscheidung weder treffen noch verwerfen. Für Rückfragen
ohne eigenen Abbruchknopf heißt Abbruch je Fundstelle:
- Geltungsbereich der Farbwahl: auf dem Termindetail bleiben, Farbe bleibt
  einzeln gesetzt; beim nächsten Verlassen wird wieder gefragt.
- Abwahl eines Moduls mit Planeinträgen: Modul bleibt angekreuzt, nichts wird
  entfernt.
- Zweite Stufe „Planeinträge mitentfernen?" beim Verwerfen der Modulauswahl:
  gilt als „behalten" — die erste Stufe hat das Verwerfen bereits bestätigt;
  das entspricht der bisherigen Vorbelegung auf „nein".

**4. Ein `Modal` liegt über allem, auch über der Kopfzeile.**
`Modal` öffnet eine eigene native Ebene (Android: eigenes Fenster, iOS:
präsentierter Controller, Web: Portal mit Fokusfalle). Damit sind auch die
Kopfzeilen-Bedienwege (`PlanungSpeichernZugang`,
`ModulauswahlVerwerfenZugang`), die außerhalb des Bildschirm-Baums liegen,
während der Rückfrage verdeckt. Verworfen: ein absolut positionierter Kasten
innerhalb des `Screen` — er deckt die Kopfzeile nicht ab, genau das Problem
des heutigen schwebenden Kastens in `CourseSelectionScreen`.

**5. Barrierefreiheit.**
Die Karte trägt `accessibilityViewIsModal` (iOS: Vorleser bleibt im Dialog)
und `importantForAccessibility="yes"`; der Hintergrund ist für den Vorleser
ausgeblendet. Beim Öffnen setzt die Primitive den Vorlesefokus per
`AccessibilityInfo.setAccessibilityFocus` auf die Frage (bzw. den Titel), so
dass sie zuerst vorgelesen wird — analog zum Requirement „Vorlesefokus auf
den neuen Bildschirmtitel". Die Frage ist ein `Text` mit
`accessibilityRole="header"`, wenn kein Titel da ist, sonst der Titel.
`animationType` ist `fade`, bei „Bewegung reduzieren" `none`
(`useReducedMotion`, Requirement „Reduzierte Bewegung respektieren").

**6. Mensa-Rückfragen ziehen mit um.**
Die beiden `Alert.alert`-Rückfragen in der Mensa sind auf dem Telefon zwar
schon Pop-ups, im Web-Export aber wirkungslos (Context). Sie werden auf
`ConfirmDialog` umgestellt, damit die Festlegung „für alle Bereiche und die
Verwaltungsoberfläche" tatsächlich gilt und alle Rückfragen gleich aussehen.

**7. Tests.**
`ConfirmDialog.test.tsx` prüft die Primitive gegen alle drei Szenarien
(`describe('Bestätigungsdialoge als Pop-up', …)`): sichtbar nur bei
`visible`, Aktionen lösen ihren Callback aus, Zurück/`onRequestClose` ruft
`onDismiss`, der Inhalt liegt in einem `Modal`. Je umgestellter Ansicht genügt
ein Test, der die Rückfrage im `Modal` findet; bestehende Tests der Ansichten
laufen unverändert weiter, weil Fragetexte und Knopfbeschriftungen gleich
bleiben.

## Risks / Trade-offs

- [Zwei `Modal`s gleichzeitig (Verwaltungsblatt + Bestätigung)] → kommt nicht
  vor: Das Verwaltungsblatt führt seine Rückfrage selbst und bleibt
  unverändert; die übrigen Fundstellen öffnen je Ansicht höchstens einen
  Dialog (Modulauswahl schließt eine offene Abwahl-Rückfrage, bevor sie die
  Verwerfen-Rückfrage öffnet — wie heute).
- [`setAccessibilityFocus` greift auf Android nicht sofort, solange das
  Modal-Fenster noch aufgebaut wird] → Fokus wird nach dem `onShow` des
  `Modal` gesetzt; bleibt er dennoch aus, liest der Vorleser das neue Fenster
  ohnehin von oben, also beginnend mit der Frage. Bestätigung per Gerätetest.
- [`usePreventRemove` und `Modal`: der Bildschirm wird verlassen, während der
  Dialog offen ist] → Der Dialog führt die gemerkte Navigationsaktion erst
  nach der Antwort aus und setzt vorher seinen Zustand zurück; die Reihenfolge
  bleibt wie heute.
- [Jest rendert `Modal`-Inhalte, prüft aber keine echte Überlagerung] → die
  Gestalt am Gerät wird im Prüfprotokoll des nächsten Gerätetests bestätigt.

## Migration Plan

Keine Daten- oder Schnittstellenänderung; reine Oberflächenänderung, mit dem
nächsten App-Release ausgeliefert. Rückweg: Revert des Merges.
