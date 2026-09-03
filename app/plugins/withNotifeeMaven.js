const { withProjectBuildGradle } = require('@expo/config-plugins');

// @notifee/react-native liefert sein Android-Artefakt (app.notifee:core) als
// lokales Maven-Repo im npm-Paket — es gibt keine Netz-Quelle dafuer, was fuer
// den F-Droid-tauglichen Build (NFR-N-170) gerade richtig ist. Notifees eigenes
// build.gradle registriert dieses Repo per `rootProject.allprojects`. Mit Gradles
// configure-on-demand (von `expo run:android` gesetzt) wird `:app` jedoch bereits
// konfiguriert, bevor `:notifee_react-native` das Repo nachtraegt — die
// Aufloesung von `app.notifee:core` schlaegt dann fehl. Dieser Config-Plugin
// traegt das Repo direkt in android/build.gradle ein (ueberlebt `expo prebuild`).

const REPO_SNIPPET = [
  '        maven {',
  '            // @notifee/react-native — lokales Android-Artefakt (kein Firebase, NFR-N-170)',
  "            url(new File([\"node\", \"--print\", \"require.resolve('@notifee/react-native/package.json')\"].execute(null, rootDir).text.trim(), \"../android/libs\"))",
  '        }',
].join('\n');

module.exports = function withNotifeeMaven(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('withNotifeeMaven: android/build.gradle ist nicht in Groovy');
    }
    if (cfg.modResults.contents.includes("@notifee/react-native/package.json")) {
      return cfg;
    }
    const patched = cfg.modResults.contents.replace(
      /(allprojects\s*\{\s*repositories\s*\{)/,
      `$1\n${REPO_SNIPPET}`,
    );
    if (patched === cfg.modResults.contents) {
      throw new Error('withNotifeeMaven: allprojects.repositories-Block nicht gefunden');
    }
    cfg.modResults.contents = patched;
    return cfg;
  });
};
