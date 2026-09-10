const { withAppBuildGradle } = require('@expo/config-plugins');

// Testbuild-Direktdownload (openspec/changes/android-testbuild-download):
// `expo prebuild` erzeugt `android/` bei jedem Lauf komplett neu — ein
// manueller Handeingriff in android/app/build.gradle ueberlebt das nicht
// (gleiches Problem wie in withNotifeeMaven.js). Dieser Config-Plugin traegt
// die release-signingConfig deshalb bei jedem Prebuild erneut ein: eigener
// Upload-Keystore statt Debug-Signatur, Werte ausschliesslich aus
// Umgebungsvariablen (CI setzt sie aus GitHub-Secrets, deploy/README.md).
// Ein fehlendes Secret faellt nie still auf den Debug-Keystore zurueck,
// sondern bricht gradle.taskGraph.whenReady fuer jeden Release-Task ab.

const MARKER = 'ANDROID_RELEASE_KEYSTORE_PATH';

const RELEASE_SIGNING_CONFIG = [
  '        release {',
  '            // Testbuild-Direktdownload (openspec/changes/android-testbuild-download):',
  '            // Werte kommen ausschliesslich aus Umgebungsvariablen, die der CI-Workflow',
  '            // aus GitHub-Secrets setzt. Nie im Repo, nie im Debug-Keystore signieren.',
  '            def releaseKeystorePath = System.getenv("ANDROID_RELEASE_KEYSTORE_PATH")',
  '            if (releaseKeystorePath) {',
  '                storeFile file(releaseKeystorePath)',
  '            }',
  '            storePassword System.getenv("ANDROID_RELEASE_STORE_PASSWORD")',
  '            keyAlias System.getenv("ANDROID_RELEASE_KEY_ALIAS")',
  '            keyPassword System.getenv("ANDROID_RELEASE_KEY_PASSWORD")',
  '        }',
].join('\n');

const RELEASE_SIGNING_CHECK = [
  '',
  '// Testbuild-Direktdownload: bricht nur ab, wenn tatsaechlich ein Release-Task',
  '// laeuft (assembleDebug bleibt ohne die vier ANDROID_RELEASE_*-Variablen',
  '// weiterhin nutzbar) — kein stilles Zurueckfallen auf den Debug-Keystore.',
  'gradle.taskGraph.whenReady { taskGraph ->',
  '    def buildsRelease = taskGraph.allTasks.any { it.name.contains("Release") }',
  '    if (buildsRelease) {',
  '        def required = [',
  '            "ANDROID_RELEASE_KEYSTORE_PATH",',
  '            "ANDROID_RELEASE_STORE_PASSWORD",',
  '            "ANDROID_RELEASE_KEY_ALIAS",',
  '            "ANDROID_RELEASE_KEY_PASSWORD",',
  '        ]',
  '        def missing = required.findAll { !System.getenv(it) }',
  '        if (!missing.isEmpty()) {',
  '            throw new GradleException(',
  '                "Release-Signing: fehlende Umgebungsvariable(n) ${missing.join(\', \')}. " +',
  '                "Alle vier ANDROID_RELEASE_*-Variablen muessen gesetzt sein, sonst kein Release-Build " +',
  '                "(siehe deploy/README.md)."',
  '            )',
  '        }',
  '    }',
  '}',
  '',
].join('\n');

module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('withAndroidReleaseSigning: android/app/build.gradle ist nicht in Groovy');
    }
    if (cfg.modResults.contents.includes(MARKER)) {
      return cfg;
    }

    let contents = cfg.modResults.contents;

    const withReleaseSigningConfig = contents.replace(
      /(signingConfigs\s*\{\n\s*debug\s*\{[\s\S]*?\n\s*\}\n)(\s*\})/,
      `$1${RELEASE_SIGNING_CONFIG}\n$2`,
    );
    if (withReleaseSigningConfig === contents) {
      throw new Error('withAndroidReleaseSigning: signingConfigs-Block nicht gefunden');
    }
    contents = withReleaseSigningConfig;

    const withReleaseBuildType = contents.replace(
      /(release\s*\{\n)(?:\s*\/\/ Caution![\s\S]*?\n\s*\/\/ see https:\/\/reactnative\.dev\/docs\/signed-apk-android\.\n)?(\s*)signingConfig signingConfigs\.debug/,
      '$1$2signingConfig signingConfigs.release',
    );
    if (withReleaseBuildType === contents) {
      throw new Error('withAndroidReleaseSigning: buildTypes.release.signingConfig nicht gefunden');
    }
    contents = withReleaseBuildType;

    contents = `${contents.replace(/\n+$/, '\n')}${RELEASE_SIGNING_CHECK}`;

    cfg.modResults.contents = contents;
    return cfg;
  });
};
