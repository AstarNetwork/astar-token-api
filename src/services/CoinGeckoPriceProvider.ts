import axios, { AxiosRequestConfig } from 'axios';
import { inject, injectable } from 'inversify';
import { IPriceProvider } from './IPriceProvider';
import { ContainerTypes } from '../containertypes';
import { IFirebaseService } from './FirebaseService';

/**
 * Provides token price by using Coin Gecko API
 */
type CoinGeckoTokenInfo = { id: string; symbol: string; name: string };

@injectable()
export class CoinGeckoPriceProvider implements IPriceProvider {
    public static BaseUrl = 'https://pro-api.coingecko.com/api/v3';
    private static tokens: CoinGeckoTokenInfo[];

    constructor(@inject(ContainerTypes.FirebaseService) private firebaseService: IFirebaseService) {}

    public async getUsdPrice(symbol: string): Promise<number> {
        const tokenSymbol = await this.getTokenId(symbol);

        if (tokenSymbol) {
            const url = `${CoinGeckoPriceProvider.BaseUrl}/simple/price?ids=${tokenSymbol}&vs_currencies=usd`;
            const result = await axios.get(url, this.getOptions());

            if (result.data[tokenSymbol]) {
                const price = result.data[tokenSymbol].usd;
                return Number(price);
            }
        }

        return 0;
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
        const result = await axios.get<CoinGeckoTokenInfo[]>(url, this.getOptions());

        return result.data;
    }

    public getOptions(): AxiosRequestConfig {
        const apiKey = this.firebaseService.getEnvVariable('coingecko', 'apikey');
        const options: AxiosRequestConfig = {};
        if (apiKey) {
            options.headers = { 'x-cg-pro-api-key': apiKey };
        }

        return options;
    }
}
