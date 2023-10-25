import { injectable } from 'inversify';
import axios from 'axios';
import { NetworkType } from '../networks';
import { Guard } from '../guard';
import { PeriodType, ServiceBase } from './ServiceBase';
import {
    DappStakingEventData,
    DappStakingEventResponse,
    DappStakingAggregatedData,
    DappStakingAggregatedResponse,
} from './DappStaking/ResponseData';

export interface IDappsStakingEvents {
    getStakingEvents(
        network: NetworkType,
        address: string,
        startDate: string,
        endDate: string,
        limit?: number,
        offset?: number,
    ): Promise<DappStakingEventData[]>;
    getAggregatedData(network: NetworkType, period: PeriodType): Promise<DappStakingAggregatedData[]>;
}

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

    private getApiUrl(network: NetworkType): string {
        return `https://squid.subsquid.io/dapps-staking-indexer/graphql`;
    }
}