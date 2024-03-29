import { u32, u128, Option } from '@polkadot/types';
import { Header } from '@polkadot/types/interfaces';
import { BN } from '@polkadot/util';
import { formatUnits } from 'ethers';
import { EraInfo, RewardDistributionConfig } from '../types/DappsStaking';
import { BaseApi, IAstarApi } from './BaseApi';
import { networks } from '../networks';
import { AprCalculationData } from '../models/AprCalculationData';

export class AstarApi2 extends BaseApi implements IAstarApi {
    constructor(endpoints = networks.astar.endpoints) {
        super(endpoints);
    }

    // Method override to take into account individual claim storage changes.
    public async getAprCalculationData(): Promise<AprCalculationData> {
        await this.ensureConnection();
        const results = await Promise.all([
            this._api.consts.blockReward.maxBlockRewardAmount,
            this._api.query.timestamp.now(),
            this._api.rpc.chain.getHeader(),
            this._api.query.blockReward.rewardDistributionConfigStorage<RewardDistributionConfig>(),
            this._api.consts.dappsStaking.blockPerEra,
            this._api.query.balances.totalIssuance(),
            this.getChainDecimals(),
        ]);

        const result = new AprCalculationData();
        result.blockRewards = results[0] as u128;
        result.timeStamp = results[1];
        result.latestBlock = (results[2] as Header).number.unwrap();

        const numAdjToPercentage = 0.000000001;
        result.baseStakerPercent = results[3].baseStakerPercent.toNumber() * numAdjToPercentage;
        result.adjustablePercent = results[3].adjustablePercent.toNumber() * numAdjToPercentage;
        result.idealDappsStakingTvl = results[3].idealDappsStakingTvl.toNumber() * numAdjToPercentage;

        result.blockPerEra = results[4] as u32;
        result.totalIssuance = Number(formatUnits(results[5].toString(), results[6]));

        const block7EraAgo = result.latestBlock.sub(result.blockPerEra.muln(7));
        const blockHash7ErasAgo = await this._api.rpc.chain.getBlockHash(block7EraAgo);
        const block = await this._api.at(blockHash7ErasAgo);
        const tsBlock7EraAgo = await block.query.timestamp.now();

        result.block7EraAgo = <u32>block7EraAgo;
        result.tsBlock7EraAgo = tsBlock7EraAgo;

        const block1EraAgo = result.latestBlock.sub(result.blockPerEra);
        const blockHash1EraAgo = await this._api.rpc.chain.getBlockHash(block1EraAgo);
        const blockInstance = await this._api.at(blockHash1EraAgo);
        const tsBlock1EraAgo = await blockInstance.query.timestamp.now();

        result.block1EraAgo = <u32>block1EraAgo;
        result.tsBlock1EraAgo = tsBlock1EraAgo;

        return result;
    }

    // Method override to take into account individual claim storage changes.
    public async getTvl(): Promise<BN> {
        await this.ensureConnection();
        const era = await this._api.query.dappsStaking.currentEra();
        const result = await this._api.query.dappsStaking.generalEraInfo<Option<EraInfo>>(era);
        const tvl = result.unwrap().locked;
        return tvl;
    }
}
