## MODIFIED Requirements

### Requirement: Normalisierung von Gerichtsbezeichnungen vor der Verknüpfung

Das System muss Gerichtsbezeichnungen vor der Verknüpfung mit Bewertungen normalisieren, sodass dasselbe Gericht an verschiedenen Tagen demselben Bewertungsziel zugeordnet wird. Herkunft: NEU (vormals RATE-F-050), Eingang der Normalisierung am 2026-09-22 auf die Komponentenliste der neuen Mensa-Schnittstelle umgestellt. Rohtitel der Speiseplan-Quelle sind nicht garantiert stabil formatiert. Kernregel der Normalisierung: Kleinschreibung, Vereinheitlichung von Mehrfach-Leerzeichen auf ein einzelnes, Entfernen von führendem/nachgestelltem Whitespace, Entfernen führender Tagesnummerierungen (Muster `^\d+\.\s*`). Vor der Kernregel werden Klammergruppen entfernt, die als Zusatzstoff-/Allergen-Code-Aufzählung erkennbar sind — Muster `\(\s*\d[0-9a-z,\s]*\)` (öffnende Klammer, erste Zeichen eine Ziffer, dann nur Ziffern/Kleinbuchstaben/Kommata/Leerzeichen). Klammern mit anderem Inhalt (z. B. `(scharf)`) bleiben unberührt.

Die Mensa-Schnittstelle liefert die Bezeichnung nicht mehr als eine Zeichenkette, sondern in ihre Komponenten zerlegt. Eingang der Normalisierung ist deshalb die mit ` | ` zusammengefügte Komponentenliste, nicht das Feld mit der ersten Komponente allein: die zusammengefügte Form entspricht dem Rohtitel der abgelösten Quelle zeichengenau und hält den Schlüssel über die Quellenablösung hinweg gleich, sodass bestehende Bewertungen, Lieblingsgerichte und Fotos ihren Gerichten zugeordnet bleiben und kein Umschreiben nötig wird.

Das Entfernen der Code-Klammern bleibt auch dann erforderlich, wenn die Quelle angibt, die Codes bereits entfernt zu haben: bei einer Prüfung am 2026-09-22 trugen 5 von 73 englischsprachigen Komponentenzeilen sie weiterhin, darunter den in der Legende der Quelle nicht vorhandenen Code `281`. Fehlt zu einem Gericht die englische Fassung — am selben Tag bei 10 von 73 Gerichten —, tritt die deutsche an ihre Stelle, statt die Bezeichnung leer zu lassen.

#### Scenario: Gleiches Gericht mit unterschiedlichen Zusatzstoff-Codes
- **WHEN** derselbe Rohtitel an zwei Tagen mit unterschiedlichen Zusatzstoff-Codes in Klammern geliefert wird (z. B. `"… (20a,28)"` und `"… (20a)"`)
- **THEN** normalisiert das System beide Titel auf dasselbe Bewertungsziel

#### Scenario: Mehrteiliges Gericht aus Komponenten
- **WHEN** die Quelle ein Gericht in mehrere Komponenten zerlegt liefert
- **THEN** bildet das System den Schlüssel aus allen Komponenten, nicht aus der ersten allein, und erhält damit denselben Schlüssel wie vor der Quellenablösung

#### Scenario: Restliche Code-Klammern in der Quelle
- **WHEN** eine Komponentenzeile entgegen der Zusage der Quelle noch eine Code-Klammer enthält
- **THEN** entfernt das System sie vor der Bildung des Schlüssels
