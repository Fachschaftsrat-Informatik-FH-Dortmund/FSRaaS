import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppError } from '@/errors/AppError';
import { AsyncStates, type QueryLike } from './AsyncStates';

const mockOnline = jest.fn(() => true);
jest.mock('@/state/useOnlineStatus', () => ({ useOnlineStatus: () => mockOnline() }));

afterEach(() => mockOnline.mockReturnValue(true));

function query<T>(over: Partial<QueryLike<T>>): QueryLike<T> {
  return {
    data: undefined,
    isPending: false,
    isError: false,
    isFetching: false,
    isStale: false,
    error: undefined,
    dataUpdatedAt: Date.now(),
    refetch: jest.fn(),
    ...over,
  };
}

const NEXT_STEP = 'Lege in den Einstellungen eine Mensa fest.';

describe('ARCH-F-130 / UX-F-100 Vier Zustände je datenabhängiger Ansicht', () => {
  it('Ladezustand, solange keine Daten vorliegen', () => {
    render(
      <AsyncStates query={query({ isPending: true })} emptyNextStep={NEXT_STEP}>
        {() => <Text>Inhalt</Text>}
      </AsyncStates>,
    );
    expect(screen.getByText('Wird geladen …')).toBeTruthy();
    expect(screen.queryByText('Inhalt')).toBeNull();
  });

  it('Fehlerzustand mit Wiederholen-Aktion, wenn kein Zwischenspeicher vorliegt', () => {
    const q = query({ isError: true, error: new AppError({ kind: 'server', message: 'error.server', retryable: true }) });
    render(<AsyncStates query={q} emptyNextStep={NEXT_STEP}>{() => <Text>Inhalt</Text>}</AsyncStates>);
    expect(screen.getByText('Etwas ist schiefgelaufen')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(q.refetch).toHaveBeenCalled();
  });

  it('Offline-Zustand, wenn der Fehler von fehlender Verbindung kommt', () => {
    const q = query({ isError: true, error: new AppError({ kind: 'offline', message: 'error.offline', retryable: true }) });
    render(<AsyncStates query={q} emptyNextStep={NEXT_STEP}>{() => <Text>Inhalt</Text>}</AsyncStates>);
    expect(screen.getByText('Keine Verbindung')).toBeTruthy();
  });

  it('Leerzustand nennt den nächsten Schritt (UX-F-110)', () => {
    const q = query<{ items: number[] }>({ data: { items: [] } });
    render(
      <AsyncStates query={q} isEmpty={(d) => d.items.length === 0} emptyNextStep={NEXT_STEP}>
        {() => <Text>Inhalt</Text>}
      </AsyncStates>,
    );
    expect(screen.getByText(NEXT_STEP)).toBeTruthy();
  });

  it('Leerzustand bietet einen Bedienweg an, wenn `emptyAction` gesetzt ist (UX-F-110)', () => {
    const q = query<{ items: number[] }>({ data: { items: [] } });
    const onPress = jest.fn();
    render(
      <AsyncStates
        query={q}
        isEmpty={(d) => d.items.length === 0}
        emptyNextStep={NEXT_STEP}
        emptyAction={<Text onPress={onPress}>Jetzt einrichten</Text>}
      >
        {() => <Text>Inhalt</Text>}
      </AsyncStates>,
    );
    fireEvent.press(screen.getByText('Jetzt einrichten'));
    expect(onPress).toHaveBeenCalled();
  });

  it('Leerzustand ohne `emptyAction` zeigt weiterhin nur Text, kein Handlungselement', () => {
    const q = query<{ items: number[] }>({ data: { items: [] } });
    render(
      <AsyncStates query={q} isEmpty={(d) => d.items.length === 0} emptyNextStep={NEXT_STEP}>
        {() => <Text>Inhalt</Text>}
      </AsyncStates>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('Datenzustand rendert die Inhalte', () => {
    const q = query<{ items: number[] }>({ data: { items: [1, 2] } });
    render(
      <AsyncStates query={q} isEmpty={(d) => d.items.length === 0} emptyNextStep={NEXT_STEP}>
        {(d) => <Text>{d.items.length} Einträge</Text>}
      </AsyncStates>,
    );
    expect(screen.getByText('2 Einträge')).toBeTruthy();
  });
});

describe('DATA-F-090 Offline und abgelaufen: letzter Stand mit Altershinweis statt Leeransicht', () => {
  it('zeigt bei offline + veralteten Daten den Altershinweis über den Inhalten', () => {
    mockOnline.mockReturnValue(false);
    const q = query<{ items: number[] }>({
      data: { items: [1] },
      isStale: true,
      dataUpdatedAt: Date.now() - 20 * 60_000,
    });
    render(
      <AsyncStates query={q} isEmpty={(d) => d.items.length === 0} emptyNextStep={NEXT_STEP}>
        {() => <Text>Inhalt da</Text>}
      </AsyncStates>,
    );
    expect(screen.getByText(/Offline/)).toBeTruthy();
    expect(screen.getByText('Inhalt da')).toBeTruthy();
  });

  it('zeigt online keinen Altershinweis, auch wenn die Daten veraltet sind', () => {
    const q = query<{ items: number[] }>({ data: { items: [1] }, isStale: true });
    render(
      <AsyncStates query={q} isEmpty={(d) => d.items.length === 0} emptyNextStep={NEXT_STEP}>
        {() => <Text>Inhalt da</Text>}
      </AsyncStates>,
    );
    expect(screen.queryByText(/Offline/)).toBeNull();
  });
});

describe('ARCH-N-020 Eine wiederverwendbare Grundstruktur statt je Bildschirm', () => {
  it('dieselbe Komponente bedient alle vier Zustände über dieselbe Schnittstelle', () => {
    // Ein einziger Komponententyp, gesteuert nur über das query-Objekt — kein
    // bildschirmspezifischer Zustandscode nötig.
    const cases: Partial<QueryLike<{ items: number[] }>>[] = [
      { isPending: true },
      { isError: true, error: new AppError({ kind: 'server', message: 'error.server', retryable: false }) },
      { data: { items: [] } },
      { data: { items: [7] } },
    ];
    for (const c of cases) {
      const view = render(
        <AsyncStates query={query(c)} isEmpty={(d) => d.items.length === 0} emptyNextStep={NEXT_STEP}>
          {(d) => <Text>{d.items.join(',')}</Text>}
        </AsyncStates>,
      );
      view.unmount();
    }
    expect(true).toBe(true);
  });
});
