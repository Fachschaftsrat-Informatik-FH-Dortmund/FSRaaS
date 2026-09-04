import { render } from '@testing-library/react-native';

import { symbole, tabIcon } from './tabIcons';

// Die @expo/vector-icons-Attrappe aus jest.setup.js gibt den Symbolnamen als
// Text aus, dadurch per getByText prüfbar.

describe('UX-F-150 Symbole der Tab-Leiste', () => {
  const tabs = ['index', 'canteen', 'news', 'rooms', 'more'];

  it('definiert für jeden der fünf Tabs ein aktives und ein inaktives Symbol', () => {
    expect(Object.keys(symbole).sort()).toEqual([...tabs].sort());
    for (const name of tabs) {
      expect(symbole[name]!.aktiv).toEqual(expect.any(String));
      expect(symbole[name]!.inaktiv).toEqual(expect.any(String));
    }
  });

  it.each(tabs)('zeigt für Tab "%s" im aktiven Zustand die gefüllte Variante', (name) => {
    const TabIcon = tabIcon(name);
    const { getByText } = render(<TabIcon color="#000" size={24} focused />);
    expect(getByText(symbole[name]!.aktiv)).toBeTruthy();
  });

  it.each(tabs)('zeigt für Tab "%s" im inaktiven Zustand die "-outline"-Variante', (name) => {
    const TabIcon = tabIcon(name);
    const { getByText } = render(<TabIcon color="#000" size={24} focused={false} />);
    expect(getByText(symbole[name]!.inaktiv)).toBeTruthy();
  });
});
