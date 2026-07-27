/**
 * Simple in-process pub/sub so POST /gps and DELETE can notify SSE clients.
 */
const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publish(event) {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Ignore broken listeners; they will be cleaned on next disconnect
    }
  }
}

export function getListenerCount() {
  return listeners.size;
}
