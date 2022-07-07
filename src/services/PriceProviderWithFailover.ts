import { injectable } from 'inversify';
import container from '../container';
import { ContainerTypes } from '../containertypes';
import { IPriceProvider } from './IPriceProvider';

/**
 * Uses registered price providers to fetch token price.
 */
 @injectable()
 export class PriceProviderWithFailover implements IPriceProvider {
     /**
      * Fetches all registered price providers and tries to fetch data from a first one.
      * If call fails it moves to second price provider and so on.
      * @param tokenInfo Token information.
      * @returns Token price or 0 if unable to fetch price.
      */
     public async getUsdPrice(symbol: string): Promise<number> {
         const providers = container.getAll<IPriceProvider>(ContainerTypes.PriceProvider);
 
         for (const provider of providers) {
             try {
                 return await provider.getUsdPrice(symbol);
             } catch (error) {
                 // execution will move to next price provider
                 console.log(error);
             }
         }
 
         return 0;
     }
 }