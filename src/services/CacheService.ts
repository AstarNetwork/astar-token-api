import { Guard } from '../guard';

export interface CacheItem<T> {
    updatedAt: number;
    data: T;
}

export class CacheService<T> {
    private cache = new Map<string, CacheItem<T>>();

    constructor(private cachedItemValidityTimeMs: number = 60000) {}

    public getItem(key: string): T | undefined {
        Guard.ThrowIfUndefined('key', key);

        const cacheItem = this.cache.get(key);

        if (!cacheItem) {
            return undefined;
        }

        if (this.isExpired(cacheItem)) {
            this.cache.delete(key);
            return undefined;
        }

        return cacheItem.data;
    }

    public setItem(key: string, item: T): void {
        Guard.ThrowIfUndefined('key', key);
        Guard.ThrowIfUndefined('item', item);

        this.cache.set(key, {
            data: item,
            updatedAt: Date.now(),
        });
    }

    private isExpired(cacheItem: CacheItem<T>): boolean {
        return cacheItem.updatedAt + this.cachedItemValidityTimeMs < Date.now();
    }
}
