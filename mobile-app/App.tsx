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

    if (typeof window !== 'undefined') {
      const onUnhandledRejection = (event: PromiseRejectionEvent) => {
        const reason = event.reason as { message?: string; stack?: string } | undefined;
        void reportSystemError({
          errorType: 'promise-unhandled-rejection',
          message: reason?.message ?? 'Unhandled promise rejection',
          stackTrace: reason?.stack,
        });
      };

      window.addEventListener('unhandledrejection', onUnhandledRejection);
      return () => window.removeEventListener('unhandledrejection', onUnhandledRejection);
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
