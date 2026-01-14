// Debug Logging Utility
// Production-safe logging that suppresses output in production builds
// Usage: import { debug } from '@/lib/debug';
//        debug.log('message');    // Only shows in __DEV__
//        debug.warn('warning');   // Only shows in __DEV__
//        debug.error('error');    // Shows in all environments (use sparingly)

declare const __DEV__: boolean;

const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

// No-op function for production
const noop = (..._args: unknown[]): void => {};

/**
 * Debug logging utilities
 * - log, info, warn, debug: Only output in development
 * - error: Always outputs (for critical errors only)
 * - group/groupEnd: For organized logging in development
 */
export const debug = {
  /** Development-only log */
  log: IS_DEV ? console.log.bind(console) : noop,

  /** Development-only info */
  info: IS_DEV ? console.info.bind(console) : noop,

  /** Development-only warning */
  warn: IS_DEV ? console.warn.bind(console) : noop,

  /** Development-only debug */
  debug: IS_DEV ? console.debug.bind(console) : noop,

  /** Always outputs - use for critical errors only */
  error: console.error.bind(console),

  /** Development-only grouping */
  group: IS_DEV ? console.group.bind(console) : noop,
  groupEnd: IS_DEV ? console.groupEnd.bind(console) : noop,
  groupCollapsed: IS_DEV ? console.groupCollapsed.bind(console) : noop,

  /** Development-only table */
  table: IS_DEV ? console.table.bind(console) : noop,

  /** Development-only time tracking */
  time: IS_DEV ? console.time.bind(console) : noop,
  timeEnd: IS_DEV ? console.timeEnd.bind(console) : noop,

  /** Check if development mode */
  isDev: IS_DEV,
};

/**
 * Tagged logger for specific modules
 * Usage: const log = createLogger('RSS');
 *        log.info('Fetching sources...');
 *        // Output: [RSS] Fetching sources...
 */
export function createLogger(tag: string) {
  const prefix = `[${tag}]`;

  return {
    log: (...args: unknown[]) => debug.log(prefix, ...args),
    info: (...args: unknown[]) => debug.info(prefix, ...args),
    warn: (...args: unknown[]) => debug.warn(prefix, ...args),
    debug: (...args: unknown[]) => debug.debug(prefix, ...args),
    error: (...args: unknown[]) => debug.error(prefix, ...args),
  };
}

export default debug;
