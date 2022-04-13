import { PalletBalancesAccountData } from '@polkadot/types/lookup';
import { formatBalance } from '@polkadot/util';
import BN from 'bn.js';
import { injectable, inject } from 'inversify';
import { IApiFactory } from '../client/ApiFactory';
import { TokenStats } from '../models/TokenStats';
import { NetworkType } from '../networks';
import { addressesToExclude } from './AddressesToExclude';

export interface IStatsService {
    getTokenStats(network?: NetworkType): Promise<TokenStats>;
}

@injectable()
/**
 * Token statistics calculation service.
 */
export class StatsService implements IStatsService {
    constructor(@inject('factory') private _apiFactory: IApiFactory) {}

    /**
     * Calculates token circulation supply by substracting sum of all token holder accounts
     * not in circulation from total token supply.
     * @param network Network (astar or shiden) to calculate token supply for.
     * @returns Token statistics including total supply and circulating supply.
     */
    public async getTokenStats(network = 'astar'): Promise<TokenStats> {
        const api = this._apiFactory.getApiInstance(network);
        const chainDecimals = await api.getChainDecimals();
        const totalSupply = await api.getTotalSupply();

        const balancesToExclude = await api.getBalances(addressesToExclude);
        const totalBalancesToExclude = this.getTotalBalanceToExclude(balancesToExclude);
        let circulatingSupply = totalSupply.sub(totalBalancesToExclude);

        if (network === 'astar') {
            circulatingSupply = circulatingSupply.sub(new BN('1708161816000000000000000000'));
        }

        return new TokenStats(
            Math.floor(new Date().getTime() / 1000),
            this.formatBalance(totalSupply, chainDecimals),
            this.formatBalance(circulatingSupply, chainDecimals),
        );
    }

    private getTotalBalanceToExclude(balances: PalletBalancesAccountData[]): BN {
        const sum = balances
            .map((balance) => {
                return balance.free.add(balance.miscFrozen);
            })
            .reduce((partialSum, b) => partialSum.add(b), new BN(0));

        return sum;
    }

    private formatBalance(balance: BN, chainDecimals: number): number {
        const result = formatBalance(balance, { withSi: false, forceUnit: '-' }, chainDecimals).split('.')[0];

        return parseInt(result.replaceAll(',', ''));
    }
}
