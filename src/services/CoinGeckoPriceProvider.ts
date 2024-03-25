import axios, { AxiosRequestConfig } from 'axios';
import { inject, injectable } from 'inversify';
import { IPriceProvider, TokenInfo } from './IPriceProvider';
import { ContainerTypes } from '../containertypes';
import { IFirebaseService } from './FirebaseService';

/**
 * Provides token price by using Coin Gecko API
 */
type CoinGeckoTokenInfo = { id: string; symbol: string; name: string };

@injectable()
export class CoinGeckoPriceProvider implements IPriceProvider {
    public static BaseUrl = 'https://api.coingecko.com/api/v3';
    private static tokens: CoinGeckoTokenInfo[];

    public async getPrice(symbol: string, currency = 'usd'): Promise<number> {
        const tokenSymbol = await this.getTokenId(symbol);

        if (tokenSymbol) {
            const url = `${CoinGeckoPriceProvider.BaseUrl}/simple/price?ids=${tokenSymbol}&vs_currencies=${currency}`;
            const result = await axios.get(url);

            if (result.data[tokenSymbol]) {
                const price = result.data[tokenSymbol][currency];
                return Number(price ?? 0);
            }
        }

        return 0;
    }

    public async getPriceWithTimestamp(symbol: string, currency: string | undefined): Promise<TokenInfo> {
        const price = await this.getPrice(symbol, currency);

        return {
            price,
            lastUpdated: Date.now(),
        };
    }

    private async getTokenId(symbol: string): Promise<string | undefined> {
        if (!CoinGeckoPriceProvider.tokens) {
            // Cache received data since token list is a quite big.
            CoinGeckoPriceProvider.tokens = await this.getTokenList();
        }

        return CoinGeckoPriceProvider.tokens.find((x) => x.symbol.toLowerCase() === symbol.toLowerCase())?.id;
    }

    private async getTokenList(): Promise<CoinGeckoTokenInfo[]> {
        const url = `${CoinGeckoPriceProvider.BaseUrl}/coins/list`;
        const result = await axios.get<CoinGeckoTokenInfo[]>(url);

        return result.data;
    }
}
