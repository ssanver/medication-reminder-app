import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('performance-debug-store', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('reports api metrics in lower environments', async () => {
    vi.stubEnv('EXPO_PUBLIC_API_BASE_URL', 'http://127.0.0.1:5199');
    const store = await import('./performance-debug-store');

    store.reportApiMetric({
      method: 'GET',
      path: '/api/dose-events/scheduled-doses',
      durationMs: 123,
      status: 200,
    });

    expect(store.getPerformanceDebugSnapshot()).toMatchObject({
      visible: true,
      title: 'GET /api/dose-events/scheduled-doses',
      detail: '123 ms | HTTP 200',
    });
  });

  it('does not expose metrics for production-like urls', async () => {
    vi.stubEnv('EXPO_PUBLIC_API_BASE_URL', 'https://pillmind.example.com');
    const store = await import('./performance-debug-store');

    store.reportUiMetric({
      title: 'Dose Action',
      detail: 'API: 500 ms | Loading close: 900 ms',
    });

    expect(store.getPerformanceDebugSnapshot().visible).toBe(false);
  });
});
