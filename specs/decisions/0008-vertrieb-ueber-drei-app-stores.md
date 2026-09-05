---
nummer: 0008
titel: Vertrieb über Apple App Store, Google Play Store und F-Droid
status: angenommen
datum: 2026-08-25
betrifft:
  - ../../openspec/specs/non-functional/spec.md
  - ../../openspec/specs/integrations/spec.md
  - ../../openspec/specs/architecture/spec.md
  - ../../openspec/specs/security-and-privacy/spec.md
  - ../../openspec/specs/settings/spec.md
  - ../../openspec/specs/canteen/spec.md
  - ../../openspec/specs/news/spec.md
  - 0001-react-native-als-plattform.md
---

# ADR 0008: Vertrieb über Apple App Store, Google Play Store und F-Droid

## Kontext

Die Alt-Apps waren ausschließlich über den Apple App Store bzw. den Google Play Store verteilt (siehe `product/legacy-inventory.md`). Der FSR FB4 möchte die Neuentwicklung zusätzlich über F-Droid anbieten: ein von Google/Apple unabhängiger, rein quelloffener Android-App-Katalog. F-Droid existiert ausschließlich für Android — es gibt kein F-Droid-Pendant für iOS. Die Entscheidung betrifft damit iOS gar nicht und beim Android-Build nur die Frage, über welche zusätzlichen Wege dieselbe APK verteilt wird.

F-Droids Aufnahmerichtlinie schließt Apps mit proprietären Tracking-, Analytics- oder Cloud-Messaging-Abhängigkeiten im Build grundsätzlich aus dem Hauptindex aus, ausdrücklich einschließlich Google Play Services und Firebase [Recherche: f-droid.org/en/docs/Inclusion_Policy, 2026-08-25]. Die für INT-005 (Push-Benachrichtigungen, `platform/integrations.md`) bislang vorgesehene Firebase Cloud Messaging (FCM) ist eine solche proprietäre Abhängigkeit und verhindert in der bisher spezifizierten Form die Aufnahme in F-Droid. Zusätzlich verlangt F-Droid, dass der gesamte App-Quellcode unter einer von der Open Source Initiative anerkannten Lizenz steht.

React-Native-Apps lassen sich grundsätzlich für F-Droid bauen, benötigen aber eine zusätzliche Build-Konfiguration: eine `subdir`-Direktive auf den Android-Unterordner, eine gepinnte Node.js-Version und eine Deklaration, dass die über npm/Yarn bezogenen JavaScript-Abhängigkeiten FLOSS-kompatibel sind [Recherche: f-droid.org/en/2020/10/14/adding-react-native-app-to-f-droid.html, 2026-08-25]. F-Droid baut jede App zusätzlich selbst reproduzierbar aus dem öffentlichen Quellcode, ohne Zugriff auf projektinterne Signaturschlüssel oder Geheimnisse [Recherche: f-droid.org/docs/Reproducible_Builds, 2026-08-25].

Als offener, dezentraler Ersatz für FCM auf Android existiert UnifiedPush: ein vom F-Droid-Team mitentwickeltes Push-Protokoll, bei dem die App sich bei einem auf dem Gerät installierten „Distributor" registriert. Auf Geräten mit Google Play Services kann dafür ein FCM-basierter Distributor dienen, auf reinen F-Droid-/GrapheneOS-Geräten ein quelloffener Distributor wie ntfy — dieselbe App-Implementierung deckt damit beide Android-Vertriebswege ab [Recherche: unifiedpush.org, f-droid.org/en/2022/12/18/unifiedpush.html, 2026-08-25]. UnifiedPush ist primär für Android entwickelt; auf iOS gibt es dafür keine relevante Verbreitung, was hier aber unerheblich ist, weil iOS von der F-Droid-Frage ohnehin nicht betroffen ist und Apple für Hintergrund-Push ausschließlich den eigenen Dienst APNs zulässt — Firebase dient auf iOS technisch ohnehin nur als Bridge zu APNs, nicht als eigenständiger Zustellweg.

## Entscheidung

Die App wird über drei Vertriebswege veröffentlicht: Apple App Store (iOS), Google Play Store (Android) und F-Droid (Android, zusätzlich zum Play Store). Der gesamte App-Quellcode steht unter der MIT-Lizenz. Für Android wird die Push-Zustellung (INT-005) einheitlich über UnifiedPush realisiert — statt bislang FCM — und deckt damit sowohl den Play-Store- als auch den F-Droid-Vertriebsweg mit einer einzigen Implementierung ab. Der iOS-Build bleibt unverändert bei Firebase Cloud Messaging als Zustellweg zu Apples APNs, da F-Droid für iOS nicht existiert und keine Notwendigkeit besteht, den bestehenden iOS-Weg zu ändern.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| Nur App Store + Play Store (Status quo der Alt-Apps) | keiner | kein zusätzlicher Aufwand | keine quelloffene, von Google/Apple unabhängige Vertriebsoption; widerspricht dem Wunsch des FSR FB4 nach F-Droid-Vertrieb |
| App Store + Play Store + F-Droid, F-Droid-Variante ohne Push | mittel — kein neuer Push-Mechanismus, aber zwei Android-Build-Varianten (mit/ohne Push) zu pflegen | geringerer Umsetzungsaufwand als UnifiedPush | Funktionsunterschied zwischen den Android-Vertriebswegen (F-Droid-Nutzerinnen erhalten keine Push-Benachrichtigungen für News); F-Droid kennzeichnet den Push-Verzicht zusätzlich nicht automatisch positiv, das fehlende Feature bleibt einfach bestehen |
| App Store + Play Store + F-Droid, Push app-weit gestrichen | gering | einfachste Umsetzung, ein einziger Push-loser Weg für alle | schwächste Funktionalität, betrifft auch Play-Store- und App-Store-Nutzerinnen ohne technische Notwendigkeit |
| **App Store + Play Store + F-Droid, UnifiedPush auf Android statt FCM (gewählt)** | hoch — neuer Registrierungs-/Zustellmechanismus für Android in Backend und Client, F-Droid-taugliche Build-Pipeline für den React-Native-Android-Build | einheitlicher Funktionsumfang auf allen drei Vertriebswegen, kein Feature-Verzicht für F-Droid-Nutzerinnen, vermeidet einseitige Abhängigkeit von Google-Infrastruktur, passt zum quelloffenen Ethos eines von Studierenden getragenen Projekts | höherer initialer Umsetzungsaufwand; Backend muss künftig zwei Zustellwege bedienen (FCM-Themen-Abonnement für iOS, UnifiedPush-Endpunkte für Android) statt eines einzigen |

## Konsequenzen

- `platform/integrations.md`, INT-005: Beschreibung wechselt von reinem FCM-Themen-Abonnement zu einem nach Plattform unterschiedenen Zustellweg (Android: UnifiedPush; iOS: FCM/APNs unverändert).
- `platform/architecture.md`, Datenfluss-Tabelle „Push-Abo": Zielsystem wird für Android als UnifiedPush-Distributor statt FCM benannt.
- `platform/non-functional.md`: neuer Abschnitt „Store-Veröffentlichung" mit Anforderungen zu Lizenz, F-Droid-Baubarkeit, Ziel-API-Stufe, Google-Play-Testauflage und Versionsnummerierung.
- `features/settings/spec.md` SET-F-080 (Übersicht verwendeter Open-Source-Bibliotheken mit Lizenzhinweisen) und SET-F-090 (Einstiegspunkt zur Kontolöschung) erfüllen bereits zentrale Store-Anforderungen (Apples Vorgabe zur In-App-Kontolöschung, F-Droids Lizenztransparenz) ohne inhaltliche Änderung — hier nur zur Einordnung vermerkt.
- `features/canteen/spec.md` und `features/news/spec.md`: Erwähnungen von „FCM" im Zusammenhang mit INT-005 werden durch „UnifiedPush" ersetzt, ohne inhaltliche Änderung der jeweiligen Anforderung.
- Sobald ein Code-Repository für die Neuentwicklung existiert: `LICENSE`-Datei (MIT) im Root, F-Droid-Metadata-Recipe (`fdroiddata`-Merge-Request) mit `subdir`-Direktive und gepinnter Node-Version, getrennte CI-Pipelines je Vertriebsweg.
- `decisions/0001-react-native-als-plattform.md` bleibt inhaltlich unverändert; die dortige Technologiewahl ist mit F-Droid-Vertrieb vereinbar (Abschnitt „Kontext" oben), verlangt aber die zusätzliche Build-Sorgfalt aus Abschnitt „Kontext".

## Offene Punkte

- Konkreter Fan-out-Mechanismus im Backend: ein UnifiedPush-Aufruf je registriertem Android-Endpunkt statt eines einzelnen FCM-Themen-Aufrufs — Gegenstand von `platform/backend-and-api.md` bei Umsetzung, dort bislang nicht spezifiziert.
- Genaue F-Droid-Build-Konfiguration (Subdir-Direktive, gepinnte Node-Version, Deklaration der JavaScript-Abhängigkeiten als FLOSS-kompatibel) — Gegenstand der CI/Build-Pipeline bei Umsetzung, nicht dieser Spec.
- Standard-UnifiedPush-Distributor für Android-Geräte ohne von der Nutzerin selbst installierten Distributor (z. B. automatischer Rückgriff auf einen FCM-Distributor, sofern Google Play Services vorhanden) — technische Ausgestaltung bei Umsetzung von INT-005.
- Governance des MIT-lizenzierten öffentlichen Repositories (wer nimmt externe Beiträge an, wie wird Vandalismus/Missbrauch von Pull Requests gehandhabt) — organisatorische Frage des FSR FB4, nicht technischer Teil dieser Entscheidung.
