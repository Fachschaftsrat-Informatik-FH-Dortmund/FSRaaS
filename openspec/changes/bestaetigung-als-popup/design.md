## Context

Rückfragen vor einer Aktion sind heute je Bildschirm einzeln gelöst.
`TerminDetailScreen.tsx` rendert sowohl die Löschbestätigung
(`loeschenBestaetigen`) als auch die Geltungsbereich-Rückfrage
(`pendingAction`) als bedingt eingeblendetes `View` innerhalb des
scrollbaren Bildschirminhalts — beide bleiben am Ende des Inhalts stehen,
solange der auslösende Bedienweg (der `AppButton`, der sie ausgelöst hat)
weiter sichtbar und bedienbar ist. `ScheduleScreen.tsx` verwendet an einer
Stelle bereits `react-native`s `Modal` (`transparent`, `animationType="slide"`)
für eine Auswahl, aber nicht für eine Bestätigung. Es gibt keine gemeinsame
Komponente für Bestätigungsdialoge; `app/src/ui/` enthält mit `Screen.tsx`
und dem Ordner `state/` (`AsyncStates.tsx`) das Vorbild für „eine
Grundstruktur, viele Bildschirme" — genau dieses Muster fehlt für
Bestätigungsdialoge.

Siehe proposal.md für die Motivation (Issue #68) und
`specs/ux-and-theming/spec.md` für das Requirement.

## Goals / Non-Goals

**Goals:**
- Eine einzige Komponente in `app/src/ui/`, die eine Rückfrage als Pop-up
  über der Ansicht darstellt, sodass jede Stelle im Code, die heute einen
  eigenen Inline-Block führt, auf sie umgestellt werden kann.
- Die Komponente blockiert den auslösenden Bedienweg für die Dauer der
  Rückfrage, ohne dass jeder Aufrufer das selbst nachbauen muss.
- Bestehende Aufrufer (`TerminDetailScreen.tsx`, `PlanungScreen.tsx`,
  `CourseSelectionScreen.tsx` und weitere, noch zu erhebende Stellen) werden
  auf die neue Komponente umgestellt.

**Non-Goals:**
- Keine neue Bestätigungspflicht an Stellen, die heute keine Rückfrage
  stellen — nur die Darstellungsform bestehender Rückfragen ändert sich.
- Keine Änderung an Hinweisen ohne Entscheidung (Lade-, Leer-, Fehler-,
  Offline-Zustände, schließbare Einführungshinweise) — siehe
  proposal.md, Abschnitt „Bewusst nicht in diesem Schnitt".
- Keine allgemeine Toast- oder Snackbar-Komponente; das Requirement betrifft
  ausschließlich Rückfragen, die eine Entscheidung verlangen.

## Decisions

**Eine Komponente `ConfirmDialog` in `app/src/ui/`, gebaut auf
`react-native`s `Modal`.**
`Modal` mit `transparent` ist im Bestand bereits erprobt
(`ScheduleScreen.tsx`) und deckt beide hier nötigen Eigenschaften ab: Sie
legt sich über die gesamte Ansicht (eigener nativer Layer, kein Platz im
Scroll-Fluss der aufrufenden Ansicht) und macht den darunterliegenden
Bedienweg für Berührungen unerreichbar, ohne dass jeder Aufrufer das selbst
sicherstellen muss. Alternative wäre eine selbstgebaute Overlay-`View` mit
`position: absolute` über der gesamten `Screen`-Fläche gewesen — das würde
in jedem aufrufenden Bildschirm eigenes Layout-Wissen über dessen
Bildschirmgrenzen voraussetzen (Statusleiste, sichere Randbereiche) und
liefe bei Bildschirmen mit `scroll` Gefahr, hinter den Scroll-Inhalt statt
darüber zu geraten. `Modal` löst beides durch das Betriebssystem.

**Deklarative Schnittstelle: `sichtbar`, ein Fragetext, eine Liste von
Aktionen.**
```
<ConfirmDialog
  sichtbar={pendingAction !== null}
  text={t('schedule.farbeGeltungFrage')}
  aktionen={[
    { label: t('schedule.farbeGeltungModul'), onPress: geltungsbereichModul },
    { label: t('schedule.farbeGeltungEinzeln'), onPress: geltungsbereichEinzeln, variant: 'secondary' },
  ]}
/>
```
Das entspricht dem Aufbau, den `TerminDetailScreen.tsx` heute schon für
beide Rückfragen verwendet (Text + `AppButton`-Reihe) und lässt sich ohne
Zwischenschritt aus dem bestehenden Code übernehmen — nur die Hülle wechselt
vom `View` zum `Modal`. Eine Aktionsliste statt fester Props für „Bestätigen"
und „Abbrechen" wird gewählt, weil die Geltungsbereich-Rückfrage bereits
heute zwei gleichrangige gültige Antworten kennt (Modul/Einzeln), keine
Bestätigen/Abbrechen-Semantik.

**Schließen ohne Aktion zählt als Abbruch, nicht als Bestätigung.**
Ein `onRequestClose` (Android-Zurück-Taste, Tippen außerhalb) darf nie eine
der übergebenen Aktionen auslösen — sonst könnte ein versehentliches
Schließen eine zerstörende Aktion auslösen, die die Nutzerin gerade
verhindern wollte. Aufrufer, die keine Möglichkeit haben sollen, die
Rückfrage folgenlos zu verlassen (z. B. die Geltungsbereich-Frage, die eine
Entscheidung erzwingt, weil die Navigation bereits angehalten wurde), geben
keine Abbruch-Aktion mit; `ConfirmDialog` selbst erzwingt nichts.

**Der auslösende Bedienweg wird durch den bereits vorhandenen Zustand
gesperrt, nicht durch eine neue Sperre in `ConfirmDialog`.**
Jeder heutige Aufrufer hält den Sichtbarkeits-Zustand (`loeschenBestaetigen`,
`pendingAction`) bereits in einer Zustandsvariable, die auch den Button
steuern könnte, der die Rückfrage ausgelöst hat. Die Modal-Eigenschaft von
`react-native` macht Berührungen auf dem Rest des Bildschirms ohnehin
unerreichbar, solange sichtbar; ein zusätzliches Sperren des Auslösers in
der Komponente wäre doppelt. Aufrufer mit einem eigenen Button, der erneut
auslösbar bliebe, weil er außerhalb des von `Modal` verdeckten Bereichs
liegt, gibt es im erhobenen Bestand nicht.

## Risks / Trade-offs

[`Modal` mit `transparent` verhält sich zwischen iOS und Android geringfügig
unterschiedlich (Android-Zurück-Taste löst `onRequestClose` aus, iOS
nicht)] → `onRequestClose` immer setzen und, wie oben festgelegt, nie mit
einer Aktion belegen; damit ist das Verhalten auf beiden Plattformen
gleichwertig sicher (Abbruch statt Bestätigung).

[Die vollständige Erhebung aller Stellen mit Inline-Rückfrage
(proposal.md nennt drei Fundstellen und verweist auf „alle weiteren") ist
noch offen] → Erhebung ist eigene Aufgabe in tasks.md, vor der Umstellung
einzelner Bildschirme.

[`ConfirmDialog` könnte durch eine zu allgemeine Schnittstelle
(freie `ReactNode`-Kinder statt Text+Aktionen) zu einer erneuten
Fragmentierung einladen, weil jeder Aufrufer wieder eigenes Layout baut] →
Schnittstelle bewusst eng gehalten (Text, Aktionsliste), keine
`children`-Prop.

## Migration Plan

1. `ConfirmDialog` in `app/src/ui/` anlegen (Komponente + Test).
2. `TerminDetailScreen.tsx` umstellen — beide dort vorhandenen Rückfragen
   (Löschen, Geltungsbereich) — da sie den auslösenden Fund darstellen und
   beide Ausprägungen (Abbruch möglich / Abbruch ausgeschlossen) abdecken.
3. Verbleibende erhobene Stellen (`PlanungScreen.tsx`,
   `CourseSelectionScreen.tsx`, weitere laut Erhebung) einzeln umstellen;
   jede Umstellung ist unabhängig und einzeln abschließbar.
4. Keine Rollback-Besonderheit: Jede Umstellung ersetzt einen Inline-Block
   durch `ConfirmDialog` innerhalb derselben Datei — ein Zurücksetzen einer
   einzelnen Umstellung berührt keine andere Stelle.

## Open Questions

Keine.
