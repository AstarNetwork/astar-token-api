import { PalletBalancesAccountData } from '@polkadot/types/lookup';
import { formatBalance, BN } from '@polkadot/util';
import { injectable, inject } from 'inversify';
import { IApiFactory } from '../client/ApiFactory';
import { ContainerTypes } from '../containertypes';
import { TokenStats } from '../models/TokenStats';
import { NetworkType } from '../networks';
import { addressesToExclude } from './AddressesToExclude';
import { AccountData } from '../models/AccountData';

export interface IStatsService {
    getTokenStats(network?: NetworkType): Promise<TokenStats>;
}

@injectable()
/**
 * Token statistics calculation service.
 */
export class StatsService implements IStatsService {
    constructor(@inject(ContainerTypes.ApiFactory) private _apiFactory: IApiFactory) {}

    /**
     * Calculates token circulation supply by substracting sum of all token holder accounts
     * not in circulation from total token supply.
     * @param network Network (astar or shiden) to calculate token supply for.
     * @returns Token statistics including total supply and circulating supply.
     */
    public async getTokenStats(network = 'astar'): Promise<TokenStats> {
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

    private getTotalBalanceToExclude(balances: AccountData[]): BN {
        const sum = balances
            .map((balance) => {
                return balance.free.add(balance.miscFrozen ?? balance.frozen);
            })
            .reduce((partialSum, b) => partialSum.add(b), new BN(0));

        return sum;
    }

    private formatBalance(balance: BN, chainDecimals: number): number {
        const result = formatBalance(balance, { withSi: false, forceUnit: '-', decimals: chainDecimals }).split('.')[0];

        return parseInt(result.replaceAll(',', ''));
    }
}
