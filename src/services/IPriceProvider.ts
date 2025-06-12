export type TokenInfo = {
    price: number;
    lastUpdated: number;
};

/**
 * Definition of provider for access token price.
 */
export interface IPriceProvider {
    /**
     * Gets current token price in a given currency.
     * @param tokenInfo Token information.
     */
    getPrice(symbol: string, currency: string | undefined): Promise<number>;

    /**
     * Gets current token prices in a given list of currencies.
     * @param symbol Token symbol.
     * @param currencies
     */
    getPrices(symbol: string, currencies: string[]): Promise<Map<string, number>>;

    /**
     * Gets current token price in USD with timestamp.
     * @param tokenInfo Token price and timestamp.
     */
    getPriceWithTimestamp(symbol: string, currency: string | undefined): Promise<TokenInfo>;
}
