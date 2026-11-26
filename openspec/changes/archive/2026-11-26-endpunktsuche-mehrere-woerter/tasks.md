## 1. Suche über mehrere Wörter

- [x] 1.1 In `app/src/areas/schedule/endpunkte.ts` `filtereEndpunktGruppen`
      auf wortweise UND-Verknüpfung über Klar- und Kurznamen umstellen,
      normalisiert wie bisher — verifiziert durch `endpunkte.test.ts`,
      `describe('Freitextsuche in der Endpunktauswahl')`, Fälle
      „Bachelor Technisch", umgekehrte Reihenfolge und ein nicht passendes Wort.
- [x] 1.2 Bestehende Suchtests (Kurzname, Klarname, leerer Suchtext, kein
      Treffer) bleiben unverändert grün.
