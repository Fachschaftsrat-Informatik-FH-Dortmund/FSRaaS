import { getLocales } from 'expo-localization';

import { resolveLanguage, isLanguagePreference } from './languagePreference';

const mockLocales = getLocales as jest.Mock;

afterEach(() => {
  mockLocales.mockReturnValue([{ languageCode: 'de', languageTag: 'de-DE' }]);
});

describe('SET-F-110 Ohne getroffene Wahl gilt die Systemsprache', () => {
  it('löst „system" zur Sprache des Geräts auf', () => {
    mockLocales.mockReturnValue([{ languageCode: 'en', languageTag: 'en-US' }]);
    expect(resolveLanguage('system')).toBe('en');
  });

  it('fällt auf Deutsch zurück, wenn das Gerät keine unterstützte Sprache meldet', () => {
    mockLocales.mockReturnValue([{ languageCode: 'fr', languageTag: 'fr-FR' }]);
    expect(resolveLanguage('system')).toBe('de');
  });
});

describe('SET-F-100 Getroffene Sprachwahl gilt unabhängig vom Gerät', () => {
  it('gibt die gewählte Sprache zurück, auch entgegen der Systemsprache', () => {
    mockLocales.mockReturnValue([{ languageCode: 'de', languageTag: 'de-DE' }]);
    expect(resolveLanguage('en')).toBe('en');
    mockLocales.mockReturnValue([{ languageCode: 'en', languageTag: 'en-US' }]);
    expect(resolveLanguage('de')).toBe('de');
  });

  it('erkennt gültige Wahlwerte', () => {
    expect(isLanguagePreference('system')).toBe(true);
    expect(isLanguagePreference('de')).toBe(true);
    expect(isLanguagePreference('en')).toBe(true);
    expect(isLanguagePreference('fr')).toBe(false);
  });
});
