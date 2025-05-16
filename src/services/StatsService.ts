import { formatBalance, BN } from '@polkadot/util';
import { injectable, inject } from 'inversify';
import { IApiFactory } from '../client/ApiFactory';
import { ContainerTypes } from '../containertypes';
import { TokenStats } from '../models/TokenStats';
import { NetworkType } from '../networks';
import { addressesToExclude } from './AddressesToExclude';
import { AccountData } from '../models/AccountData';
import { Guard } from '../guard';
import { DappStakingV3IndexerBase } from './DappStakingV3IndexerBase';
import axios from 'axios';
import { IPriceProvider } from './IPriceProvider';

export type TotalSupply = {
    block: number;
    timestamp: number;
    balance: bigint;
};

export type ExtendedTokenStats = {
    symbol: string;
    currencyCode: string;
    marketCap: number;
    circulatingSupply: number;
    maxSupply: number;
    provider: string;
    lastUpdatedTimestamp: number;
    accTradePrice24h: number | null;
    price: number;
};

export interface IStatsService {
    getTokenStats(network: NetworkType): Promise<TokenStats>;
    getTokenStatsExtended(network: NetworkType, currencies: string[]): Promise<ExtendedTokenStats[]>;
    getTotalSupply(network: NetworkType): Promise<number>;
    getTotalIssuanceHistory(network: NetworkType): Promise<TotalSupply[]>;
}

@injectable()
/**
 * Token statistics calculation service.
 */
export class StatsService extends DappStakingV3IndexerBase implements IStatsService {
    constructor(
        @inject(ContainerTypes.ApiFactory) private _apiFactory: IApiFactory,
        @inject(ContainerTypes.PriceProviderWithFailover) private _priceProvider: IPriceProvider,
    ) {
        super();
    }

    /**
     * Calculates token circulation supply by substracting sum of all token holder accounts
     * not in circulation from total token supply.
     * @param network NetworkType (astar or shiden) to calculate token supply for.
     * @returns Token statistics including total supply and circulating supply.
     */
    public async getTokenStats(network: NetworkType): Promise<TokenStats> {
        Guard.ThrowIfUndefined(network, 'network');
        this.GuardNetwork(network);

        try {
            const api = this._apiFactory.getApiInstance(network);
            const chainDecimals = await api.getChainDecimals();
            const totalSupply = await api.getTotalSupply();

            const balancesToExclude = await api.getBalances(addressesToExclude);
            const totalBalancesToExclude = this.getTotalBalanceToExclude(balancesToExclude);
            const circulatingSupply = totalSupply.sub(totalBalancesToExclude);

            return new TokenStats(
                Math.floor(new Date().getTime() / 1000),
                this.formatBalance(totalSupply, chainDecimals),
                this.formatBalance(circulatingSupply, chainDecimals),
            );
        } catch (e) {
            console.error(e);
            throw new Error('Unable to fetch token statistics from a node.');
        }
    }

    /**
     * Calculates token circulation supply by substracting sum of all token holder accounts
     * not in circulation from total token supply.
     * @param network NetworkType (astar or shiden) to calculate token supply for.
     * @returns Token statistics including total supply and circulating supply.
     */
    public async getTokenStatsExtended(network: NetworkType, currencies: string[]): Promise<ExtendedTokenStats[]> {
        if (network !== 'astar' && network !== 'shiden') {
            throw new Error(`This method is not supported for the network ${network}`);
        }

        try {
            const api = this._apiFactory.getApiInstance(network);
            const apiClient = await api.getApiPromise();

            const chainTokens = apiClient.registry.chainTokens;
            const tokenSymbol = chainTokens[0];
            const priceRequests = currencies.map((currency) => {
                return this._priceProvider.getPrice(tokenSymbol.toLowerCase(), currency);
            });

            const [chainDecimals, totalSupply, balancesToExclude] = await Promise.all([
                api.getChainDecimals(),
                api.getTotalSupply(),
                api.getBalances(addressesToExclude),
            ]);
            const prices = await Promise.all(priceRequests);

            const totalBalancesToExclude = this.getTotalBalanceToExclude(balancesToExclude);
            const circulatingSupplyWei = totalSupply.sub(totalBalancesToExclude);
            const circulatingSupply = this.formatBalance(circulatingSupplyWei, chainDecimals);
            const lastUpdatedTimestamp = Date.now();

            return currencies.map((currency, index) => {
                return {
                    symbol: tokenSymbol,
                    currencyCode: currency.toUpperCase(),
                    price: prices[index],
                    marketCap: circulatingSupply * prices[index],
                    accTradePrice24h: null,
                    circulatingSupply,
                    maxSupply: this.formatBalance(totalSupply, chainDecimals),
                    provider: 'Stake Technologies Pte Ltd',
                    lastUpdatedTimestamp,
                };
            });
        } catch (e) {
            console.error(e);
            throw new Error('Unable to fetch token statistics from a node.');
        }
    }

    public async getTotalSupply(network: NetworkType): Promise<number> {
        Guard.ThrowIfUndefined(network, 'network');
        this.GuardNetwork(network);

        try {
            const api = this._apiFactory.getApiInstance(network);
            const chainDecimals = await api.getChainDecimals();
            const totalSupply = await api.getTotalSupply();

            return this.formatBalance(totalSupply, chainDecimals);
        } catch (e) {
            console.error(e);
            throw new Error('Unable to fetch token total supply from a node.');
        }
    }

    public async getTotalIssuanceHistory(network: NetworkType): Promise<TotalSupply[]> {
        this.GuardNetwork(network);

        try {
            const result = await axios.post(this.getApiUrl(network), {
                query: `query {
                    totalIssuances(orderBy: id_ASC) {
                        id
                        timestamp
                        balance
                    }
                }`,
            });

            return result.data.data.totalIssuances.map((item: { id: string; timestamp: string; balance: string }) => {
                return {
                    block: Number(item.id),
                    timestamp: Number(item.timestamp),
                    balance: BigInt(item.balance),
                };
            });
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    private getTotalBalanceToExclude(balances: AccountData[]): BN {
        const sum = balances
            .map((balance) => {
                return balance.free;
            })
            .reduce((partialSum, b) => partialSum.add(b), new BN(0));

        return sum;
    }

    private formatBalance(balance: BN, chainDecimals: number): number {
        const result = formatBalance(balance, { withSi: false, forceUnit: '-', decimals: chainDecimals }).split('.')[0];

        return parseInt(result.replaceAll(',', ''));
    }
}
