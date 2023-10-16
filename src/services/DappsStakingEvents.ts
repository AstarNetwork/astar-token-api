import { injectable } from 'inversify';
import axios from 'axios';
import { NetworkType } from '../networks';
import { Guard } from '../guard';
import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { PeriodType, ServiceBase } from './ServiceBase';
import { UserEvent } from '../models/DappStaking';
import {
    DappStakingEventData,
    DappStakingEventResponse,
    DappStakingAggregatedData,
    DappStakingAggregatedResponse,
} from './DappStaking/ResponseData';
import container from '../container';

export interface IDappsStakingEvents {
    getStakingEvents(network: NetworkType, address: string, period: PeriodType): Promise<DappStakingEventData[]>;
    getAggregatedData(network: NetworkType, period: PeriodType): Promise<DappStakingAggregatedData[]>;
}

// Handles events to SubSquid giant squid indexer.
@injectable()
export class DappsStakingEvents extends ServiceBase implements IDappsStakingEvents {
    public async getStakingEvents(
        network: NetworkType,
        address: string,
        period: PeriodType,
    ): Promise<DappStakingEventData[]> {
        Guard.ThrowIfUndefined('network', network);
        Guard.ThrowIfUndefined('address', address);

        if (network !== 'astar') {
            return [];
        }

        const range = this.getDateRange(period);

        const query = `query MyQuery {
            stakingEvents(where: {
                userAddress_eq: "${address}",
                timestamp_gte: "${range.start.getTime()}", 
                timestamp_lte: "${range.end.getTime()}"
            }, orderBy: blockNumber_DESC) {
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

        return this.parseStakingEvents(result.data.data.stakingEvents);
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

        return this.parseAggregatedData(result.data.data.groupedStakingEvents);
    }

    private getApiUrl(network: NetworkType): string {
        return `https://squid.subsquid.io/dapps-staking-indexer/graphql`;
    }

    private parseStakingEvents(events: DappStakingEventData[]): DappStakingEventData[] {
        const result: DappStakingEventData[] = [];

        for (const event of events) {
            result.push(event);
        }

        return result;
    }

    private parseAggregatedData(events: DappStakingAggregatedData[]): DappStakingAggregatedData[] {
        const result: DappStakingAggregatedData[] = [];

        for (const event of events) {
            result.push(event);
        }

        return result;
    }
}
