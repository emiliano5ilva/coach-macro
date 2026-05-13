export const TTL = {
  PROFILE:     60 * 60 * 1000,
  WORKOUT:     30 * 60 * 1000,
  FOOD_LOG:     5 * 60 * 1000,
  PROGRAMS:    24 * 60 * 60 * 1000,
  EXERCISES:    7 * 24 * 60 * 60 * 1000,
  FOOD_SEARCH:  60 * 60 * 1000,
  MACROS:       5 * 60 * 1000,
  PROGRESS:    15 * 60 * 1000,
  RECIPES:     30 * 60 * 1000,
  WATER:        2 * 60 * 1000,
};

const PREFIX = 'cc_';

export const cache = {
  get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return null;
      const { data, ts, ttl } = JSON.parse(raw);
      if (Date.now() - ts > ttl) { localStorage.removeItem(PREFIX + key); return null; }
      return data;
    } catch { return null; }
  },

  set(key, data, ttl = TTL.MACROS) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify({ data, ts: Date.now(), ttl }));
    } catch {}
  },

  del(key) {
    try { localStorage.removeItem(PREFIX + key); } catch {}
  },

  delPattern(prefix) {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX + prefix))
        .forEach(k => localStorage.removeItem(k));
    } catch {}
  },

  clear() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch {}
  },
};

export async function cachedFetch(key, fetchFn, ttl = TTL.MACROS) {
  const cached = cache.get(key);
  if (cached !== null) return { data: cached, fromCache: true };
  const data = await fetchFn();
  if (data !== null && data !== undefined) cache.set(key, data, ttl);
  return { data, fromCache: false };
}
