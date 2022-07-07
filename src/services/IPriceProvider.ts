/**
 * Definition of provider for access token price.
 */
 export interface IPriceProvider {
  /**
   * Gets current token price in USD.
   * @param tokenInfo Token information.
   */
  getUsdPrice(symbol: string): Promise<number>;
}