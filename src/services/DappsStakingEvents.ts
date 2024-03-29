import { injectable, inject } from 'inversify';
import axios from 'axios';
import { NetworkType } from '../networks';
import { Guard } from '../guard';
import { TotalAmountCount, Triplet, Pair, PeriodType, ServiceBase, List } from './ServiceBase';
import { IApiFactory } from '../client/ApiFactory';
import { ContainerTypes } from '../containertypes';
import {
    DappStakingEventData,
    DappStakingEventResponse,
    DappStakingAggregatedData,
    DappStakingAggregatedResponse,
} from './DappStaking/ResponseData';

export interface IDappsStakingEvents {
    getDapps(network: NetworkType): Promise<[]>;
    getStakingEvents(
        network: NetworkType,
        address: string,
        startDate: string,
        endDate: string,
        limit?: number,
        offset?: number,
    ): Promise<DappStakingEventData[]>;
    getAggregatedData(network: NetworkType, period: PeriodType): Promise<DappStakingAggregatedData[]>;
    getDappStakingTvl(network: NetworkType, period: PeriodType): Promise<Pair[]>;
    getDappStakingStakersCount(network: NetworkType, contractAddress: string, period: PeriodType): Promise<Pair[]>;
    getParticipantStake(network: NetworkType, address: string): Promise<bigint>;
    getDappStakingStakersCountTotal(network: NetworkType, period: PeriodType): Promise<Pair[]>;
    getDappStakingStakersTotal(network: NetworkType, period: PeriodType): Promise<Triplet[]>;
    getDappStakingLockersTotal(network: NetworkType, period: PeriodType): Promise<Triplet[]>;
    getDappStakingLockersAndStakersTotal(network: NetworkType, period: PeriodType): Promise<TotalAmountCount[]>;
    getDappStakingRewards(network: NetworkType, period: PeriodType, transaction: RewardEventType): Promise<Pair[]>;
    getDappStakingRewardsAggregated(network: NetworkType, address: string, period: PeriodType): Promise<Pair[]>;
    getDappStakingStakersList(network: NetworkType, contractAddress: string): Promise<List[]>;
}

export type RewardEventType = 'Reward' | 'BonusReward' | 'DAppReward';

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
    constructor(@inject(ContainerTypes.ApiFactory) private _apiFactory: IApiFactory) {
        super();
    }

    public async getStakingEvents(
        network: NetworkType,
        contractAddress: string,
        startDate: string,
        endDate: string,
        limit?: number,
        offset?: number,
    ): Promise<DappStakingEventData[]> {
        Guard.ThrowIfUndefined('network', network);
        Guard.ThrowIfUndefined('contractAddress', contractAddress);
        Guard.ThrowIfUndefined('startDate', startDate);
        Guard.ThrowIfUndefined('endDate', endDate);

        if (network !== 'astar') {
            return [];
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        const query = `query MyQuery {
            stakingEvents(where: {
                contractAddress_eq: "${contractAddress}",
                timestamp_gte: "${start.getTime()}",
                timestamp_lte: "${end.getTime()}"
            },
            orderBy: blockNumber_DESC,
            limit: ${limit},
            offset: ${offset}) {
              amount
              blockNumber
              contractAddress
              id
              timestamp
              transaction
              userAddress
            }
          }`;

        const result = await axios.post<DappStakingEventResponse>(this.getApiUrl(network), {
            operationName: 'MyQuery',
            query,
        });

        return result.data.data.stakingEvents;
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

    public async getAggregatedData(network: NetworkType, period: PeriodType): Promise<DappStakingAggregatedData[]> {
        Guard.ThrowIfUndefined('network', network);

        if (network !== 'astar') {
            return [];
        }

        const range = this.getDateRange(period);

        const query = `query MyQuery {
            groupedStakingEvents(where: {
                timestamp_gte: "${range.start.getTime()}",
                timestamp_lte: "${range.end.getTime()}"
            }, orderBy: timestamp_DESC) {
              amount
              id
              timestamp
              transaction
            }
          }`;

        const result = await axios.post<DappStakingAggregatedResponse>(this.getApiUrl(network), {
            operationName: 'MyQuery',
            query,
        });

        return result.data.data.groupedStakingEvents;
    }

    public async getDappStakingTvl(network: NetworkType, period: PeriodType): Promise<Pair[]> {
        if (network !== 'astar' && network !== 'shiden' && network !== 'shibuya') {
            return [];
        }

        const range = this.getDateRange(period);

        try {
            const result = await axios.post(this.getApiUrl(network), {
                query: `query {
                    tvlAggregatedDailies(
                      orderBy: id_ASC
                      where: { id_gte: "${range.start.getTime()}", id_lte: "${range.end.getTime()}" }
                    ) {
                      id
                      tvl
                    }
                  }`,
            });

            const indexedTvl = result.data.data.tvlAggregatedDailies.map((node: { id: string; tvl: number }) => {
                return [node.id, node.tvl];
            });

            return indexedTvl;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    public async getDappStakingRewards(
        network: NetworkType,
        period: PeriodType,
        transaction: RewardEventType,
    ): Promise<Pair[]> {
        if (network !== 'astar' && network !== 'shiden' && network !== 'shibuya') {
            return [];
        }

        const range = this.getDateRange(period);

        try {
            const result = await axios.post(this.getApiUrl(network), {
                query: `query MyQuery {
                    rewardEvents(
                        where: {
                            timestamp_gte: "${range.start.getTime()}",
                            timestamp_lte: "${range.end.getTime()}",
                            ${transaction ? `transaction_in: [${transaction}]}` : '}'}
                      orderBy: id_ASC) {
                      amount
                      blockNumber
                      contractAddress
                      era
                      id
                      period
                      tierId
                      timestamp
                      transaction
                      userAddress
                    }
                  }`,
            });

            return result.data.data.rewardEvents;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    public async getDappStakingRewardsAggregated(
        network: NetworkType,
        address: string,
        period: PeriodType,
    ): Promise<Pair[]> {
        if (network !== 'astar' && network !== 'shiden' && network !== 'shibuya') {
            return [];
        }

        const range = this.getDateRange(period);

        try {
            const result = await axios.post(this.getApiUrl(network), {
                query: `query {
                    rewardAggregatedDailies(
                      orderBy: timestamp_DESC
                      where: {
                        beneficiary_eq: "${address}"
                        timestamp_gte: "${range.start.getTime()}"
                        timestamp_lte: "${range.end.getTime()}"
                      }
                    ) {
                      amount
                      timestamp
                    }
                  }`,
            });

            const stakersCount = result.data.data.rewardAggregatedDailies.map(
                (node: { timestamp: string; amount: number }) => {
                    return [node.timestamp, node.amount];
                },
            );

            return stakersCount;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    public async getDappStakingStakersCount(
        network: NetworkType,
        contractAddress: string,
        period: PeriodType,
    ): Promise<Pair[]> {
        if (network !== 'astar' && network !== 'shiden' && network !== 'shibuya') {
            return [];
        }

        const range = this.getDateRange(period);

        try {
            const result = await axios.post(this.getApiUrl(network), {
                query: `query {
                    dappAggregatedDailies(
                      orderBy: timestamp_DESC
                      where: {
                        dappAddress_eq: "${contractAddress}"
                        timestamp_gte: "${range.start.getTime()}"
                        timestamp_lte: "${range.end.getTime()}"
                      }
                    ) {
                      stakersCount
                      timestamp
                    }
                  }`,
            });

            const stakersCount = result.data.data.dappAggregatedDailies.map(
                (node: { timestamp: string; stakersCount: number }) => {
                    return [node.timestamp, node.stakersCount];
                },
            );

            return stakersCount;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    public async getDappStakingStakersList(network: NetworkType, contractAddress: string): Promise<List[]> {
        if (network !== 'astar' && network !== 'shiden' && network !== 'shibuya') {
            return [];
        }

        try {
            const result = await axios.post(this.getApiUrl(network), {
                query: `query {
                    stakes(
                      where: {
                        expiredAt_isNull: true,
                        dappAddress_eq: "${contractAddress}"
                      }
                    ) {
                      stakerAddress
                      amount
                    }
                  }`,
            });

            const sumsByStaker: { [key: string]: bigint } = result.data.data.stakes.reduce(
                (acc: { [key: string]: bigint }, { stakerAddress, amount }: List) => {
                    acc[stakerAddress] = (acc[stakerAddress] || BigInt(0)) + BigInt(amount);
                    return acc;
                },
                {},
            );

            const stakersList: List[] = Object.entries(sumsByStaker)
                .map(([stakerAddress, amount]) => ({
                    stakerAddress,
                    amount,
                }))
                .filter((staker) => staker.amount !== BigInt(0));

            return stakersList;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    public async getDappStakingStakersCountTotal(network: NetworkType, period: PeriodType): Promise<Pair[]> {
        if (network !== 'astar' && network !== 'shiden' && network !== 'shibuya') {
            return [];
        }

        const range = this.getDateRange(period);

        try {
            const result = await axios.post(this.getApiUrl(network), {
                query: `query {
                    stakersCountAggregatedDailies(
                      orderBy: id_DESC
                      where: {
                        id_gte: "${range.start.getTime()}"
                        id_lte: "${range.end.getTime()}"
                      }
                    ) {
                      stakersCount
                      stakersAmount
                      id
                    }
                  }`,
            });

            const stakersCount = result.data.data.stakersCountAggregatedDailies.map(
                (node: { id: string; stakersCount: number; stakersAmount: number }) => {
                    return [node.id, node.stakersCount, node.stakersAmount];
                },
            );

            return stakersCount;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    public async getDappStakingStakersTotal(network: NetworkType, period: PeriodType): Promise<Triplet[]> {
        if (network !== 'astar' && network !== 'shiden' && network !== 'shibuya') {
            return [];
        }

        const range = this.getDateRange(period);

        try {
            const result = await axios.post(this.getApiUrl(network), {
                query: `query {
                    stakersCountAggregatedDailies(
                      orderBy: id_DESC
                      where: {
                        id_gte: "${range.start.getTime()}"
                        id_lte: "${range.end.getTime()}"
                      }
                    ) {
                      date: id
                      count: stakersCount
                      amount: stakersAmount
                    }
                  }`,
            });

            const results: Triplet[] = result.data.data.stakersCountAggregatedDailies;
            return results;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    public async getDappStakingLockersTotal(network: NetworkType, period: PeriodType): Promise<Triplet[]> {
        if (network !== 'astar' && network !== 'shiden' && network !== 'shibuya') {
            return [];
        }

        const range = this.getDateRange(period);

        try {
            const result = await axios.post(this.getApiUrl(network), {
                query: `query {
                    tvlAggregatedDailies(
                      orderBy: id_DESC
                      where: { id_gte: "${range.start.getTime()}", id_lte: "${range.end.getTime()}" }
                    ) {
                      date: id
                      count: lockersCount
                      amount: tvl
                    }
                  }`,
            });

            const results: Triplet[] = result.data.data.tvlAggregatedDailies;
            return results;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    public async getDappStakingLockersAndStakersTotal(
        network: NetworkType,
        period: PeriodType,
    ): Promise<TotalAmountCount[]> {
        if (!['astar', 'shiden', 'shibuya'].includes(network)) {
            return [];
        }

        const range = this.getDateRange(period);

        const query = `query {
            tvlAggregatedDailies(
                orderBy: id_DESC
                where: { id_gte: "${range.start.getTime()}", id_lte: "${range.end.getTime()}" }
            ) {
                date: id
                count: lockersCount
                amount: tvl
            }
            stakersCountAggregatedDailies(
                orderBy: id_DESC
                where: { id_gte: "${range.start.getTime()}", id_lte: "${range.end.getTime()}" }
            ) {
                date: id
                count: stakersCount
                amount: stakersAmount
            }
        }`;

        try {
            const result = await axios.post(this.getApiUrl(network), { query });

            const combinedData: TotalAmountCount[] = [];

            const lockersData: Triplet[] = result.data.data.tvlAggregatedDailies;
            const stakersData: Triplet[] = result.data.data.stakersCountAggregatedDailies;
            const lockersMap = new Map(lockersData.map((item) => [item.date, item]));
            const stakersMap = new Map(stakersData.map((item) => [item.date, item]));

            const allIds = new Set([...lockersMap.keys(), ...stakersMap.keys()]);

            allIds.forEach((date) => {
                combinedData.push({
                    date,
                    tvl: lockersMap.has(date) ? lockersMap.get(date)?.amount : undefined,
                    lockersCount: lockersMap.has(date) ? lockersMap.get(date)?.count : undefined,
                    tvs: stakersMap.has(date) ? stakersMap.get(date)?.amount : undefined,
                    stakersCount: stakersMap.has(date) ? stakersMap.get(date)?.count : undefined,
                });
            });

            return combinedData;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    public async getDapps(network: NetworkType): Promise<[]> {
        if (network !== 'astar' && network !== 'shiden' && network !== 'shibuya') {
            return [];
        }

        try {
            const result = await axios.post(this.getApiUrl(network), {
                query: `query {
                    dapps (orderBy: registeredAt_ASC) {
                        contractAddress: id
                        dappId
                        beneficiary
                        owner
                        state
                        stakersCount
                        registeredAt
                        registrationBlockNumber
                        unregisteredAt
                        unregistrationBlockNumber
                    }
                }`,
            });

            return result.data.data.dapps;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    private getApiUrl(network: NetworkType): string {
        // For local development: `http://localhost:4350/graphql`;
        return ['astar', 'shiden', 'shibuya'].includes(network)
            ? `https://squid.subsquid.io/dapps-staking-indexer-${network}/graphql`
            : '';
    }
}
