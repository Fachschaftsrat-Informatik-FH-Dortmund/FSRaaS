import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { AppButton } from '@/ui/primitives';
import { useAnsichtEinstellungen } from '../ansichtEinstellungen';
import { useEinrichtung } from '../einrichtung';
import { useScheduleEntries } from '../planStore';

// Requirement „Ansichts- und Verwaltungsblatt in der Kopfzeile": ein einziges
// Kopfzeilen-Element bündelt die Ansichtsschalter, den Zugang zur Einrichtung
// und die beiden Löschaktionen. Ersetzt den vormaligen, direkt navigierenden
// Stift (`EinrichtungHeaderZugang`) und den Schalterkasten unter dem Plan
// (Requirement, entfällt: Schalterkasten unter dem Plan).
export function VerwaltungsblattZugang() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [offen, setOffen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('schedule.verwaltungZugang')}
        onPress={() => setOffen(true)}
        style={styles.zugang}
        hitSlop={8}
      >
        <Ionicons name="settings-outline" size={22} color={colors.accent} />
      </Pressable>
      <VerwaltungsBlatt sichtbar={offen} onSchliessen={() => setOffen(false)} />
    </>
  );
}

type Loeschaktion = 'leeren' | 'zuruecksetzen' | null;

function VerwaltungsBlatt({ sichtbar, onSchliessen }: { sichtbar: boolean; onSchliessen: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { einstellungen, loaded, toggleZeitachse, toggleSprungZuHeute } = useAnsichtEinstellungen();
  const { clear: planLeeren } = useScheduleEntries();
  const { clear: einrichtungZuruecksetzen } = useEinrichtung();
  const [aktion, setAktion] = useState<Loeschaktion>(null);

  function schliessenUndZuruecksetzen() {
    setAktion(null);
    onSchliessen();
  }

  return (
    <Modal
      visible={sichtbar}
      animationType="slide"
      transparent
      onRequestClose={schliessenUndZuruecksetzen}
    >
      <Pressable style={styles.hintergrund} onPress={schliessenUndZuruecksetzen} accessibilityLabel={t('schedule.verwaltungSchliessen')} />
      <View style={[styles.blatt, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {aktion === null ? (
          <>
            <Text style={[styles.titel, { color: colors.text }]}>{t('schedule.verwaltungTitel')}</Text>

            <SchalterZeile
              label={t('schedule.filterZeitachse')}
              wert={loaded ? einstellungen.zeitachse : true}
              onChange={toggleZeitachse}
            />
            <SchalterZeile
              label={t('schedule.verwaltungSprungZuHeute')}
              wert={loaded ? einstellungen.sprungZuHeute : true}
              onChange={toggleSprungZuHeute}
            />

            <AppButton
              variant="secondary"
              label={t('schedule.einrichtungBearbeiten')}
              onPress={() => {
                schliessenUndZuruecksetzen();
                router.push('/einrichtung');
              }}
            />
            <AppButton variant="secondary" label={t('schedule.planLeeren')} onPress={() => setAktion('leeren')} />
            <AppButton
              variant="secondary"
              label={t('schedule.planZuruecksetzen')}
              onPress={() => setAktion('zuruecksetzen')}
            />

            <AppButton label={t('schedule.verwaltungSchliessen')} onPress={schliessenUndZuruecksetzen} />
          </>
        ) : (
          <LoeschBestaetigung
            aktion={aktion}
            onAbbrechen={() => setAktion(null)}
            onBestaetigt={(eigeneMitentfernen) => {
              if (aktion === 'leeren') {
                planLeeren(eigeneMitentfernen);
              } else {
                planLeeren(eigeneMitentfernen);
                einrichtungZuruecksetzen();
              }
              schliessenUndZuruecksetzen();
            }}
          />
        )}
      </View>
    </Modal>
  );
}

/**
 * Requirements „Nutzeraktion „Stundenplan leeren"" und „Nutzeraktion
 * „Stundenplan zurücksetzen"": beide fragen vor der Ausführung, ob die selbst
 * angelegten Termine mitentfernt werden sollen — vorbelegt auf „nein".
 */
function LoeschBestaetigung({
  aktion,
  onAbbrechen,
  onBestaetigt,
}: {
  aktion: 'leeren' | 'zuruecksetzen';
  onAbbrechen: () => void;
  onBestaetigt: (eigeneMitentfernen: boolean) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [eigeneMitentfernen, setEigeneMitentfernen] = useState(false);

  const istLeeren = aktion === 'leeren';

  return (
    <>
      <Text style={[styles.titel, { color: colors.text }]}>
        {istLeeren ? t('schedule.planLeeren') : t('schedule.planZuruecksetzen')}
      </Text>
      <Text style={{ color: colors.textMuted }}>
        {istLeeren ? t('schedule.planLeerenFrage') : t('schedule.planZuruecksetzenFrage')}
      </Text>
      <SchalterZeile
        label={t('schedule.planLeerenEigeneMitentfernen')}
        wert={eigeneMitentfernen}
        onChange={() => setEigeneMitentfernen((v) => !v)}
      />
      <AppButton
        variant="destructive"
        label={istLeeren ? t('schedule.planLeerenBestaetigen') : t('schedule.planZuruecksetzenBestaetigen')}
        onPress={() => onBestaetigt(eigeneMitentfernen)}
      />
      <AppButton variant="secondary" label={t('schedule.abbrechen')} onPress={onAbbrechen} />
    </>
  );
}

function SchalterZeile({ label, wert, onChange }: { label: string; wert: boolean; onChange: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.schalterZeile}>
      <Text style={[styles.schalterText, { color: colors.text }]}>{label}</Text>
      <Switch accessibilityLabel={label} value={wert} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  zugang: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  hintergrund: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  blatt: { borderTopWidth: 1, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, gap: 12 },
  titel: { fontSize: 17, fontWeight: '700' },
  schalterZeile: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 12 },
  schalterText: { flex: 1 },
});
