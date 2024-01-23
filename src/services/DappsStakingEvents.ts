import { injectable, inject } from 'inversify';
import axios from 'axios';
import { NetworkType } from '../networks';
import { Guard } from '../guard';
import { Pair, PeriodType, ServiceBase } from './ServiceBase';
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
}

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

        try {
            const api = this._apiFactory.getApiInstance(network);
            const stakerInfo = await api.getStakerInfo(address);

            console.log('stakerInfo', stakerInfo);
            return BigInt(0);
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
