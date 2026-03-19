type ApiMutationEntry = {
  id: string;
  method: string;
  path: string;
};

export type ApiErrorState = {
  id: string;
  method: string;
  path: string;
  status: number;
  message: string;
  occurredAt: number;
};

type ApiRequestStateSnapshot = {
  pendingMutations: number;
  lastError: ApiErrorState | null;
};

const listeners = new Set<() => void>();

let pendingMutations: ApiMutationEntry[] = [];
let lastError: ApiErrorState | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeApiRequestState(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getApiRequestStateSnapshot(): ApiRequestStateSnapshot {
  return {
    pendingMutations: pendingMutations.length,
    lastError,
  };
}

export function beginApiMutation(method: string, path: string): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  lastError = null;
  pendingMutations = [...pendingMutations, { id, method, path }];
  emit();
  return id;
}

export function endApiMutation(id: string): void {
  const next = pendingMutations.filter((entry) => entry.id !== id);
  if (next.length === pendingMutations.length) {
    return;
  }

  pendingMutations = next;
  emit();
}

export function reportApiError(payload: Omit<ApiErrorState, 'id' | 'occurredAt'>): void {
  lastError = {
    ...payload,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    occurredAt: Date.now(),
  };
  emit();
}

export function clearApiError(): void {
  if (!lastError) {
    return;
  }

  lastError = null;
  emit();
}

export function resetApiRequestStateForTests(): void {
  pendingMutations = [];
  lastError = null;
  emit();
}
