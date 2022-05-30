import { injectable, inject } from 'inversify';
import { ethers } from 'ethers';
import { aprToApy } from 'apr-tools';
import { IApiFactory } from '../client/ApiFactory';
import { AprCalculationData } from '../models/AprCalculationData';
import { networks, NetworkType } from '../networks';
import { defaultAmountWithDecimals, getSubscanUrl, getSubscanOption } from '../utils';
import axios from 'axios';

export interface IDappsStakingService {
    calculateApr(network?: NetworkType): Promise<number>;
    calculateApy(network?: NetworkType): Promise<number>;
    getEarned(network?: NetworkType, address?: string): Promise<number>;
}

// Ref: https://github.com/PlasmNetwork/Astar/blob/5b01ef3c2ca608126601c1bd04270ed08ece69c4/runtime/shiden/src/lib.rs#L435
// Memo: 50% of block rewards goes to dappsStaking, 50% goes to block validator
// Fixme: ideally get the value from API
const DAPPS_REWARD_RATE = 0.5;

const TS_FIRST_BLOCK = {
    [networks.astar.name]: 1639798585, //  Ref: 2021-12-18 03:36:25 https://astar.subscan.io/block/1
    [networks.shiden.name]: 1625570880, //  Ref: 2021-07-06 11:28:00 https://shiden.subscan.io/block/1
    [networks.shibuya.name]: 1630937640, // Ref: 2021-09-06 14:14:00 https://shibuya.subscan.io/block/1
};

@injectable()
/**
 * Dapps staking calculation service.
 */
export class DappsStakingService implements IDappsStakingService {
    constructor(@inject('factory') private _apiFactory: IApiFactory) {}

    public async calculateApr(network = 'astar'): Promise<number> {
        try {
            const api = this._apiFactory.getApiInstance(network);
            const data = await api.getAprCalculationData();
            const decimals = await api.getChainDecimals();

            const blockRewards = Number(defaultAmountWithDecimals(data.blockRewards, decimals));
            const averageBlocksPerMinute = this.getAverageBlocksPerMins(network, data);
            const averageBlocksPerDay = averageBlocksPerMinute * 60 * 24;
            const dailyEraRate = averageBlocksPerDay / data.blockPerEra.toNumber();
            const eraRewards = data.blockPerEra.toNumber() * blockRewards;
            const annualRewards = eraRewards * dailyEraRate * 365.25;

            const tvl = await api.getTvl();
            const totalStaked = Number(ethers.utils.formatUnits(tvl.toString(), decimals));
            const stakerBlockReward = (1 - data.developerRewardPercentage) * DAPPS_REWARD_RATE;
            const stakerApr = (annualRewards / totalStaked) * stakerBlockReward * 100;

            return stakerApr;
        } catch (e) {
            console.error(e);
            throw new Error(
                'Unable to calculate network APR. Most likely there is an error fetching data from a node.',
            );
        }
    }

    public async calculateApy(network: NetworkType = 'astar'): Promise<number> {
        try {
            const apr = await this.calculateApr(network);
            return aprToApy(apr);
        } catch {
            throw new Error(
                'Unable to calculate network APY. Most likely there is an error fetching data from a node.',
            );
        }
    }

    private getAverageBlocksPerMins(chainId: string, data: AprCalculationData): number {
        const currentTs = Math.floor(data.timeStamp.toNumber() / 1000);
        const minsChainRunning = (currentTs - TS_FIRST_BLOCK[chainId]) / 60;
        const avgBlocksPerMin = data.latestBlock.toNumber() / minsChainRunning;

        return avgBlocksPerMin;
    }

    public async getEarned(network: NetworkType = 'astar', address: string): Promise<number> {
        try {
            // Docs: https://support.subscan.io/#staking-api
            const base = getSubscanUrl(network);
            const url = base + '/api/scan/staking_history';
            const option = getSubscanOption();

            const body = {
                row: 20,
                page: 0,
                address,
            };

            const result = await axios.post(url, body, option);

            if (result.data) {
                const earned = result.data.data.sum;
                return Number(ethers.utils.formatEther(earned));
            } else {
                return 0;
            }
        } catch (e) {
            console.error(e);
            throw new Error('Something went wrong. Most likely there is an error fetching data from Subscan API.');
        }
    }
}
