import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContext {
  apiKey?: string;
  sessionId?: string;
}

// Create AsyncLocalStorage instance to track request context
export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Get the current request's API key
 */
export function getCurrentApiKey(): string | undefined {
  const context = requestContextStorage.getStore();
  return context?.apiKey || process.env.GOOGLE_MAPS_API_KEY;
}

/**
 * Run a function with a specific request context
 */
export function runWithContext<T>(context: RequestContext, fn: () => T | Promise<T>): T | Promise<T> {
  return requestContextStorage.run(context, fn);
}