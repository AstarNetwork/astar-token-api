import { ApiPromise, WsProvider } from '@polkadot/api';
import { u128 } from '@polkadot/types';
import { PalletBalancesAccountData } from '@polkadot/types/lookup';
import { injectable } from 'inversify';

const endpoint = process.env.ENDPOINT || 'wss://rpc.astar.network';

export interface IAstarApi {
    getTotalSupply(): Promise<u128>;
    getBalances(addresses: string[]): Promise<PalletBalancesAccountData[]>;
    getChainDecimals(): Promise<number>;
}

@injectable()
export class AstarApi implements IAstarApi {
    private _api: ApiPromise;

    public async getTotalSupply(): Promise<u128> {
        await this.connect();

        return await this._api.query.balances.totalIssuance();
    }

    public async getBalances(addresses: string[]): Promise<PalletBalancesAccountData[]> {
        await this.connect();
        const balances = await this._api.query.system.account.multi(addresses);

        return balances.map((balance) => balance.data);
    }

    public async getChainDecimals(): Promise<number> {
        await this.connect();
        const decimals = this._api.registry.chainDecimals;

        return decimals[0];
    }

    private async connect() {
        // establish node connection with the endpoint
        if (!this._api) {
            const provider = new WsProvider(endpoint);
            const api = new ApiPromise({ provider });
            const apiInst = await api.isReady;
            this._api = apiInst;
        }

        return this._api;
    }
}
