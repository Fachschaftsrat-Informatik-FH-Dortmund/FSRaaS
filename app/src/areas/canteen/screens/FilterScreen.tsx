import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { Screen } from '@/ui/Screen';
import { AsyncStates } from '@/ui/state/AsyncStates';
import { useMensaVerzeichnisse, type Schluesselwert, type Verzeichnisse } from '../api';
import { allergenGruppen, gruppeVollstaendig } from '../allergenGruppen';
import { useDietPreference } from '../dietPreference';
import { useIntolerances } from '../intolerances';
import { preisText } from '../preise';
import { usePriceGroup } from '../priceGroup';
import { PREIS_MAX, PREIS_MIN, usePriceLimit } from '../priceLimit';

// MENSA-F-170 bis F-275: das Filtermenü des Mensaplans. Abschnitte:
//   1. Preis (MENSA-F-235) — Höchstpreis-Steller, verglichen gegen die
//      Preisgruppe der Einstellungen.
//   2. Lebensstil (MENSA-F-250) — nur Gerichte zeigen, die ALLE gewählten
//      Kennzeichnungen tragen.
//   3. Ausschließen (MENSA-F-260) — Gerichte mit einer der Kennzeichnungen
//      verbergen, dazu der Ausschluss nach CO₂-Klasse (Requirement „Ausschluss
//      nach Kennzeichnung").
//   4./5. Unverträglichkeiten (MENSA-F-180), seit der Ablösung von INT-015 in
//      zwei Abschnitte getrennt — Allergene und Zusatzstoffe —, weil die Quelle
//      beide getrennt führt (Requirement „Getrennte Abschnitte für Allergene und
//      Zusatzstoffe im Filtermenü"). Die Auswahl bleibt eine einzige Liste von
//      Schlüsseln; eine vor der Trennung festgelegte Auswahl gilt unverändert
//      weiter und erscheint in dem Abschnitt, dem die Quelle sie zuordnet.
// Am Seitenende der Hinweis auf die ausschließlich lokale Verarbeitung
// (MENSA-F-175). Nichts davon verlässt das Gerät (MENSA-F-215/F-275).

function SchalterZeile({
  bezeichnung,
  wert,
  onChange,
  sammel = false,
}: {
  bezeichnung: string;
  wert: boolean;
  onChange: (wert: boolean) => void;
  sammel?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.zeile, { borderBottomColor: colors.border }]}>
      <Text style={[styles.name, sammel && styles.sammelName, { color: colors.text }]}>
        {bezeichnung}
      </Text>
      <Switch value={wert} onValueChange={onChange} accessibilityLabel={bezeichnung} />
    </View>
  );
}

function KennzeichnungsAbschnitt({
  titel,
  eintraege,
  aktiv,
  onToggle,
  sammelschalter = [],
  kennung,
}: {
  titel: string;
  eintraege: Schluesselwert[];
  aktiv: (id: string) => boolean;
  onToggle: (id: string) => void;
  /** Vorangestellte Schalter, die mehrere Einträge gemeinsam setzen. */
  sammelschalter?: { schluessel: string; bezeichnung: string; wert: boolean; onChange: (wert: boolean) => void }[];
  /** Kennung des Abschnitts, damit ein Test seine Einträge ihm zuordnen kann. */
  kennung?: string;
}) {
  const { colors } = useTheme();
  if (eintraege.length === 0) return null;
  return (
    <View style={styles.abschnitt} testID={kennung}>
      <Text style={[styles.abschnittTitel, { color: colors.textMuted }]}>{titel}</Text>
      {sammelschalter.map((sch) => (
        <SchalterZeile
          key={`sammel:${sch.schluessel}`}
          bezeichnung={sch.bezeichnung}
          wert={sch.wert}
          onChange={sch.onChange}
          sammel
        />
      ))}
      {eintraege.map((e) => (
        <SchalterZeile
          key={e.id}
          bezeichnung={e.bezeichnung}
          wert={aktiv(e.id)}
          onChange={() => onToggle(e.id)}
        />
      ))}
    </View>
  );
}

function PreisAbschnitt() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { group } = usePriceGroup();
  const { limit, erhoehen, senken } = usePriceLimit();

  const wert = limit == null ? t('mensa.preisKeinLimit') : t('mensa.preisMax', { preis: preisText(limit) });

  const StellKnopf = ({
    zeichen,
    label,
    onPress,
    aus,
  }: {
    zeichen: string;
    label: string;
    onPress: () => void;
    aus: boolean;
  }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: aus }}
      disabled={aus}
      onPress={onPress}
      style={[styles.stellKnopf, { borderColor: colors.border }]}
    >
      <Text style={[styles.stellZeichen, { color: aus ? colors.textMuted : colors.text }]}>
        {zeichen}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.abschnitt}>
      <Text style={[styles.abschnittTitel, { color: colors.textMuted }]}>{t('mensa.preisTitel')}</Text>
      <View style={styles.preisZeile}>
        <StellKnopf
          zeichen="−"
          label={t('mensa.preisSenken')}
          onPress={senken}
          aus={limit == null || limit <= PREIS_MIN}
        />
        <Text style={[styles.preisWert, { color: colors.text }]}>{wert}</Text>
        <StellKnopf
          zeichen="+"
          label={t('mensa.preisErhoehen')}
          onPress={erhoehen}
          aus={limit != null && limit >= PREIS_MAX}
        />
      </View>
      <Text style={[styles.preisHinweis, { color: colors.textMuted }]}>
        {t('mensa.preisGruppeHinweis', { gruppe: t(`priceGroup.${group}`) })}
      </Text>
    </View>
  );
}

function UnvertraeglichkeitsAbschnitte({ verzeichnisse }: { verzeichnisse: Verzeichnisse }) {
  const { t } = useTranslation();
  const intolerances = useIntolerances();

  // Die Quelle führt Allergene getrennt von den Zusatzstoffen; `zusatzstoffe`
  // trägt beide gemeinsam (ADR 0016). Der Zusatzstoff-Abschnitt ist deshalb die
  // Differenz. Liefert ein Backend-Stand vor der Trennung keine `allergene`,
  // bleibt es bei einem gemeinsamen Abschnitt unter dem bisherigen Titel —
  // Allergene stillschweigend als Zusatzstoffe auszuweisen wäre eine falsche
  // Aussage, kein Rückfall.
  const allergene = verzeichnisse.allergene ?? [];
  const getrennt = allergene.length > 0;
  const allergenIds = new Set(allergene.map((a) => a.id));
  const zusatzstoffe = getrennt
    ? verzeichnisse.zusatzstoffe.filter((z) => !allergenIds.has(z.id))
    : verzeichnisse.zusatzstoffe;

  const aktiv = (id: string) => intolerances.codes.includes(id);

  // Sammelschalter je Allergengruppe, die die Quelle in Unterschlüssel gliedert
  // (Requirement „Sammelschalter für zusammengehörige Allergengruppen“). Der
  // Klartext kommt aus der Übersetzung, nicht aus dem Code (NFR-F-115); für
  // einen von der Quelle neu aufgenommenen Stamm greift die allgemeine Fassung,
  // statt den Schalter zu verschweigen.
  const sammelschalter = allergenGruppen(allergene).map((gruppe) => ({
    schluessel: gruppe.stamm,
    bezeichnung: t([`mensa.allergenGruppe.${gruppe.stamm}`, 'mensa.allergenGruppeAllgemein'], {
      stamm: gruppe.stamm,
    }),
    wert: gruppeVollstaendig(gruppe, intolerances.codes),
    onChange: (wert: boolean) => intolerances.setzeMehrere(gruppe.unterschluessel, wert),
  }));

  return (
    <View>
      <KennzeichnungsAbschnitt
        titel={t('mensa.allergeneTitel')}
        kennung="abschnitt-allergene"
        eintraege={allergene}
        aktiv={aktiv}
        onToggle={intolerances.toggle}
        sammelschalter={sammelschalter}
      />
      <KennzeichnungsAbschnitt
        titel={getrennt ? t('mensa.zusatzstoffeTitel') : t('mensa.unvertraeglichkeitenTitel')}
        kennung="abschnitt-zusatzstoffe"
        eintraege={zusatzstoffe}
        aktiv={aktiv}
        onToggle={intolerances.toggle}
      />
    </View>
  );
}

export function FilterScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const query = useMensaVerzeichnisse();
  const diet = useDietPreference();

  return (
    <Screen scroll tight hideScrollbar>
      <PreisAbschnitt />

      <AsyncStates<Verzeichnisse>
        query={query}
        isEmpty={(d) => d.zusatzstoffe.length === 0 && d.kennzeichnungen.length === 0}
        emptyTitle={t('mensa.unvertraeglichkeitenLeerTitel')}
        emptyNextStep={t('mensa.unvertraeglichkeitenLeerHinweis')}
      >
        {(d) => (
          <View>
            <KennzeichnungsAbschnitt
              titel={t('mensa.lebensstilTitel')}
              eintraege={d.kennzeichnungen}
              aktiv={(id) => diet.prefs.nurZeigen.includes(id)}
              onToggle={diet.toggleNurZeigen}
            />
            <KennzeichnungsAbschnitt
              titel={t('mensa.ausschliessenTitel')}
              eintraege={d.kennzeichnungen}
              aktiv={(id) => diet.prefs.ausschluss.includes(id)}
              onToggle={diet.toggleAusschluss}
            />
            {/* CO₂-Klassen stehen in einem eigenen Feld des Gerichts, nicht unter
                seinen Kennzeichnungen — deshalb ein eigener Ausschluss-Abschnitt
                (Requirement „Ausschluss nach Kennzeichnung“). */}
            <KennzeichnungsAbschnitt
              titel={t('mensa.co2AusschliessenTitel')}
              eintraege={d.co2Klassen ?? []}
              aktiv={(id) => diet.prefs.co2Ausschluss.includes(id)}
              onToggle={diet.toggleCo2Ausschluss}
            />
            <UnvertraeglichkeitsAbschnitte verzeichnisse={d} />
          </View>
        )}
      </AsyncStates>

      {/* „Alle Filter entfernen" liegt als headerRight oben rechts neben dem
          Titel (app/(tabs)/canteen/_layout.tsx → FilterResetAction). */}

      {/* MENSA-F-175: Hinweis auf die ausschließlich lokale Verarbeitung, am Seitenende. */}
      <View style={[styles.hinweis, { backgroundColor: colors.banner }]}>
        <Text style={[styles.hinweisText, { color: colors.onBanner }]}>
          {t('mensa.unvertraeglichkeitenLokalHinweis')}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hinweis: { padding: 10, borderRadius: 8 },
  hinweisText: { fontSize: 13 },
  abschnitt: { marginBottom: 16 },
  abschnittTitel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  zeile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  name: { fontSize: 16, flex: 1 },
  sammelName: { fontWeight: '700' },
  preisZeile: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 48 },
  preisWert: { fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center' },
  preisHinweis: { fontSize: 12, marginTop: 4 },
  stellKnopf: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stellZeichen: { fontSize: 22, fontWeight: '600' },
});
