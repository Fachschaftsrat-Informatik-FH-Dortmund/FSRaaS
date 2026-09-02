import { AccessibilityInfo } from 'react-native';
import { renderHook, waitFor } from '@testing-library/react-native';

import { motionAnimation, useReducedMotion } from './reducedMotion';

describe('UX-N-030 Systemeinstellung „Bewegung reduzieren" respektieren', () => {
  it('schaltet Übergangsanimationen ab, wenn reduziert', () => {
    expect(motionAnimation(true)).toBe('none');
  });

  it('lässt reguläre Übergänge zu, wenn nicht reduziert', () => {
    expect(motionAnimation(false)).toBe('default');
  });

  it('liest die Systemeinstellung und meldet sie', async () => {
    (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValueOnce(true);
    const { result } = renderHook(() => useReducedMotion());
    await waitFor(() => expect(result.current).toBe(true));
  });
});
