import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import { reportSystemError } from './src/features/observability/system-error-reporter';
import { AppNavigator } from './src/navigation/app-navigator';

export default function App() {
  useEffect(() => {
    const globalScope = globalThis as unknown as {
      ErrorUtils?: {
        getGlobalHandler?: () => ((error: Error, isFatal?: boolean) => void) | undefined;
        setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
      };
    };

    const errorUtils = globalScope.ErrorUtils;
    const defaultHandler = errorUtils?.getGlobalHandler?.();

    if (errorUtils?.setGlobalHandler) {
      errorUtils.setGlobalHandler((error, isFatal) => {
        void reportSystemError({
          errorType: isFatal ? 'js-fatal' : 'js-unhandled',
          message: error.message || 'Unknown JS error',
          stackTrace: error.stack,
        });

        if (defaultHandler) {
          defaultHandler(error, isFatal);
        }
      });
    }

    const browserWindow = globalThis as unknown as {
      addEventListener?: (type: string, listener: (event: { reason?: unknown }) => void) => void;
      removeEventListener?: (type: string, listener: (event: { reason?: unknown }) => void) => void;
    };

    if (typeof browserWindow.addEventListener === 'function' && typeof browserWindow.removeEventListener === 'function') {
      const addListener = browserWindow.addEventListener;
      const removeListener = browserWindow.removeEventListener;

      const onUnhandledRejection = (event: { reason?: unknown }) => {
        const reason = event.reason as { message?: string; stack?: string } | undefined;
        void reportSystemError({
          errorType: 'promise-unhandled-rejection',
          message: reason?.message ?? 'Unhandled promise rejection',
          stackTrace: reason?.stack,
        });
      };

      addListener('unhandledrejection', onUnhandledRejection);
      return () => removeListener('unhandledrejection', onUnhandledRejection);
    }

    return undefined;
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaView>
  );
}
