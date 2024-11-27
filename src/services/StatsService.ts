import { PalletBalancesAccountData } from '@polkadot/types/lookup';
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

export type TotalSupply = {
    block: number;
    timestamp: number;
    balance: bigint;
};

export interface IStatsService {
    getTokenStats(network: NetworkType): Promise<TokenStats>;
    getTotalSupply(network: NetworkType): Promise<number>;
    getTotalIssuanceHistory(network: NetworkType): Promise<TotalSupply[]>;
}

@injectable()
/**
 * Token statistics calculation service.
 */
export class StatsService extends DappStakingV3IndexerBase implements IStatsService {
    constructor(@inject(ContainerTypes.ApiFactory) private _apiFactory: IApiFactory) {
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

            return result.data.data.totalIssuances.map((item: any) => {
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
