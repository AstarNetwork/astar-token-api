import { injectable } from 'inversify';
import axios from 'axios';
import { NetworkType } from '../networks';
import { Guard } from '../guard';
import { Pair, PeriodType, ServiceBase, List } from './ServiceBase';
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

    public async getDapps(network: NetworkType): Promise<[]> {
        if (network !== 'astar' && network !== 'shiden' && network !== 'shibuya') {
            return [];
        }

        try {
            const result = await axios.post(this.getApiUrl(network), {
                query: `query {
                    dapps (orderBy: registeredAt_ASC) {
                        contractAddress: id
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
        switch (network) {
            case 'astar':
                return 'https://squid.subsquid.io/dapps-staking-indexer/graphql';
            case 'shibuya':
                return 'https://squid.subsquid.io/dapps-staking-indexer-shibuya/v/v1/graphql';
            default:
                return 'https://squid.subsquid.io/dapps-staking-indexer/graphql';
        }
    }
}
