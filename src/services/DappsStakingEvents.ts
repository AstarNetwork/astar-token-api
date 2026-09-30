import { injectable, inject } from 'inversify';
import type { NetworkType } from '../networks';
import { Guard } from '../guard';
import type { IApiFactory } from '../client/ApiFactory';
import { ContainerTypes } from '../containertypes';
import { ServiceBase } from './ServiceBase';
import { CacheService } from './CacheService';
import astarSnapshot from '../data/dappStakingSnapshot.astar.json';
import shidenSnapshot from '../data/dappStakingSnapshot.shiden.json';
import shibuyaSnapshot from '../data/dappStakingSnapshot.shibuya.json';

export interface IDappsStakingEvents {
    getDapps(network: NetworkType): Promise<DappData[]>;
    getParticipantStake(network: NetworkType, address: string): Promise<bigint>;
    getPeriodBlockRange(network: NetworkType, period: number): Promise<{ start: number; end?: number }>;
}

export type DappData = {
    contractAddress: string;
    dappId: number;
    owner: string;
    beneficiary: string | null;
    state: 'Registered' | 'Unregistered';
    registeredAt?: string;
    registrationBlockNumber?: number;
    unregisteredAt?: string;
    unregistrationBlockNumber?: number;
};

type Snapshot = {
    indexedToBlock: number;
    votingStartBlocks: number[];
    unregisteredDapps: DappData[];
};

/**
 * Last data exported from the retired dApp staking indexer (Subsquid), used for history that cannot be
 * read from the chain: period boundaries and dApps unregistered before the snapshot block.
 */
const SNAPSHOTS: Record<string, Snapshot> = {
    astar: astarSnapshot as Snapshot,
    shiden: shidenSnapshot as Snapshot,
    shibuya: shibuyaSnapshot as Snapshot,
};

declare global {
    interface BigInt {
        toJSON: () => string;
    }
}
BigInt.prototype.toJSON = function () {
    return this.toString();
};

@injectable()
export class DappsStakingEvents extends ServiceBase implements IDappsStakingEvents {
    private readonly dappsCache = new CacheService<DappData[]>(10 * 60 * 1000);

    constructor(@inject(ContainerTypes.ApiFactory) private _apiFactory: IApiFactory) {
        super();
    }

    public async getParticipantStake(network: NetworkType, address: string): Promise<bigint> {
        Guard.ThrowIfUndefined(network, 'network');
        Guard.ThrowIfUndefined(address, 'address');

        try {
            const api = this._apiFactory.getApiInstance(network);
            const stakerInfo = await api.getStakerInfo(address);

            return stakerInfo;
        } catch (e) {
            console.error(e);
            throw new Error('Unable to fetch token statistics from a node.');
        }
    }

    public async getDapps(network: NetworkType): Promise<DappData[]> {
        this.GuardNetwork(network);

        const cacheItem = this.dappsCache.getItem(network);
        if (cacheItem && !this.dappsCache.isExpired(cacheItem)) {
            return cacheItem.data;
        }

        try {
            const api = this._apiFactory.getApiInstance(network);
            const registered: DappData[] = (await api.getIntegratedDapps()).map((dapp) => ({
                ...dapp,
                state: 'Registered',
            }));
            const dapps = registered.concat(SNAPSHOTS[network].unregisteredDapps);
            this.dappsCache.setItem(network, dapps);

            return dapps;
        } catch (e) {
            console.error(e);
            return cacheItem?.data ?? [];
        }
    }

    public async getPeriodBlockRange(network: NetworkType, period: number): Promise<{ start: number; end?: number }> {
        this.GuardNetwork(network);
        if (period <= 0) {
            throw new Error('Period must be greater than 0');
        }

        const starts = SNAPSHOTS[network].votingStartBlocks;
        if (period > starts.length) {
            throw new Error(`Season ${period} not found`);
        }

        return {
            start: starts[period - 1],
            end: starts[period] ? starts[period] - 1 : undefined,
        };
    }
}
