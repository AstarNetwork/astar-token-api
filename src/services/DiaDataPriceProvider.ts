import axios from 'axios';
import { injectable } from 'inversify';
import { IPriceProvider } from './IPriceProvider';

/**
 * Provides token price by using DIA Data API
 */
@injectable()
export class DiaDataPriceProvider implements IPriceProvider {
    public static BaseUrl = 'https://api.diadata.org/v1/quotation';

    public async getPrice(symbol: string): Promise<number> {
        const url = `${DiaDataPriceProvider.BaseUrl}/${symbol}`;
        const result = await axios.get(url);

        if (result.data && result.data.Price) {
            return Number(result.data.Price);
        }

        return 0;
    }
}
