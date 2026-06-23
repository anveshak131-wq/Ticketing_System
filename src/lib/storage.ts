type Listener = () => void;

export function createStore<T>(key: string, getDefault: () => T) {
  const listeners = new Set<Listener>();

  function read(): T {
    if (typeof window === "undefined") return getDefault();
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : getDefault();
    } catch {
      return getDefault();
    }
  }

  function write(value: T) {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getSnapshot(): T {
    return read();
  }

  function getServerSnapshot(): T {
    return getDefault();
  }

  return { read, write, subscribe, getSnapshot, getServerSnapshot };
}
