import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Loads data on mount and whenever the filter keys change.
 *
 * Every list screen needs the same four things — data, loading, error and a
 * reload — so they are implemented once here rather than copied into ten pages.
 *
 * The abort flag matters: without it, switching filters quickly leaves the
 * slower earlier response to overwrite the newer one, and the table briefly
 * shows data for a filter the user has already moved away from.
 */
export function useApiQuery(loader, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [reloadToken, setReloadToken] = useState(0);
  const requestRef = useRef(0);

  const reload = useCallback(() => setReloadToken((value) => value + 1), []);

  useEffect(() => {
    if (!immediate) return undefined;

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    let cancelled = false;
    setLoading(true);
    setError(null);

    loader()
      .then((result) => {
        if (cancelled || requestRef.current !== requestId) return;
        setData(result);
      })
      .catch((caught) => {
        if (cancelled || requestRef.current !== requestId) return;
        setError(caught);
        setData(null);
      })
      .finally(() => {
        if (cancelled || requestRef.current !== requestId) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken]);

  return { data, error, loading, reload, setData };
}

/**
 * Wraps a write operation with its own pending and error state, so a form does
 * not have to track them separately.
 */
export function useMutation(action) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (...args) => {
      setPending(true);
      setError(null);
      try {
        return await action(...args);
      } catch (caught) {
        setError(caught);
        throw caught;
      } finally {
        setPending(false);
      }
    },
    [action]
  );

  return { run, pending, error, setError };
}

/** Delays a rapidly changing value, so typing in a filter does not fire a
 *  request per keystroke. */
export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
