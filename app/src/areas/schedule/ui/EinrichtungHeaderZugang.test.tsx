import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { EinrichtungHeaderZugang } from './EinrichtungHeaderZugang';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

beforeEach(() => jest.clearAllMocks());

describe('Dauerhafter Zugang zur Einrichtung', () => {
  it('bietet ein jederzeit sichtbares Kopfzeilen-Symbol zur Einrichtung an', () => {
    render(
      <ThemeProvider>
        <EinrichtungHeaderZugang />
      </ThemeProvider>,
    );

    const zugang = screen.getByLabelText('Einrichtung bearbeiten');
    expect(zugang).toBeTruthy();
    fireEvent.press(zugang);
    expect(mockPush).toHaveBeenCalledWith('/einrichtung');
  });
});
