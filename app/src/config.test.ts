// Zielsysteme ausschließlich über Konfiguration (SEC-F-050) und ausnahmslos über
// TLS (SEC-N-030). config.ts wertet die Konfiguration beim Laden aus (hier über
// expo.extra aus app.json, im Build zusätzlich über EXPO_PUBLIC_*) und bricht bei
// einer nicht-https-URL ab.

type ConfigModule = typeof import('./config');

const mockExtra: { apiBaseUrl?: string; netTimeoutMs?: number } = {};

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: mockExtra };
    },
  },
}));

function loadConfig(extra: { apiBaseUrl?: string; netTimeoutMs?: number }): ConfigModule {
  mockExtra.apiBaseUrl = extra.apiBaseUrl;
  mockExtra.netTimeoutMs = extra.netTimeoutMs;
  let mod!: ConfigModule;
  jest.isolateModules(() => {
    mod = jest.requireActual<ConfigModule>('./config');
  });
  return mod;
}

describe('SEC-F-050 Zielsysteme ausschließlich über Konfiguration', () => {
  it('liest die Backend-URL und die Zeitgrenze aus der Konfiguration', () => {
    const { config } = loadConfig({ apiBaseUrl: 'https://config.example/v9', netTimeoutMs: 4321 });
    expect(config.apiBaseUrl).toBe('https://config.example/v9');
    expect(config.netTimeoutMs).toBe(4321);
  });

  it('hält auch im Standardfall keine interne IP-Adresse im Quellcode', () => {
    const { config } = loadConfig({});
    expect(config.apiBaseUrl).toMatch(/^https:\/\//);
    expect(config.apiBaseUrl).not.toMatch(/\d{1,3}(\.\d{1,3}){3}/);
  });
});

describe('SEC-N-030 Alle Netzabrufe ausschließlich über TLS', () => {
  it('weist eine nicht-https Backend-URL beim Laden der Konfiguration ab', () => {
    expect(() => loadConfig({ apiBaseUrl: 'http://ws.inf.fh-dortmund.de/' })).toThrow(/https/);
  });

  it('akzeptiert dieselbe Adresse über https', () => {
    const { config } = loadConfig({ apiBaseUrl: 'https://ws.inf.fh-dortmund.de/' });
    expect(config.apiBaseUrl).toBe('https://ws.inf.fh-dortmund.de/');
  });
});
