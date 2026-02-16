import { useSyncExternalStore } from 'react';

let currentScale = 1;
const listeners = new Set<() => void>();

export function setAppFontScale(nextScale: number): void {
  if (currentScale === nextScale) {
    return;
  }

  currentScale = nextScale;
  listeners.forEach((listener) => listener());
}

export function getAppFontScale(): number {
  return currentScale;
}

export function subscribeAppFontScale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppFontScale(): number {
  return useSyncExternalStore(subscribeAppFontScale, getAppFontScale, getAppFontScale);
}
