import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { AppButton } from '@/ui/primitives';
import { SchreibwarteschlangeStatus } from '@/ui/SchreibwarteschlangeStatus';
import { BESETZT_ARTEN, useBesetztMeldung } from '../besetztMeldung';
import { normalisiereKennung } from '../uebersicht';
import { uhrzeit } from '../zeitraum';
import { Zeile } from './bausteine';

// Bedienung und Anzeige der Besetzt-Meldungen (Change `besetzt-meldungen`).
// Die Meldung ergänzt den offiziellen Belegungszustand, ersetzt ihn nie
// (Requirement „Besetzt-Meldung zusätzlich in der Übersicht anzeigen").
// Bedeutung nicht allein über Farbe: Symbol und Text (Capability `ux-and-theming`).

/**
 * Zusatzzeile „N× als besetzt gemeldet" (Requirements „Anzahl der
 * Besetzt-Meldungen anzeigen", „Besetzt-Meldung zusätzlich in der Übersicht
 * anzeigen"); ohne gültige Meldung nichts.
 */
export function BesetztHinweis({ anzahl }: { anzahl: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  if (anzahl <= 0) return null;
  return (
    <Text style={[styles.hinweis, { color: colors.text }]}>
      {`${t('raum.besetzt.symbol')} ${t('raum.besetzt.gemeldet', { count: anzahl })}`}
    </Text>
  );
}

/**
 * Melden und Zurückziehen für einen Raum (Requirements „Raum als besetzt
 * melden", „Besetzt-Meldung zurückziehen"). Funktioniert auch offline: Die
 * Meldung wird eingereiht und mit Wiederverbindung übertragen. `anzahl` fehlt
 * offline, weil die Übersicht dann nicht verfügbar ist.
 */
export function BesetztMeldungBaustein({ roomId, anzahl }: { roomId: string; anzahl?: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { eigene, ausstehend, melden, zurueckziehen } = useBesetztMeldung(roomId);

  let stand: string | null = null;
  if (eigene) stand = t('raum.besetzt.eigeneGemeldet', { zeit: uhrzeit(new Date(eigene.gueltigBis)) });
  else if (ausstehend?.zustand === 'fehlgeschlagen') stand = t('raum.besetzt.eigeneFehlgeschlagen');
  else if (ausstehend) stand = t('raum.besetzt.eigeneAusstehend');

  return (
    <View style={[styles.kasten, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      {anzahl !== undefined ? (
        <Text style={[styles.hinweis, { color: colors.text }]}>
          {anzahl > 0
            ? `${t('raum.besetzt.symbol')} ${t('raum.besetzt.gemeldet', { count: anzahl })}`
            : t('raum.besetzt.keine')}
        </Text>
      ) : null}
      <Zeile text={t('raum.besetzt.erklaerung')} gedaempft />
      {stand ? <Zeile text={stand} /> : null}
      {eigene || ausstehend ? (
        <AppButton variant="secondary" label={t('raum.besetzt.zurueckziehen')} onPress={zurueckziehen} />
      ) : (
        <AppButton label={t('raum.besetzt.melden')} onPress={melden} />
      )}
    </View>
  );
}

/** Status der Besetzt-Meldungen in der Warteschlange, in Worten des Raum-Bereichs. */
export function BesetztWarteschlange() {
  const { t } = useTranslation();
  return (
    <SchreibwarteschlangeStatus
      arten={BESETZT_ARTEN}
      beschreibe={(e) => {
        const { roomId } = e.auftrag.nutzdaten as { roomId: string };
        return e.art === BESETZT_ARTEN[0]
          ? t('raum.besetzt.warteschlangeMelden', { roomId })
          : t('raum.besetzt.warteschlangeZurueckziehen', { roomId });
      }}
    />
  );
}

/**
 * Melden per Raumkennung, wenn der Bereich offline nicht verfügbar ist (Capability
 * `room-finder`, „UI-Flows & Zustände": Ausnahme beim Melden als „besetzt").
 */
export function BesetztMeldenPerKennung() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [eingabe, setEingabe] = useState('');
  const roomId = normalisiereKennung(eingabe);

  return (
    <View style={styles.offline}>
      <Text style={[styles.titel, { color: colors.text }]} accessibilityRole="header">
        {t('raum.besetzt.offlineTitel')}
      </Text>
      <TextInput
        value={eingabe}
        onChangeText={setEingabe}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder={t('raum.uebersichtSicht.suchePlatzhalter')}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={t('raum.besetzt.kennungLabel')}
        style={[styles.eingabe, { color: colors.text, borderColor: colors.border }]}
      />
      {roomId ? <BesetztMeldungBaustein roomId={roomId} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kasten: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 8, marginBottom: 12 },
  hinweis: { fontSize: 15, fontWeight: '600' },
  offline: { gap: 8, paddingTop: 12 },
  titel: { fontSize: 17, fontWeight: '700' },
  eingabe: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 16 },
});
