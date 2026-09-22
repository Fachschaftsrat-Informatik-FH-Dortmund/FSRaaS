#!/usr/bin/env node
// Bereitet einen neuen Android-Testbuild vor (deploy/README.md Abschnitt 9.1):
// zeigt die aktuelle Version, fragt nach der neuen, erhöht versionCode,
// schreibt app.json und lässt expo prebuild den nativen Android-Ordner
// nachziehen — damit der "Android-Testbuild (Direktdownload)"-Workflow
// wegen der Monotonie-Prüfung des versionCode nicht fehlschlägt.

import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const appJsonPath = path.join(appDir, "app.json");

function readAppJson() {
  const raw = readFileSync(appJsonPath, "utf8");
  const parsed = JSON.parse(raw);
  return { raw, parsed };
}

function main() {
  const { raw, parsed } = readAppJson();
  const currentVersion = parsed.expo.version;
  const currentVersionCode = parsed.expo.android.versionCode;

  console.log(`Aktuelle Version:     ${currentVersion}`);
  console.log(`Aktueller versionCode: ${currentVersionCode}`);
  console.log("");

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  return rl
    .question(`Neue Version (z. B. 0.1.2), leer zum Abbrechen: `)
    .then(async (answer) => {
      const newVersion = answer.trim();
      if (!newVersion) {
        console.log("Abgebrochen — keine Änderung vorgenommen.");
        rl.close();
        return;
      }
      if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
        console.error(`"${newVersion}" sieht nicht wie eine Semver-Version (X.Y.Z) aus. Abgebrochen.`);
        rl.close();
        process.exitCode = 1;
        return;
      }
      if (newVersion === currentVersion) {
        console.error(`"${newVersion}" ist bereits die aktuelle Version. Abgebrochen.`);
        rl.close();
        process.exitCode = 1;
        return;
      }

      const newVersionCode = currentVersionCode + 1;
      const codeAnswer = await rl.question(
        `Neuer versionCode [${newVersionCode}], Enter zum Übernehmen oder eigenen Wert: `,
      );
      let finalVersionCode = newVersionCode;
      if (codeAnswer.trim()) {
        const parsedCode = Number.parseInt(codeAnswer.trim(), 10);
        if (!Number.isInteger(parsedCode) || parsedCode <= currentVersionCode) {
          console.error(
            `versionCode muss eine ganze Zahl größer als ${currentVersionCode} sein. Abgebrochen.`,
          );
          rl.close();
          process.exitCode = 1;
          return;
        }
        finalVersionCode = parsedCode;
      }

      rl.close();

      let updated = raw.replace(
        /"version"\s*:\s*"[^"]*"/,
        `"version": "${newVersion}"`,
      );
      updated = updated.replace(
        /"versionCode"\s*:\s*\d+/,
        `"versionCode": ${finalVersionCode}`,
      );
      writeFileSync(appJsonPath, updated);
      console.log(`\napp.json aktualisiert: version ${currentVersion} → ${newVersion}, versionCode ${currentVersionCode} → ${finalVersionCode}`);

      console.log("\nnpx expo prebuild --platform android ...");
      try {
        execFileSync("npx", ["expo", "prebuild", "--platform", "android"], {
          cwd: appDir,
          stdio: "inherit",
        });
      } catch (err) {
        console.error(
          "\nexpo prebuild ist fehlgeschlagen. app.json wurde bereits geändert — " +
            "android/app/build.gradle muss von Hand nachgezogen oder der Befehl erneut ausgeführt werden.",
        );
        process.exitCode = 1;
        return;
      }

      console.log("\nGeänderte Dateien:");
      try {
        execFileSync("git", ["status", "--short", "app.json", "android/app/build.gradle"], {
          cwd: appDir,
          stdio: "inherit",
        });
      } catch {
        // git-Status ist nur eine Hilfe, kein Abbruchgrund.
      }

      console.log(
        "\nNächste Schritte:\n" +
          "  1. Diff von app.json und android/app/build.gradle prüfen (nur version/versionCode/versionName sollten sich ändern).\n" +
          "  2. Beide Dateien gemeinsam committen.\n" +
          "  3. Push nach main.\n" +
          "  4. GitHub Actions → \"Android-Testbuild (Direktdownload)\" → Run workflow.",
      );
    });
}

main();
