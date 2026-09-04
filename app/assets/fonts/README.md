# Icon-Schrift

`ionicons.ttf` ist eine unveränderte Kopie aus dem Paket `@expo/vector-icons`
(`node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf`),
MIT-lizenziert. Sie liegt hier im Repo, damit `expo-font` (Config-Plugin, siehe `app.json`)
sie fest in den nativen Build einbettet — kein Nachladen über Metro oder das Netz zur Laufzeit
mehr nötig (`specs/platform/ux-and-theming.md`, zu UX-F-150).

**Der Dateiname muss kleingeschrieben `ionicons.ttf` bleiben.** `@expo/vector-icons`
registriert die Schriftfamilie als `ionicons` (siehe `createIconSet(glyphMap, 'ionicons', font)`
in `Ionicons.js`); Android leitet den Schriftfamiliennamen einer eingebetteten Schrift aus dem
Dateinamen ab. Mit `Ionicons.ttf` (Großbuchstabe) würde die App unter dem Namen `Ionicons`
suchen, `Font.isLoaded('ionicons')` bliebe `false` und die Symbole blieben leer.

Bei einem Versions-Upgrade von `@expo/vector-icons`: Datei aus dem neuen Paket erneut hierher
kopieren (Dateiname beibehalten) und `npx expo prebuild --platform android` erneut laufen
lassen, damit die Kopie unter `android/app/src/main/assets/fonts/` aktualisiert wird.
