import { ApiPromise, WsProvider } from '@polkadot/api';
import { u32, u128, UInt, Option } from '@polkadot/types';
import { PalletBalancesAccountData } from '@polkadot/types/lookup';
import { Header } from '@polkadot/types/interfaces';
import { injectable } from 'inversify';
import BN from 'bn.js';
import { AprCalculationData } from '../models/AprCalculationData';
import { networks } from '../networks';
import { PalletDapsStakingEraRewardAndStake } from '../types/DappsStaking';

export interface IAstarApi {
    getTotalSupply(): Promise<u128>;
    getBalances(addresses: string[]): Promise<PalletBalancesAccountData[]>;
    getChainDecimals(): Promise<number>;
    getAprCalculationData(): Promise<AprCalculationData>;
    getTvl(): Promise<BN>;
}

@injectable()
export class AstarApi implements IAstarApi {
    private _api: ApiPromise;

    constructor(private endpoint = networks.astar.endpoint) {}

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

    public async getAprCalculationData(): Promise<AprCalculationData> {
        const oneBillion = 1000000000;

        await this.connect();
        const results = await Promise.all([
            this._api.consts.blockReward.rewardAmount,
            this._api.query.timestamp.now(),
            this._api.rpc.chain.getHeader(),
            this._api.consts.dappsStaking.developerRewardPercentage,
            this._api.consts.dappsStaking.blockPerEra,
        ]);

        const result = new AprCalculationData();
        result.blockRewards = results[0] as u128;
        result.timeStamp = results[1];
        result.latestBlock = (results[2] as Header).number.unwrap();

        // The value below is of Perbill type, so we need to divide by billion to get percentage.
        result.developerRewardPercentage = (results[3] as UInt).toNumber() / oneBillion;
        result.blockPerEra = results[4] as u32;

        return result;
    }

    public async getTvl(): Promise<BN> {
        const era = await this._api.query.dappsStaking.currentEra();
        const result = (await this._api.query.dappsStaking.eraRewardsAndStakes(
            era,
        )) as Option<PalletDapsStakingEraRewardAndStake>;
        const tvl = result.unwrap().staked;
        return tvl;
    }

    private async connect() {
        // establish node connection with the endpoint
        if (!this._api) {
            const provider = new WsProvider(this.endpoint);
            const api = new ApiPromise({ provider });
            const apiInst = await api.isReady;
            this._api = apiInst;
        }

        return this._api;
    }
}
