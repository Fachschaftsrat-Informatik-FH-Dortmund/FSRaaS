import { cleanup, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { BlaetterSymbol } from './BlaetterSymbol';

afterEach(cleanup);

describe('Einheitliche Blätter-Symbole', () => {
  it('zeigt für beide Richtungen ein Symbol aus dem Symbolsystem der App', () => {
    render(
      <ThemeProvider>
        <BlaetterSymbol richtung="zurueck" />
        <BlaetterSymbol richtung="vor" />
      </ThemeProvider>,
    );
    expect(screen.getByText('chevron-back')).toBeTruthy();
    expect(screen.getByText('chevron-forward')).toBeTruthy();
  });

  it('blendet ein nicht auslösbares Blätter-Element ab, ohne das Symbol zu wechseln', () => {
    render(
      <ThemeProvider>
        <BlaetterSymbol richtung="zurueck" />
        <BlaetterSymbol richtung="zurueck" aus />
      </ThemeProvider>,
    );
    const [aktiv, aus] = screen.getAllByText('chevron-back');
    expect(aus!.props.color).not.toEqual(aktiv!.props.color);
  });
});
