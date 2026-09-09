import { ScrollView, Text } from 'react-native';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { AnkerListe } from './AnkerListe';

afterEach(cleanup);

const renderListe = () =>
  render(
    <ThemeProvider>
      <AnkerListe
        chips={[
          { id: 'a', titel: 'Mensa A' },
          { id: 'b', titel: 'Mensa B' },
          { id: 'c', titel: 'Mensa C', deaktiviert: true },
        ]}
        abschnitte={[
          { id: 'a', inhalt: <Text>Inhalt A</Text> },
          { id: 'b', inhalt: <Text>Inhalt B</Text> },
        ]}
      />
    </ThemeProvider>,
  );

describe('MENSA-F-016 Chip-Leiste mit Hervorhebung', () => {
  it('hebt beim Öffnen den ersten Abschnitt hervor', () => {
    renderListe();
    expect(screen.getByLabelText('Mensa A').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('Mensa B').props.accessibilityState.selected).toBe(false);
  });

  it('stellt einen Chip ohne Abschnitt als nicht auswählbar dar (MENSA-F-295)', () => {
    renderListe();
    const zu = screen.getByLabelText('Mensa C (an diesem Tag geschlossen)');
    expect(zu.props.accessibilityState.disabled).toBe(true);
  });
});

describe('MENSA-F-017 Antippen scrollt zum Abschnitt und hebt den Chip hervor', () => {
  it('markiert den angetippten Chip als aktiv', () => {
    renderListe();
    fireEvent.press(screen.getByLabelText('Mensa B'));
    expect(screen.getByLabelText('Mensa B').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('Mensa A').props.accessibilityState.selected).toBe(false);
  });
});

describe('MENSA-F-019 Scrollen setzt den hervorgehobenen Chip', () => {
  it('wechselt zur Mensa, deren Abschnitt oben im sichtbaren Bereich steht', () => {
    renderListe();
    const [scrollA, scrollB] = screen.UNSAFE_getAllByType(ScrollView);
    // Abschnitts-Layout setzen: A bei y=0, B bei y=800.
    fireEvent(screen.getByText('Inhalt A').parent!, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 800 } },
    });
    fireEvent(screen.getByText('Inhalt B').parent!, 'layout', {
      nativeEvent: { layout: { x: 0, y: 800, width: 300, height: 800 } },
    });
    // In den B-Abschnitt scrollen.
    fireEvent.scroll((scrollB ?? scrollA)!, {
      nativeEvent: { contentOffset: { x: 0, y: 850 }, contentSize: {}, layoutMeasurement: {} },
    });
    expect(screen.getByLabelText('Mensa B').props.accessibilityState.selected).toBe(true);
  });
});
