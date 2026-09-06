## MODIFIED Requirements

### Requirement: Gruppenkennungs-Eingabeformat

Das System muss der Nutzerin die Angabe einer Gruppenkennung nach dem Muster `^[A-Z][0-9]+$` ermöglichen; Buchstabe und Zahl sind beide verpflichtend. Herkunft: Alt: lib/areas/schedule/models/selected_course_info.dart, Zahl wieder verpflichtend entschieden 2026-09-06; vormals SCHED-F-040. Die zwischenzeitliche Erweiterung auf eine freiwillige Zahl (2026-09-04) ist zurückgenommen: Fünf der 21 im FBWS-Bestand vorkommenden `studentSet`-Werte tragen eine Zahl an einer Bereichsgrenze (`C5-E`, `M5-P`, `J-M4`, `H5-J`, `F-H4`), an der sie mitentscheidet.

#### Scenario: Gültige Eingabe mit Zahl
- **WHEN** die Nutzerin Buchstabe und Zahl eingibt (z. B. `C8`)
- **THEN** akzeptiert das System die Eingabe als gültige Gruppenkennung

#### Scenario: Eingabe ohne Zahl
- **WHEN** die Nutzerin nur einen Buchstaben eingibt (z. B. `D`)
- **THEN** weist das System die Eingabe als unvollständig zurück und benennt die fehlende Zahl

### Requirement: Gruppenkennung ohne Matrikelnummer

Das System muss die Gruppenkennung auch ohne Angabe einer Matrikelnummer festlegbar machen; die manuelle Angabe verlangt dann Buchstabe und Zahl. Die Ermittlung über die Matrikelnummer (INT-019) ist der voreingestellte Weg, weil sie die vollständige Kennung samt Zahl liefert, ohne dass die Nutzerin sie kennen muss. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04, Zahlenpflicht ergänzt 2026-09-06; vormals SCHED-F-720. Die vorige Fassung führte den Buchstaben als maßgebliche Angabe und die Zahl als freiwillige Ergänzung; das trägt nicht mehr, seit nur der Weg über die Matrikelnummer die Zahl zuverlässig beschafft.

#### Scenario: Einrichtung ohne Matrikelnummer
- **WHEN** die Nutzerin keine Matrikelnummer angibt
- **THEN** lässt sich die Einrichtung dennoch durch manuelle Angabe von Buchstabe und Zahl abschließen

#### Scenario: Voreingestellter Weg
- **WHEN** die Nutzerin die Einrichtung der Gruppenkennung öffnet
- **THEN** ist die Ermittlung über die Matrikelnummer vorausgewählt, die manuelle Angabe bleibt erreichbar

### Requirement: Bereichsangabe im studentSet

Wenn `studentSet` eines Termins ein Bereich der Form `A1-C9` ist, dann muss das System einen Termin genau dann anzeigen, wenn das Paar (Buchstabe, Zahl) der Gruppenkennung — die Zahl dabei numerisch, nicht als Zeichenkette, verglichen — innerhalb des durch Anfangs- und Endpaar aufgespannten Bereichs liegt, einschließlich beider Grenzen. Trägt die Gruppenkennung keine Zahl und ist damit unvollständig, muss das System den Termin als zugehörig behandeln und den Vorfall protokollieren, statt eine Zahl anzunehmen. Herkunft: Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:218-249, Behandlung der unvollständigen Kennung ergänzt 2026-09-06; vormals SCHED-F-080. Der numerische statt zeichenweise Vergleich ist ausdrücklich festgehalten, weil ein reiner Zeichenkettenvergleich bei mehrstelligen Zahlen falsche Ergebnisse liefert (`"10"` wäre als Zeichenkette kleiner als `"9"`). Die Ergänzung schließt aus, dass eine fehlende Zahl als `0` gilt und den Termin an jeder unteren Grenze fälschlich ausschließt. Die Capability `quality-and-testing` verlangt automatisierte Tests genau für diese Fälle.

#### Scenario: Buchstabe echt innerhalb des Bereichs
- **WHEN** die Gruppenkennung `B5` gesetzt ist und ein Termin `studentSet` `A1-C9` trägt
- **THEN** zeigt das System diesen Termin als zugehörig an, da der Buchstabe B echt zwischen A und C liegt

#### Scenario: Paar entspricht der Anfangsgrenze
- **WHEN** die Gruppenkennung `A1` gesetzt ist und ein Termin `studentSet` `A1-C9` trägt
- **THEN** zeigt das System diesen Termin als zugehörig an, da die Grenze eingeschlossen ist

#### Scenario: Paar unterhalb der Anfangsgrenze
- **WHEN** die Gruppenkennung `A0` gesetzt ist und ein Termin `studentSet` `A1-C9` trägt
- **THEN** zeigt das System diesen Termin als gruppenfremd an

#### Scenario: Paar entspricht der Endgrenze
- **WHEN** die Gruppenkennung `C9` gesetzt ist und ein Termin `studentSet` `A1-C9` trägt
- **THEN** zeigt das System diesen Termin als zugehörig an, da die Grenze eingeschlossen ist

#### Scenario: Paar oberhalb der Endgrenze, numerischer Vergleich
- **WHEN** die Gruppenkennung `C10` gesetzt ist und ein Termin `studentSet` `A1-C9` trägt
- **THEN** zeigt das System diesen Termin als gruppenfremd an, da 10 numerisch größer als 9 ist (ein Zeichenkettenvergleich würde hier fälschlich „ja" liefern)

#### Scenario: Buchstabe außerhalb des Bereichs
- **WHEN** die Gruppenkennung `D2` gesetzt ist und ein Termin `studentSet` `A1-C9` trägt
- **THEN** zeigt das System diesen Termin als gruppenfremd an

#### Scenario: Gemischte Grenzen
- **WHEN** die Gruppenkennung `D2` gesetzt ist und ein Termin `studentSet` `C5-E` trägt
- **THEN** zeigt das System diesen Termin als zugehörig an, da (D,2) zwischen der Anfangsgrenze (C,5) und der offenen Endgrenze E liegt

#### Scenario: Unvollständige Gruppenkennung an einer Grenze mit Zahl
- **WHEN** eine unvollständige Gruppenkennung `H` ohne Zahl vorliegt und ein Termin `studentSet` `H5-J` trägt
- **THEN** zeigt das System diesen Termin als zugehörig an und protokolliert den Vorfall, statt die fehlende Zahl als `0` zu behandeln
