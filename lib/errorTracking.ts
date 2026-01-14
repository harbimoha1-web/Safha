// Error Tracking Utility
// Currently logs to console - upgrade to Sentry by:
// 1. npx expo install @sentry/react-native
// 2. Uncomment Sentry code below
// 3. Add SENTRY_DSN to environment

// import * as Sentry from '@sentry/react-native';
import { createLogger } from './debug';

const log = createLogger('ErrorTracking');
const IS_PRODUCTION = process.env.EXPO_PUBLIC_IS_PRODUCTION === 'true';

/**
 * Initialize error tracking
 * Call this in app/_layout.tsx on startup
 */
export function initializeErrorTracking(): void {
  if (!IS_PRODUCTION) {
    log.info('Development mode - logging to console');
    return;
  }

  // Uncomment when Sentry is installed:
  // const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
  // if (!SENTRY_DSN) {
  //   log.warn('SENTRY_DSN not configured');
  //   return;
  // }
  //
  // Sentry.init({
  //   dsn: SENTRY_DSN,
  //   environment: IS_PRODUCTION ? 'production' : 'development',
  //   tracesSampleRate: 0.2,
  //   enableAutoSessionTracking: true,
  //   attachStacktrace: true,
  // });

  log.info('Initialized');
}

/**
 * Capture an exception
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>
): void {
  // Log to console in all environments
  log.error('Captured exception:', error);
  if (context) {
    log.error('Context:', context);
  }

  // Uncomment when Sentry is installed:
  // if (IS_PRODUCTION) {
  //   Sentry.captureException(error, {
  //     extra: context,
  //   });
  // }
}

/**
 * Capture a message (for non-error events)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
): void {
  const logMethod = level === 'error' ? log.error : level === 'warning' ? log.warn : log.info;
  logMethod(`[${level.toUpperCase()}] ${message}`, context || '');

  // Uncomment when Sentry is installed:
  // if (IS_PRODUCTION) {
  //   Sentry.captureMessage(message, {
  //     level: level as Sentry.SeverityLevel,
  //     extra: context,
  //   });
  // }
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string } | null): void {
  if (user) {
    log.debug('User set', { id: user.id });
  } else {
    log.debug('User cleared');
  }

  // Uncomment when Sentry is installed:
  // Sentry.setUser(user);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
): void {
  if (!IS_PRODUCTION) {
    log.debug(`[Breadcrumb:${category}] ${message}`, data || '');
  }

  // Uncomment when Sentry is installed:
  // Sentry.addBreadcrumb({
  //   category,
  //   message,
  //   data,
  //   level: 'info',
  // });
}

/**
 * Wrap a component with error boundary
 * Usage: export default withErrorBoundary(MyComponent);
 */
// Uncomment when Sentry is installed:
// export const withErrorBoundary = Sentry.withErrorBoundary;

// Placeholder error boundary for now
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  _options?: { fallback?: React.ReactNode }
): React.ComponentType<P> {
  // For now, just return the component unchanged
  // When Sentry is installed, use Sentry.withErrorBoundary
  return Component;
}
