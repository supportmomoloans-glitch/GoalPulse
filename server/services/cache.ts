interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlSeconds: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private pendingPromises = new Map<string, Promise<unknown>>();
  public stats = {
    hits: 0,
    misses: 0,
    fetches: 0,
    errors: 0,
  };

  public get<T>(key: string): { data: T; isStale: boolean; cachedAt: number } | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const ageSeconds = (Date.now() - entry.timestamp) / 1000;
    const isStale = ageSeconds > entry.ttlSeconds;

    this.stats.hits++;
    return {
      data: entry.data,
      isStale,
      cachedAt: entry.timestamp,
    };
  }

  public set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlSeconds,
    });
  }

  public async getOrFetch<T>(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
  ): Promise<{ data: T; isStale: boolean; cachedAt: number }> {
    const cached = this.get<T>(key);
    if (cached && !cached.isStale) {
      return cached;
    }

    // Request deduplication for concurrent identical queries
    if (this.pendingPromises.has(key)) {
      try {
        const data = (await this.pendingPromises.get(key)) as T;
        return { data, isStale: false, cachedAt: Date.now() };
      } catch (err) {
        // If pending promise failed, fall back to cached if exists
        if (cached) {
          return { ...cached, isStale: true };
        }
        throw err;
      }
    }

    const fetchPromise = (async () => {
      this.stats.fetches++;
      try {
        const result = await fetchFn();
        this.set(key, result, ttlSeconds);
        return result;
      } catch (err) {
        this.stats.errors++;
        // If error but we have stale cache, return it instead of exploding
        if (cached) {
          return cached.data;
        }
        throw err;
      } finally {
        this.pendingPromises.delete(key);
      }
    })();

    this.pendingPromises.set(key, fetchPromise);

    try {
      const data = await fetchPromise;
      return { data, isStale: false, cachedAt: Date.now() };
    } catch (err) {
      if (cached) {
        return { ...cached, isStale: true };
      }
      throw err;
    }
  }

  public clear(): void {
    this.cache.clear();
    this.pendingPromises.clear();
  }

  public getCacheSize(): number {
    return this.cache.size;
  }
}

export const cacheService = new CacheService();
