import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';

import { logError } from '@/errors/AppError';
import { readLanguagePreference, resolveLanguage } from '@/i18n/languagePreference';
import type { Treffer } from './backgroundCheck';

// MENSA-F-100: rein lokale Gerätebenachrichtigung über @notifee/react-native
// (kein Firebase, F-Droid-tauglich — NFR-N-170). Kein Netz, kein Push. Die
// Benachrichtigung entsteht ausschließlich auf dem Gerät.

const CHANNEL_ID = 'lieblingsgerichte';

// Der Hintergrund-Abgleich läuft ggf. ohne initialisiertes i18n — daher eine
// kleine eigene Textzuordnung statt der Kataloge.
const TEXT = {
  de: {
    channel: 'Lieblingsgerichte',
    einesHeute: (g: string, m: string) => `${g} heute in ${m}`,
    mehrereHeute: (n: number) => `${n} Lieblingsgerichte heute`,
    zeile: (g: string, m: string) => `${g} — ${m}`,
  },
  en: {
    channel: 'Favourite dishes',
    einesHeute: (g: string, m: string) => `${g} today at ${m}`,
    mehrereHeute: (n: number) => `${n} favourite dishes today`,
    zeile: (g: string, m: string) => `${g} — ${m}`,
  },
} as const;

async function texte() {
  const sprache = resolveLanguage(await readLanguagePreference());
  return TEXT[sprache] ?? TEXT.de;
}

function erlaubt(status: AuthorizationStatus): boolean {
  return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
}

/** SEC-F-080: Berechtigung erst im Moment des tatsächlichen Bedarfs anfragen. */
export async function benachrichtigungBerechtigungAnfragen(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    return erlaubt(settings.authorizationStatus);
  } catch (error) {
    logError('notifications.requestPermission', error);
    return false;
  }
}

export async function benachrichtigungErlaubt(): Promise<boolean> {
  try {
    const settings = await notifee.getNotificationSettings();
    return erlaubt(settings.authorizationStatus);
  } catch (error) {
    logError('notifications.getSettings', error);
    return false;
  }
}

async function kanalSicherstellen(name: string): Promise<void> {
  await notifee.createChannel({ id: CHANNEL_ID, name, importance: AndroidImportance.DEFAULT });
}

/** Zeigt eine einzelne Sammelbenachrichtigung für alle heutigen Treffer. */
export async function zeigeLieblingsgerichtHinweis(treffer: Treffer[]): Promise<void> {
  if (treffer.length === 0) return;
  const t = await texte();
  await kanalSicherstellen(t.channel);

  const titel =
    treffer.length === 1
      ? t.einesHeute(treffer[0]!.bezeichnung, treffer[0]!.mensaName)
      : t.mehrereHeute(treffer.length);

  await notifee.displayNotification({
    title: titel,
    body: treffer.map((x) => t.zeile(x.bezeichnung, x.mensaName)).join('\n'),
    android: { channelId: CHANNEL_ID, pressAction: { id: 'default' } },
  });
}
