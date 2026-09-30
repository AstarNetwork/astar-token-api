import axios, { AxiosRequestConfig } from 'axios';
import { injectable } from 'inversify';
import { IPriceProvider, TokenInfo } from './IPriceProvider';

/**
 * Provides token price by using Coin Gecko API
 */
type CoinGeckoTokenInfo = { id: string; symbol: string; name: string };

// Symbols are not unique on CoinGecko, so native tokens are mapped explicitly.
const KNOWN_TOKEN_IDS: Record<string, string> = {
    astr: 'astar',
    sdn: 'shiden',
};

/**
 * CoinGecko demo API key, bound from Secret Manager (see src/index.ts).
 * The keyless public API is heavily rate limited from shared cloud IPs.
 */
const getRequestOptions = (): AxiosRequestConfig => {
    const apiKey = process.env.COINGECKO_API_KEY;
    return apiKey ? { headers: { 'x-cg-demo-api-key': apiKey } } : {};
};

@injectable()
export class CoinGeckoPriceProvider implements IPriceProvider {
    public static BaseUrl = 'https://api.coingecko.com/api/v3';
    private static tokens: CoinGeckoTokenInfo[];

    public async getPrice(symbol: string, currency = 'usd'): Promise<number> {
        const tokenSymbol = await this.getTokenId(symbol);

        if (tokenSymbol) {
            const url = `${CoinGeckoPriceProvider.BaseUrl}/simple/price?ids=${tokenSymbol}&vs_currencies=${currency}`;
            const result = await axios.get(url, getRequestOptions());

            if (result.data[tokenSymbol]) {
                const price = result.data[tokenSymbol][currency];
                return Number(price ?? 0);
            }
        }

        return 0;
    }

    public async getPrices(symbol: string, currencies = ['usd']): Promise<Map<string, number>> {
        const tokenSymbol = await this.getTokenId(symbol);
        const prices = new Map<string, number>();
        currencies.map((c) => prices.set(c, 0));

        if (tokenSymbol) {
            const url = `${CoinGeckoPriceProvider.BaseUrl}/simple/price?ids=${tokenSymbol}&vs_currencies=${currencies}`;
            const result = await axios.get(url, getRequestOptions());

            for (const [key, _] of prices) {
                if (result.data[tokenSymbol]) {
                    const price = result.data[tokenSymbol][key];
                    prices.set(key, Number(price ?? 0));
                }
            }
        }

        return prices;
    }

    public async getPriceWithTimestamp(symbol: string, currency: string | undefined): Promise<TokenInfo> {
        const price = await this.getPrice(symbol, currency);

        return {
            price,
            lastUpdated: Date.now(),
        };
    }

    private async getTokenId(symbol: string): Promise<string | undefined> {
        const knownId = KNOWN_TOKEN_IDS[symbol.toLowerCase()];
        if (knownId) {
            return knownId;
        }

        if (!CoinGeckoPriceProvider.tokens) {
            // Cache received data since token list is a quite big.
            CoinGeckoPriceProvider.tokens = await this.getTokenList();
        }

        return CoinGeckoPriceProvider.tokens.find((x) => x.symbol.toLowerCase() === symbol.toLowerCase())?.id;
    }

    private async getTokenList(): Promise<CoinGeckoTokenInfo[]> {
        const url = `${CoinGeckoPriceProvider.BaseUrl}/coins/list`;
        const result = await axios.get<CoinGeckoTokenInfo[]>(url, getRequestOptions());

        return result.data;
    }
}
