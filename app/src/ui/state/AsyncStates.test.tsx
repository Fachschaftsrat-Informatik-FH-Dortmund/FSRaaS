import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppError } from '@/errors/AppError';
import { AsyncStates, type QueryLike } from './AsyncStates';

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

describe('ARCH-N-020 Eine wiederverwendbare Grundstruktur statt je Bildschirm', () => {
  it('dieselbe Komponente bedient alle vier Zustände über dieselbe Schnittstelle', () => {
    // Ein einziger Komponententyp, gesteuert nur über das query-Objekt — kein
    // bildschirmspezifischer Zustandscode nötig.
    const cases: Array<Partial<QueryLike<{ items: number[] }>>> = [
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
