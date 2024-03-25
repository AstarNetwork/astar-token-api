import { Guard } from '../guard';

export interface CacheItem<T> {
    updatedAt: number;
    data: T;
}

export class CacheService<T> {
    private cache = new Map<string, CacheItem<T>>();

    constructor(private cachedItemValidityTimeMs: number = 60000) {}

    public getItem(key: string): CacheItem<T> | undefined {
        Guard.ThrowIfUndefined('key', key);

        const cacheItem = this.cache.get(key);

        if (!cacheItem) {
            return undefined;
        }

        return cacheItem;
    }

    public setItem(key: string, item: T): void {
        Guard.ThrowIfUndefined('key', key);

        this.cache.set(key, {
            data: item,
            updatedAt: Date.now(),
        });
    }

    public isExpired(cacheItem: CacheItem<T>): boolean {
        return cacheItem.updatedAt + this.cachedItemValidityTimeMs < Date.now();
    }
}
