import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { __resetEinblendungsStandForTest, __setzeEinblendungsStandForTest } from '../einblendungsStand';
import { EinblendungChip } from './EinblendungChip';

function zeige() {
  render(
    <ThemeProvider>
      <EinblendungChip />
    </ThemeProvider>,
  );
}

beforeEach(() => __resetEinblendungsStandForTest());

describe('Hinweis auf aktive Einblendung in der Kopfzeile', () => {
  it('Einblendung aktiv: zeigt einen Chip „Alternativen"', () => {
    __setzeEinblendungsStandForTest({ alternativen: true });
    zeige();

    expect(screen.getByText('Alternativen')).toBeTruthy();
    expect(screen.getByLabelText('Alternativen eingeblendet. Antippen blendet sie aus.')).toBeTruthy();
  });

  it('nennt die Einblendung nicht gewählter Veranstaltungen und beide zusammen', () => {
    __setzeEinblendungsStandForTest({ alle: true });
    zeige();
    expect(screen.getByText('Alle Veranstaltungen')).toBeTruthy();

    act(() => __setzeEinblendungsStandForTest({ alternativen: true, alle: true }));
    expect(screen.getByText('Alternativen + alle')).toBeTruthy();
  });

  it('Keine Einblendung aktiv: zeigt keinen Chip', () => {
    zeige();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('Chip antippen: schaltet alle Einblendungen ab, der Chip verschwindet', () => {
    __setzeEinblendungsStandForTest({ alternativen: true, alle: true });
    zeige();

    fireEvent.press(screen.getByRole('button'));
    expect(screen.queryByRole('button')).toBeNull();
  });
});
