import { Movie } from "../model/movieModel";

interface MovieCacheEntry {
  movie: Movie;
  timestamp: number;
}

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 100; // Maximum cached movies

class MovieCacheStore {
  private cache = new Map<string, MovieCacheEntry>();

  private getFinalId(id: string, isTvShow: boolean = false): string {
    return isTvShow ? `${id}_tv` : `${id}`;
  }

  private isExpired(entry: MovieCacheEntry): boolean {
    return Date.now() - entry.timestamp > CACHE_TTL;
  }

  private evictOldest(): void {
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  cacheMovie(movie: Movie): void {
    this.evictOldest();
    
    const id = this.getFinalId(movie.id.toString(), movie.isTvShow);
    this.cache.set(id, {
      movie,
      timestamp: Date.now(),
    });
  }

  getCachedMovieAndDelete(id: string, isTvShow: boolean = false): Movie | undefined {
    const result = this.getCachedMovie(id.toString(), isTvShow);
    this.deleteMovie(id.toString(), isTvShow);
    return result;
  }

  getCachedMovie(id: string, isTvShow: boolean = false): Movie | undefined {
    const cacheKey = this.getFinalId(id, isTvShow);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return undefined;
    }

    // Auto-delete expired entries
    if (this.isExpired(entry)) {
      this.cache.delete(cacheKey);
      return undefined;
    }

    return entry.movie;
  }

  deleteMovie(id: string, isTvShow: boolean = false): void {
    const cacheKey = this.getFinalId(id, isTvShow);
    this.cache.delete(cacheKey);
  }

  clear(): void {
    this.cache.clear();
  }

  // Useful for debugging
  getStats() {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      ttl: CACHE_TTL,
    };
  }
}

export const MovieStore = new MovieCacheStore();