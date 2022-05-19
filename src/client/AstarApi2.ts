import { u32, u128, Option } from '@polkadot/types';
import { Header } from '@polkadot/types/interfaces';
import BN from 'bn.js';
import { EraInfo, RewardDistributionConfig } from '../types/DappsStaking';
import { BaseApi, IAstarApi } from './BaseApi';
import { networks } from '../networks';
import { AprCalculationData } from '../models/AprCalculationData';

export class AstarApi2 extends BaseApi implements IAstarApi {
    constructor(endpoint = networks.astar.endpoint) {
        super(endpoint);
    }

    // Method override to take into account individual claim storage changes.
    public async getAprCalculationData(): Promise<AprCalculationData> {
        await this.connect();
        const results = await Promise.all([
            this._api.consts.blockReward.rewardAmount,
            this._api.query.timestamp.now(),
            this._api.rpc.chain.getHeader(),
            this._api.query.blockReward.rewardDistributionConfigStorage<RewardDistributionConfig>(),
            this._api.consts.dappsStaking.blockPerEra,
        ]);

        const result = new AprCalculationData();
        result.blockRewards = results[0] as u128;
        result.timeStamp = results[1];
        result.latestBlock = (results[2] as Header).number.unwrap();
        result.developerRewardPercentage = Number(results[3]?.dappsPercent.toHuman().replace('%', '')) * 0.01;
        result.blockPerEra = results[4] as u32;

        return result;
    }

    // Method override to take into account individual claim storage changes.
    public async getTvl(): Promise<BN> {
        await this.connect();
        const era = await this._api.query.dappsStaking.currentEra();
        const result = await this._api.query.dappsStaking.generalEraInfo<Option<EraInfo>>(era);
        const tvl = result.unwrap().locked;
        return tvl;
    }
}
