import { PalletBalancesAccountData } from '@polkadot/types/lookup';
import { formatBalance } from '@polkadot/util';
import BN from 'bn.js';
import { injectable, inject } from 'inversify';
import { IAstarApi } from '../client/AstarApi';
import { TokenStats } from '../models/TokenStats';
import { addressesToExclude } from './AddressesToExclude';

export interface IStatsService {
    getTokenStats(): Promise<TokenStats>;
}

@injectable()
export class StatsService implements IStatsService {
    constructor(@inject('api') private _api: IAstarApi) {}

    public async getTokenStats(): Promise<TokenStats> {
        const chainDecimals = await this._api.getChainDecimals();
        const totalSupply = await this._api.getTotalSupply();

        const balancesToExclude = await this._api.getBalances(addressesToExclude);
        const totalBalancesToExclude = this.getTotalBalanceToExclude(balancesToExclude);
        const circulatingSupply = totalSupply.sub(totalBalancesToExclude);

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
