import { injectable } from 'inversify';
import container from '../container';
import { ContainerTypes } from '../containertypes';
import { IPriceProvider, TokenInfo } from './IPriceProvider';
import { CacheService } from './CacheService';
import { Guard } from '../guard';

/**
 * Uses registered price providers to fetch token price.
 */
@injectable()
export class PriceProviderWithFailover implements IPriceProvider {
    private readonly priceCache = new CacheService<number>(60000);

    /**
     * Fetches all registered price providers and tries to fetch data from a first one.
     * If call fails it moves to second price provider and so on.
     * @param tokenInfo Token information.
     * @returns Token price or 0 if unable to fetch price.
     */
    public async getPrice(symbol: string, currency = 'usd'): Promise<number> {
        Guard.ThrowIfUndefined('symbol', symbol);
        const priceInfo = await this.getPriceWithTimestamp(symbol, currency);

        return priceInfo.price;
    }

    public async getPriceWithTimestamp(symbol: string, currency = 'usd'): Promise<TokenInfo> {
        Guard.ThrowIfUndefined('symbol', symbol);

        const providers = container.getAll<IPriceProvider>(ContainerTypes.PriceProvider);
        const cacheKey = `${symbol}-${currency}`;
        const cacheItem = this.priceCache.getItem(cacheKey);

        if (cacheItem && !this.priceCache.isExpired(cacheItem)) {
            // Price is cached and still valid.
            return { price: cacheItem.data, lastUpdated: cacheItem.updatedAt };
        }

        // Fetch a new price.
        for (const provider of providers) {
            try {
                const price = await provider.getPrice(symbol, currency);
                this.priceCache.setItem(cacheKey, price);

                return { price, lastUpdated: Date.now() };
            } catch (error) {
                // Execution moves to next price provider, so nothing special to do here.
                console.log(error);
            }
        }

        // Last resort, all providers failed. Return from cache.
        if (cacheItem) {
            return { price: cacheItem.data, lastUpdated: cacheItem.updatedAt };
        } else {
            throw new Error('Unable to fetch price from any provider.');
        }
    }
}
