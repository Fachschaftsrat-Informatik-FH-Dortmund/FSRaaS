import { useTranslation } from 'react-i18next';

import { MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';

/**
 * Platzhalter für einen Bereich, dessen Navigation bereits steht, dessen Inhalt
 * aber einem späteren Roadmap-Schritt gehört (Ergebnis von Schritt 2: „Bereiche
 * sind leer aber erreichbar"). Nutzt dieselbe MessageView wie alle anderen
 * ganzflächigen Zustände.
 */
export function ComingSoon() {
  const { t } = useTranslation();
  return (
    <Screen>
      <MessageView
        symbol="🚧"
        title={t('areas.comingSoonTitle')}
        body={t('areas.comingSoonBody')}
      />
    </Screen>
  );
}
