export type PerformanceDebugSnapshot = {
  visible: boolean;
  title: string;
  detail: string;
  updatedAt: number;
};

type ApiMetricInput = {
  method: string;
  path: string;
  durationMs: number;
  status: number;
};

type UiMetricInput = {
  title: string;
  detail: string;
};

const listeners = new Set<() => void>();
let snapshot: PerformanceDebugSnapshot = {
  visible: false,
  title: '',
  detail: '',
  updatedAt: 0,
};

function emit() {
  listeners.forEach((listener) => listener());
}

function setSnapshot(next: PerformanceDebugSnapshot) {
  snapshot = next;
  emit();
}

function isDevRuntime(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true;
}

export function isLowerEnvironment(): boolean {
  const baseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').toLowerCase();
  return (
    isDevRuntime()
    || baseUrl.includes('localhost')
    || baseUrl.includes('127.0.0.1')
    || baseUrl.includes('stempurl.com')
  );
}

function toCompactPath(path: string): string {
  const [route] = path.split('?');
  return route.length > 42 ? `${route.slice(0, 42)}...` : route;
}

export function subscribePerformanceDebug(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPerformanceDebugSnapshot(): PerformanceDebugSnapshot {
  return snapshot;
}

export function reportApiMetric({ method, path, durationMs, status }: ApiMetricInput): void {
  if (!isLowerEnvironment()) {
    return;
  }

  setSnapshot({
    visible: true,
    title: `${method.toUpperCase()} ${toCompactPath(path)}`,
    detail: `${durationMs} ms | HTTP ${status}`,
    updatedAt: Date.now(),
  });
}

export function reportUiMetric({ title, detail }: UiMetricInput): void {
  if (!isLowerEnvironment()) {
    return;
  }

  setSnapshot({
    visible: true,
    title,
    detail,
    updatedAt: Date.now(),
  });
}
